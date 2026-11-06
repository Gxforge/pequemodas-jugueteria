import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, Shield, Trash2, Users } from 'lucide-react';
import {
  createAdminInviteLink,
  fetchAdminTeam,
  revokeAdminInvitation
} from '@pequemodas/shared';
import { Alert, Badge, Button, Card, Input, Select } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';
import { useAuth } from '../context/AuthContext';

export function TeamPage() {
  const { store } = useAuth();
  const queryClient = useQueryClient();
  const [intendedName, setIntendedName] = useState('Katia');
  const [role, setRole] = useState<'owner' | 'admin'>('owner');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-team'],
    queryFn: fetchAdminTeam
  });

  const profiles = data?.profiles ?? [];
  const invitations = data?.invitations ?? [];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !intendedName.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const link = await createAdminInviteLink({
        storeId: store.id,
        intendedName,
        role,
        adminBaseUrl: window.location.origin
      });
      setGeneratedLink(link);
      setCopied(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-team'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar invitación.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: string) => {
    await revokeAdminInvitation(id);
    void queryClient.invalidateQueries({ queryKey: ['admin-team'] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Equipo Administrativo
        </h1>
        <p className="text-sm text-slate-600">
          Gestiona las cuentas autorizadas (StudioLexair y Katia) mediante enlaces seguros de un
          solo uso, manteniendo bloqueado cualquier registro público.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-600" />
          Administradores Activos ({profiles.length})
        </h2>
        <div className="divide-y divide-slate-100">
          {profiles.map((p) => (
            <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">{p.full_name || 'Administrador'}</p>
                <p className="text-xs text-slate-500">{p.email}</p>
              </div>
              <Badge tone={p.role === 'owner' ? 'brand' : 'sky'}>
                {p.role === 'owner' ? 'Propietaria (Owner)' : 'Administrador'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-sky-600" />
          Generar Enlace de Registro Único
        </h2>
        <form onSubmit={(e) => void handleGenerate(e)} className="grid sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Nombre destinatario"
            value={intendedName}
            onChange={(e) => setIntendedName(e.target.value)}
            requiredMark
          />
          <Select
            label="Rol asignado"
            value={role}
            onChange={(e) => setRole(e.target.value as 'owner' | 'admin')}
            options={[
              { value: 'owner', label: 'Propietaria (Katia)' },
              { value: 'admin', label: 'Administrador (Soporte)' }
            ]}
          />
          <Button type="submit" variant="secondary" isLoading={busy}>
            Generar enlace único
          </Button>
        </form>

        {generatedLink && (
          <Alert variant="success" title="Enlace listo para enviar por WhatsApp">
            <div className="space-y-2 mt-1">
              <p className="break-all font-mono text-xs bg-white p-2.5 rounded-xl border border-emerald-200">
                {generatedLink}
              </p>
              <Button
                size="sm"
                variant="outline"
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={() => void handleCopy()}
              >
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
            </div>
          </Alert>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          Invitaciones Emitidas
        </h2>
        {invitations.length === 0 ? (
          <p className="text-xs text-slate-500">No hay invitaciones pendientes.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-800">{inv.intended_name}</span>{' '}
                  <Badge tone={inv.used_at ? 'success' : 'warning'}>
                    {inv.used_at ? 'Utilizada' : 'Pendiente'}
                  </Badge>
                  <p className="text-xs text-slate-400">
                    Vence: {formatDateTimeEs(inv.expires_at)}
                  </p>
                </div>
                {!inv.used_at && (
                  <Button size="sm" variant="ghost" onClick={() => void handleRevoke(inv.id)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
