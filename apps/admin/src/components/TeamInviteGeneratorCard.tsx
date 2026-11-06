import React, { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import {
  createAdminInviteLink,
  ROLE_PRESETS,
  type TeamPermissions,
  type TeamRole
} from '@pequemodas/shared';
import { Alert, Button, Card, Input } from '@pequemodas/ui';
import { TeamPermissionsChecklist } from './TeamPermissionsChecklist';

interface TeamInviteGeneratorCardProps {
  storeId?: string;
  onCreated: () => void;
  onError: (msg: string | null) => void;
}

export function TeamInviteGeneratorCard({
  storeId,
  onCreated,
  onError
}: TeamInviteGeneratorCardProps) {
  const [intendedName, setIntendedName] = useState('');
  const [role, setRole] = useState<TeamRole>('sales');
  const [jobTitle, setJobTitle] = useState<string>(ROLE_PRESETS.sales.label);
  const [permissions, setPermissions] = useState<TeamPermissions>({
    ...ROLE_PRESETS.sales.defaultPermissions
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !intendedName.trim()) {
      onError('Escribe el nombre de la persona que vas a invitar.');
      return;
    }
    onError(null);
    setBusy(true);
    try {
      const link = await createAdminInviteLink({
        storeId,
        intendedName,
        role,
        jobTitle,
        permissions,
        adminBaseUrl: window.location.origin
      });
      setGeneratedLink(link);
      setCopied(false);
      setIntendedName('');
      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al generar invitación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-sky-600" />
        Invitar Nueva Persona y Elegir sus Trabajos
      </h2>
      <form onSubmit={(e) => void handleGenerate(e)} className="space-y-4">
        <Input
          label="¿Cómo se llama la persona?"
          placeholder="Ej. Katia, Ana (Ventas), Carlos (Inventario)"
          value={intendedName}
          onChange={(e) => setIntendedName(e.target.value)}
          requiredMark
        />

        <TeamPermissionsChecklist
          role={role}
          jobTitle={jobTitle}
          permissions={permissions}
          onRoleChange={(nextR, nextP, nextT) => {
            setRole(nextR);
            setPermissions(nextP);
            setJobTitle(nextT);
          }}
          onJobTitleChange={setJobTitle}
          onTogglePermission={(k, v) =>
            setPermissions((prev) => ({ ...prev, [k]: v }))
          }
        />

        <Button type="submit" variant="secondary" isLoading={busy}>
          Crear enlace personal de invitación
        </Button>
      </form>

      {generatedLink && (
        <Alert variant="success" title="¡Enlace único creado! Envíalo por WhatsApp">
          <div className="space-y-2 mt-1">
            <p className="break-all font-mono text-xs bg-white p-2.5 rounded-xl border border-emerald-200">
              {generatedLink}
            </p>
            <Button
              size="sm"
              variant="outline"
              leftIcon={
                copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
              }
              onClick={async () => {
                await navigator.clipboard.writeText(generatedLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </Button>
          </div>
        </Alert>
      )}
    </Card>
  );
}
