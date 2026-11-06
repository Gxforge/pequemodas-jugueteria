import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Circle, UserCheck } from 'lucide-react';
import {
  acceptAdminInviteSchema,
  type AcceptAdminInviteInput
} from '@pequemodas/schemas';
import {
  acceptAdminInvitation,
  previewAdminInvitation,
  ROLE_PRESETS,
  type InvitationPreview
} from '@pequemodas/shared';
import {
  Alert,
  AnimatedBrandCloudsLogo,
  Button,
  Card,
  Input
} from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('codigo')?.trim() ?? '';
  const navigate = useNavigate();
  const { configured, signIn } = useAuth();

  const [checking, setChecking] = useState(true);
  const [preview, setPreview] = useState<InvitationPreview>({ valid: false });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AcceptAdminInviteInput>({
    resolver: zodResolver(acceptAdminInviteSchema),
    defaultValues: {
      fullName: 'Katia',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const watchedEmail = (form.watch('email') ?? '').trim().toLowerCase();
  const watchedPassword = form.watch('password') ?? '';
  const watchedConfirm = form.watch('confirmPassword') ?? '';

  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail);
  const lengthReady = watchedPassword.length >= 8;
  const matchReady = lengthReady && watchedPassword === watchedConfirm;

  useEffect(() => {
    if (!configured || !token) {
      setChecking(false);
      return;
    }
    previewAdminInvitation(token)
      .then((res) => {
        setPreview(res);
        if (res.intended_name) {
          form.setValue('fullName', res.intended_name);
        }
      })
      .finally(() => setChecking(false));
  }, [configured, token, form]);

  const onSubmit = async (values: AcceptAdminInviteInput) => {
    setSubmitError(null);
    const cleanEmail = values.email.trim().toLowerCase();
    try {
      await acceptAdminInvitation({
        token,
        fullName: values.fullName.trim(),
        email: cleanEmail,
        password: values.password
      });
      await signIn(cleanEmail, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No se pudo crear la cuenta.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sky-50 flex items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <AnimatedBrandCloudsLogo className="max-w-[290px] mx-auto" />
          <h1 className="font-heading text-xl font-extrabold text-slate-900 pt-1">
            Activar Cuenta en PequeModas
          </h1>
        </div>

        {checking ? (
          <p className="text-center text-sm text-slate-500 py-6">
            Verificando invitación segura...
          </p>
        ) : !preview.valid ? (
          <div className="space-y-4">
            <Alert variant="error" title="Invitación no disponible">
              Este enlace único ya fue utilizado, expiró o es incompleto. Si ya creaste tu
              cuenta antes, entra con tu correo y contraseña abajo; si necesitas uno nuevo,
              pide un enlace renovado.
            </Alert>
            <Link to="/acceso" className="block">
              <Button fullWidth variant="outline">
                Ir a Iniciar Sesión
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Alert variant="info" title={`¡Hola ${preview.intended_name ?? 'Katia'}!`}>
              Estás activando tu acceso como{' '}
              <strong>
                {preview.job_title ||
                  (preview.role ? ROLE_PRESETS[preview.role]?.label : 'Equipo')}
              </strong>
              . Toca el botón <strong>«Ver»</strong> en la contraseña para revisar bien lo que escribes.
            </Alert>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Tu nombre"
                requiredMark
                error={form.formState.errors.fullName?.message}
                {...form.register('fullName')}
              />

              <Input
                label="Tu correo electrónico (con este entrarás siempre)"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="ejemplo@gmail.com"
                requiredMark
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />

              <Input
                label="Crea tu contraseña"
                type="password"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Mínimo 8 letras o números"
                hint="Toca «Ver» a la derecha para mirar la contraseña que estás poniendo."
                requiredMark
                error={form.formState.errors.password?.message}
                {...form.register('password')}
              />

              <Input
                label="Repite la misma contraseña"
                type="password"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Vuelve a escribir tu contraseña"
                requiredMark
                error={form.formState.errors.confirmPassword?.message}
                {...form.register('confirmPassword')}
              />

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
                <p className="font-bold text-slate-700">Comprobación automática:</p>
                <div className="flex items-center gap-2">
                  {emailReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={emailReady ? 'text-emerald-800 font-semibold' : 'text-slate-600'}>
                    Correo completo válido {emailReady ? `(${watchedEmail})` : '(ej. nombre@gmail.com)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {lengthReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={lengthReady ? 'text-emerald-800 font-semibold' : 'text-slate-600'}>
                    Al menos 8 letras o números ({watchedPassword.length}/8)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {matchReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={matchReady ? 'text-emerald-800 font-semibold' : 'text-slate-600'}>
                    Las dos contraseñas coinciden exactamente
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={form.formState.isSubmitting}
                leftIcon={<UserCheck className="h-4 w-4" />}
              >
                Crear mi cuenta y entrar al Panel
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
