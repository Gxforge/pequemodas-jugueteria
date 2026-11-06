import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2, Shield, Trash2, Users } from 'lucide-react';
import {
  fetchAdminTeam,
  resolveEffectivePermissions,
  revokeAdminInvitation,
  ROLE_PRESETS,
  updateTeamMemberAccess,
  type ProfileRow,
  type TeamPermissions,
  type TeamRole
} from '@pequemodas/shared';
import { Alert, Badge, Button, Card, Modal } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';
import { TeamInviteGeneratorCard } from '../components/TeamInviteGeneratorCard';
import {
  TASK_PERMISSION_ITEMS,
  TeamPermissionsChecklist
} from '../components/TeamPermissionsChecklist';
import { useAuth } from '../context/AuthContext';

export function TeamPage() {
  const { store } = useAuth();
  const queryClient = useQueryClient();

  const [editingMember, setEditingMember] = useState<ProfileRow | null>(null);
  const [editRole, setEditRole] = useState<TeamRole>('admin');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editPerms, setEditPerms] = useState<TeamPermissions>({
    ...ROLE_PRESETS.admin.defaultPermissions
  });
  const [editActive, setEditActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-team'],
    queryFn: fetchAdminTeam
  });

  const profiles = data?.profiles ?? [];
  const invitations = data?.invitations ?? [];

  const openMemberEditor = (member: ProfileRow) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditJobTitle(member.job_title || ROLE_PRESETS[member.role]?.label || 'Equipo');
    setEditPerms(resolveEffectivePermissions(member));
    setEditActive(member.is_active);
  };

  const saveMemberMut = useMutation({
    mutationFn: async () => {
      if (!editingMember) return;
      await updateTeamMemberAccess({
        profileId: editingMember.id,
        role: editRole,
        jobTitle: editJobTitle,
        permissions: editPerms,
        isActive: editActive
      });
    },
    onSuccess: () => {
      setEditingMember(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-team'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar las tareas.');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Equipo y Asignación de Tareas
        </h1>
        <p className="text-sm text-slate-600">
          Invita personas de confianza (Ventas, Catálogo, Moderador) y elige exactamente qué pantallas y trabajos pueden hacer.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-600" />
          Personas con Acceso ({profiles.length})
        </h2>
        <div className="divide-y divide-slate-100">
          {profiles.map((p) => {
            const eff = resolveEffectivePermissions(p);
            const activeLabels = TASK_PERMISSION_ITEMS.filter((t) => eff[t.key]).map(
              (t) => t.title.split(' ')[0] + ' ' + (t.title.split(' ')[1] ?? '')
            );
            return (
              <div
                key={p.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-extrabold text-slate-900">
                      {p.full_name || 'Equipo'}
                    </p>
                    <Badge tone={p.role === 'owner' ? 'brand' : 'sky'}>
                      {p.job_title || ROLE_PRESETS[p.role]?.label || 'Administrador'}
                    </Badge>
                    {!p.is_active && <Badge tone="danger">Acceso pausado</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{p.email}</p>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeLabels.map((lbl) => (
                      <span
                        key={lbl}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                      >
                        ✓ {lbl}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Settings2 className="h-4 w-4" />}
                  onClick={() => openMemberEditor(p)}
                >
                  Asignar tareas
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <TeamInviteGeneratorCard
        storeId={store?.id}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: ['admin-team'] })}
        onError={setError}
      />

      <Card className="space-y-3">
        <h2 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          Invitaciones Enviadas
        </h2>
        {invitations.length === 0 ? (
          <p className="text-xs text-slate-500">No hay invitaciones pendientes.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800">{inv.intended_name}</span>{' '}
                  <Badge tone="sky">
                    {inv.job_title || ROLE_PRESETS[inv.role]?.label || inv.role}
                  </Badge>{' '}
                  <Badge tone={inv.used_at ? 'success' : 'warning'}>
                    {inv.used_at ? 'Ya activó su cuenta' : 'Pendiente de abrir'}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vence: {formatDateTimeEs(inv.expires_at)}
                  </p>
                </div>
                {!inv.used_at && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await revokeAdminInvitation(inv.id);
                      void queryClient.invalidateQueries({ queryKey: ['admin-team'] });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title={`Tareas permitidas para ${editingMember?.full_name || 'miembro'}`}
      >
        <div className="space-y-4">
          <TeamPermissionsChecklist
            role={editRole}
            jobTitle={editJobTitle}
            permissions={editPerms}
            onRoleChange={(nextR, nextP, nextT) => {
              setEditRole(nextR);
              setEditPerms(nextP);
              setEditJobTitle(nextT);
            }}
            onJobTitleChange={setEditJobTitle}
            onTogglePermission={(k, v) =>
              setEditPerms((prev) => ({ ...prev, [k]: v }))
            }
          />
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Permitir que esta persona entre al panel
          </label>
          <Button
            fullWidth
            isLoading={saveMemberMut.isPending}
            onClick={() => saveMemberMut.mutate()}
          >
            Guardar permisos y tareas
          </Button>
        </div>
      </Modal>
    </div>
  );
}
