import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail } from 'lucide-react';
import {
  loginSchema,
  passwordRecoverySchema,
  type LoginInput,
  type PasswordRecoveryInput
} from '@pequemodas/schemas';
import { Alert, BrandLogo, Button, Card, Input, Modal } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { configured, session, profile, authError, signIn, sendPasswordRecovery } =
    useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const recoveryForm = useForm<PasswordRecoveryInput>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: '' }
  });

  if (configured && session && profile) {
    return <Navigate to="/" replace />;
  }

  const onLoginSubmit = async (values: LoginInput) => {
    setSubmitError(null);
    try {
      await signIn(values.email, values.password);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    }
  };

  const onRecoverySubmit = async (values: PasswordRecoveryInput) => {
    setRecoveryError(null);
    try {
      await sendPasswordRecovery(values.email);
      setRecoverySent(true);
    } catch (err) {
      setRecoveryError(
        err instanceof Error ? err.message : 'No se pudo enviar el enlace.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sky-50 flex items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <h1 className="font-heading text-xl font-extrabold text-slate-900 pt-2">
            Panel Privado de Administración
          </h1>
          <p className="text-sm text-slate-500">
            Acceso exclusivo para gestionar el catálogo de PequeModas-Juguetería.
          </p>
        </div>

        {!configured && (
          <Alert variant="warning" title="Conexión pendiente">
            Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            para habilitar la autenticación.
          </Alert>
        )}

        {(authError || submitError) && (
          <Alert variant="error">{submitError ?? authError}</Alert>
        )}

        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            requiredMark
            error={loginForm.formState.errors.email?.message}
            {...loginForm.register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            requiredMark
            error={loginForm.formState.errors.password?.message}
            {...loginForm.register('password')}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={!configured}
            isLoading={loginForm.formState.isSubmitting}
            leftIcon={<Lock className="h-4 w-4" />}
          >
            Entrar al Panel
          </Button>
        </form>

        <div className="text-center border-t border-slate-100 pt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              setRecoverySent(false);
              setRecoveryError(null);
              setRecoveryOpen(true);
            }}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            ¿Olvidaste tu contraseña? Recuperar acceso
          </button>
          <p className="text-xs text-slate-400">
            Sin registro público · Desarrollado por StudioLexair
          </p>
        </div>
      </Card>

      <Modal
        isOpen={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        title="Recuperar acceso administrativo"
        description="Te enviaremos un enlace seguro de Supabase a tu correo registrado."
      >
        {recoverySent ? (
          <Alert variant="success" title="Enlace enviado">
            Si el correo corresponde a la cuenta administradora, recibirás instrucciones
            para restablecer tu contraseña.
          </Alert>
        ) : (
          <form onSubmit={recoveryForm.handleSubmit(onRecoverySubmit)} className="space-y-4">
            {recoveryError && <Alert variant="error">{recoveryError}</Alert>}
            <Input
              label="Correo electrónico registrado"
              type="email"
              placeholder="correo@ejemplo.com"
              requiredMark
              error={recoveryForm.formState.errors.email?.message}
              {...recoveryForm.register('email')}
            />
            <Button
              type="submit"
              fullWidth
              isLoading={recoveryForm.formState.isSubmitting}
              leftIcon={<Mail className="h-4 w-4" />}
            >
              Enviar enlace de recuperación
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
