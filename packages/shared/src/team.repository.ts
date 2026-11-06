import { getClientEnv, getSupabaseClient } from './supabase-client';
import type { ProfileRow, TeamPermissions, TeamRole } from './types';

export interface AdminInvitationRow {
  id: string;
  store_id: string;
  intended_name: string;
  role: TeamRole;
  job_title?: string | null;
  permissions?: Partial<TeamPermissions> | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface InvitationPreview {
  valid: boolean;
  intended_name?: string;
  role?: TeamRole;
  job_title?: string | null;
  permissions?: Partial<TeamPermissions> | null;
  expires_at?: string;
}

export const ROLE_PRESETS: Record<
  TeamRole,
  {
    label: string;
    description: string;
    defaultPermissions: TeamPermissions;
  }
> = {
  owner: {
    label: 'Dueña Principal',
    description: 'Control completo de productos, inventario, chat, equipo y ajustes.',
    defaultPermissions: {
      chat: true,
      products: true,
      categories: true,
      inventory: true,
      settings: true,
      team: true
    }
  },
  admin: {
    label: 'Administrador General',
    description: 'Apoyo integral en tienda, catálogo, atención y configuración.',
    defaultPermissions: {
      chat: true,
      products: true,
      categories: true,
      inventory: true,
      settings: true,
      team: true
    }
  },
  sales: {
    label: 'Ventas y Atención al Cliente',
    description: 'Responde chats de clientes, confirma pedidos y actualiza cantidades vendidas.',
    defaultPermissions: {
      chat: true,
      products: false,
      categories: false,
      inventory: true,
      settings: false,
      team: false
    }
  },
  catalog: {
    label: 'Encargado de Catálogo y Fotos',
    description: 'Sube ropa o juguetes, organiza fotos, precios, tallas y secciones.',
    defaultPermissions: {
      chat: false,
      products: true,
      categories: true,
      inventory: true,
      settings: false,
      team: false
    }
  },
  moderator: {
    label: 'Moderador / Ayudante a Medida',
    description: 'Tú decides exactamente qué pantallas y tareas puede realizar.',
    defaultPermissions: {
      chat: true,
      products: true,
      categories: false,
      inventory: false,
      settings: false,
      team: false
    }
  }
};

export function resolveEffectivePermissions(profile: ProfileRow | null): TeamPermissions {
  if (!profile) return ROLE_PRESETS.owner.defaultPermissions;
  if (profile.role === 'owner') return ROLE_PRESETS.owner.defaultPermissions;
  const preset = ROLE_PRESETS[profile.role]?.defaultPermissions ?? ROLE_PRESETS.admin.defaultPermissions;
  const p = profile.permissions ?? {};
  return {
    chat: p.chat ?? preset.chat,
    products: p.products ?? preset.products,
    categories: p.categories ?? preset.categories,
    inventory: p.inventory ?? preset.inventory,
    settings: p.settings ?? preset.settings,
    team: p.team ?? preset.team
  };
}

async function sha256HexBrowser(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSecureToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function previewAdminInvitation(token: string): Promise<InvitationPreview> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('preview_admin_invitation', {
    p_token: token.trim()
  });
  if (error || !data) return { valid: false };
  return data as InvitationPreview;
}

export async function acceptAdminInvitation(params: {
  token: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<void> {
  const env = getClientEnv();
  const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/accept-admin-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      ...params,
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase()
    })
  });

  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(
      payload.error ?? 'No se pudo completar el registro con esta invitación.'
    );
  }
}

export async function fetchAdminTeam(): Promise<{
  profiles: ProfileRow[];
  invitations: AdminInvitationRow[];
}> {
  const supabase = getSupabaseClient();
  const [profRes, invRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: true }),
    supabase
      .from('admin_invitations')
      .select(
        'id, store_id, intended_name, role, job_title, permissions, expires_at, used_at, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  if (profRes.error) throw new Error(profRes.error.message);
  return {
    profiles: (profRes.data ?? []) as ProfileRow[],
    invitations: (invRes.data ?? []) as AdminInvitationRow[]
  };
}

export async function createAdminInviteLink(params: {
  storeId: string;
  intendedName: string;
  role: TeamRole;
  jobTitle?: string;
  permissions: TeamPermissions;
  adminBaseUrl: string;
}): Promise<string> {
  const supabase = getSupabaseClient();
  const rawToken = generateSecureToken();
  const tokenHash = await sha256HexBrowser(rawToken);

  const { error } = await supabase.from('admin_invitations').insert({
    store_id: params.storeId,
    token_hash: tokenHash,
    intended_name: params.intendedName.trim(),
    role: params.role,
    job_title: params.jobTitle?.trim() || ROLE_PRESETS[params.role].label,
    permissions: params.permissions
  });

  if (error) {
    throw new Error(`No se pudo generar la invitación: ${error.message}`);
  }

  const cleanBase = params.adminBaseUrl.replace(/\/+$/, '');
  return `${cleanBase}/invitacion?codigo=${rawToken}`;
}

export async function updateTeamMemberAccess(params: {
  profileId: string;
  role: TeamRole;
  jobTitle: string;
  permissions: TeamPermissions;
  isActive: boolean;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      role: params.role,
      job_title: params.jobTitle.trim() || ROLE_PRESETS[params.role].label,
      permissions: params.permissions,
      is_active: params.isActive
    })
    .eq('id', params.profileId);

  if (error) {
    throw new Error(`No se pudieron guardar los permisos: ${error.message}`);
  }
}

export async function revokeAdminInvitation(inviteId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('admin_invitations')
    .delete()
    .eq('id', inviteId);
  if (error) throw new Error(error.message);
}
