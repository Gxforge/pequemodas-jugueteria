import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App as AdminApp } from './App';

describe('Panel Administrativo — Seguridad y Acceso', () => {
  it('protege las rutas privadas y no ofrece registro público de administradores', async () => {
    render(<AdminApp />);
    // Sin variables VITE_SUPABASE_* muestra alerta controlada de variables pendientes o pantalla protegida
    const warning = await screen.findByText(/Variables de entorno pendientes|Panel Privado de Administración/i);
    expect(warning).toBeInTheDocument();
    expect(screen.queryByText(/Crear cuenta pública/i)).not.toBeInTheDocument();
  });
});
