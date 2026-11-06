import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const token = String(body?.token ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    const fullName = String(body?.fullName ?? '').trim();

    if (
      token.length < 16 ||
      !email.includes('@') ||
      password.length < 8 ||
      fullName.length < 2
    ) {
      return new Response(
        JSON.stringify({
          error: 'Completa todos los campos válidos (contraseña mínimo 8 caracteres).'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const tokenHash = await sha256Hex(token);

    const { data: invite, error: invErr } = await adminClient
      .from('admin_invitations')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (invErr || !invite) {
      return new Response(
        JSON.stringify({
          error: 'Este enlace de invitación no es válido, ya fue usado o expiró.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: created, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

    if (createErr || !created?.user) {
      const msg = createErr?.message?.includes('already')
        ? 'Ese correo electrónico ya tiene una cuenta registrada.'
        : (createErr?.message ?? 'No se pudo crear la cuenta.');
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = created.user.id;

    const { error: profErr } = await adminClient.from('profiles').upsert({
      id: userId,
      store_id: invite.store_id,
      email,
      full_name: fullName,
      role: invite.role,
      job_title: invite.job_title ?? null,
      permissions: invite.permissions ?? {
        chat: true,
        products: true,
        categories: true,
        inventory: true,
        settings: invite.role === 'owner' || invite.role === 'admin',
        team: invite.role === 'owner' || invite.role === 'admin'
      },
      is_active: true
    });

    if (profErr) {
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Error al activar el perfil del equipo.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await adminClient
      .from('admin_invitations')
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq('id', invite.id);

    await adminClient.from('audit_logs').insert({
      store_id: invite.store_id,
      actor_id: userId,
      action: 'team.accept_invite',
      entity_type: 'profile',
      entity_id: userId,
      metadata: { email, role: invite.role, name: fullName }
    });

    return new Response(JSON.stringify({ ok: true, email, role: invite.role }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
