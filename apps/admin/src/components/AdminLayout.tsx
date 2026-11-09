import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Boxes,
  Database,
  Eye,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Settings,
  Users
} from 'lucide-react';
import {
  resolveEffectivePermissions,
  ROLE_PRESETS,
  type TeamPermissions
} from '@pequemodas/shared';
import { BrandLogo, Button } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';
import { AdminLiveUpdateCard } from './AdminLiveUpdateCard';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import {
  AdminPanelErrorBoundary,
  AdminRightWorkspaceLoader,
  useAdminDataWarmup
} from './AdminWorkspaceGuard';
import { NotificationManagerBell } from './NotificationManagerBell';

interface NavEntry {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  requiredPerm?: keyof TeamPermissions;
}

const ALL_NAV_ITEMS: NavEntry[] = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/mensajes', label: 'Chat Clientes', icon: MessageCircle, requiredPerm: 'chat' },
  { to: '/productos', label: 'Productos', icon: Package, requiredPerm: 'products' },
  { to: '/categorias', label: 'Categorías', icon: FolderTree, requiredPerm: 'categories' },
  { to: '/inventario', label: 'Inventario', icon: Boxes, requiredPerm: 'inventory' },
  { to: '/bases-de-datos', label: 'Base de Datos', icon: Database },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/pedidos', label: 'WhatsApp Ext.', icon: MessageSquare, requiredPerm: 'chat' },
  { to: '/vista-previa', label: 'Vista Previa', icon: Eye },
  { to: '/equipo', label: 'Equipo', icon: Users, requiredPerm: 'team' },
  { to: '/configuracion', label: 'Ajustes', icon: Settings, requiredPerm: 'settings' }
];

export function AdminLayout() {
  const { profile, settings, session, signOut } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useAdminDataWarmup(Boolean(session && profile));

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const perms = useMemo(() => resolveEffectivePermissions(profile), [profile]);

  const visibleItems = useMemo(
    () =>
      ALL_NAV_ITEMS.filter(
        (item) => !item.requiredPerm || Boolean(perms[item.requiredPerm])
      ),
    [perms]
  );

  const roleLabel =
    profile?.job_title ||
    (profile?.role ? ROLE_PRESETS[profile.role]?.label : null) ||
    'Administración';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <AdminLiveUpdateCard />

      {/* Menú lateral de escritorio: always visible, only the right panel can load. */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <BrandLogo
              logoUrl={settings?.logo_url}
              commercialName={settings?.commercial_name}
              size="sm"
            />
            <p className="mt-1.5 text-[11px] font-bold text-slate-500 truncate">
              {profile?.full_name || 'Katia'} · {roleLabel}
            </p>
          </div>
          <NotificationManagerBell />
        </div>

        <nav
          className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto"
          aria-label="Menú principal"
        >
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
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

      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Abrir menú del panel"
            aria-controls="admin-mobile-drawer"
            aria-expanded={drawerOpen}
            leftIcon={<Menu className="h-5 w-5" />}
            onClick={() => setDrawerOpen(true)}
          />
          <BrandLogo
            logoUrl={settings?.logo_url}
            commercialName={settings?.commercial_name}
            size="sm"
          />
        </div>
        <NotificationManagerBell />
      </header>

      <AdminMobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        items={visibleItems}
        profileName={profile?.full_name || 'Katia'}
        roleLabel={roleLabel}
        logoUrl={settings?.logo_url}
        commercialName={settings?.commercial_name}
        onSignOut={() => void signOut()}
      />

      <main className="flex-1 lg:pl-64 pb-8 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
          <AdminPanelErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<AdminRightWorkspaceLoader />}>
              <Outlet />
            </Suspense>
          </AdminPanelErrorBoundary>
        </div>
      </main>
    </div>
  );
}
