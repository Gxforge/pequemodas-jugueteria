import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordSchema, type UpdatePasswordInput } from '@pequemodas/schemas';
import { Alert, BrandLogo, Button, Card, Input } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

export function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (values: UpdatePasswordInput) => {
    setError(null);
    try {
      await updatePassword(values.password);
      setDone(true);
      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la clave.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card padding="lg" className="w-full max-w-md space-y-5">
        <BrandLogo className="justify-center" />
        <h1 className="font-heading text-xl font-bold text-center text-slate-900">
          Actualizar contraseña
        </h1>
        {done ? (
          <Alert variant="success" title="Contraseña actualizada">
            Redirigiendo al panel administrativo...
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Input
              label="Nueva contraseña"
              type="password"
              requiredMark
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              requiredMark
              error={form.formState.errors.confirmPassword?.message}
              {...form.register('confirmPassword')}
            />
            <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
              Guardar nueva contraseña
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
