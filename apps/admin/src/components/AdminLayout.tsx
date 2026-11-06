import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Palette,
  Settings,
  Users
} from 'lucide-react';
import { BrandLogo, Button } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/categorias', label: 'Categorías', icon: FolderTree },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
  { to: '/pedidos', label: 'Solicitudes', icon: MessageSquare },
  { to: '/equipo', label: 'Equipo', icon: Users },
  { to: '/configuracion', label: 'Ajustes', icon: Settings },
  { to: '/sistema-diseno', label: 'Guía Visual', icon: Palette }
];

export function AdminLayout() {
  const { profile, settings, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar de Escritorio */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
        <div className="px-5 py-5 border-b border-slate-100">
          <BrandLogo
            logoUrl={settings?.logo_url}
            commercialName={settings?.commercial_name}
            size="sm"
          />
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Panel Administrativo · {profile?.full_name || 'Katia'}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menú principal">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => void signOut()}
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Cabecera Móvil Android */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <BrandLogo
          logoUrl={settings?.logo_url}
          commercialName={settings?.commercial_name}
          size="sm"
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label="Cerrar sesión"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => void signOut()}
        >
          Salir
        </Button>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
          <Outlet />
        </div>
      </main>

      {/* Barra Inferior Táctil para Android */}
      <nav
        aria-label="Navegación móvil"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-5 px-1 py-1.5 shadow-elevated"
      >
        {[NAV_ITEMS[0]!, NAV_ITEMS[1]!, NAV_ITEMS[2]!, NAV_ITEMS[3]!, NAV_ITEMS[6]!].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-semibold ${
                isActive ? 'text-brand-600 bg-brand-50/70' : 'text-slate-500'
              }`
            }
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="truncate max-w-[64px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
