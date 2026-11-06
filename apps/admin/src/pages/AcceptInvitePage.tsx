import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck } from 'lucide-react';
import {
  acceptAdminInviteSchema,
  type AcceptAdminInviteInput
} from '@pequemodas/schemas';
import {
  acceptAdminInvitation,
  previewAdminInvitation,
  type InvitationPreview
} from '@pequemodas/shared';
import { Alert, BrandLogo, Button, Card, Input } from '@pequemodas/ui';
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
    try {
      await acceptAdminInvitation({
        token,
        fullName: values.fullName,
        email: values.email,
        password: values.password
      });
      await signIn(values.email, values.password);
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
          <BrandLogo size="lg" className="justify-center" />
          <h1 className="font-heading text-xl font-extrabold text-slate-900 pt-2">
            Activación de Cuenta Administrativa
          </h1>
        </div>

        {checking ? (
          <p className="text-center text-sm text-slate-500 py-6">
            Verificando invitación segura...
          </p>
        ) : !preview.valid ? (
          <div className="space-y-4">
            <Alert variant="error" title="Invitación no disponible">
              Este enlace único ya fue utilizado, expiró o es incorrecto. Si ya creaste tu
              cuenta, entra normalmente desde la pantalla de acceso.
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
              Crea tu acceso personal ({preview.role === 'owner' ? 'Propietaria' : 'Administrador'}).
              Este enlace es de un solo uso para proteger tu tienda.
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
                label="Tu correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="ejemplo@gmail.com"
                requiredMark
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
              <Input
                label="Crea tu contraseña"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                requiredMark
                error={form.formState.errors.password?.message}
                {...form.register('password')}
              />
              <Input
                label="Repite tu contraseña"
                type="password"
                autoComplete="new-password"
                placeholder="Confirma tu contraseña"
                requiredMark
                error={form.formState.errors.confirmPassword?.message}
                {...form.register('confirmPassword')}
              />

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
