import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { BrandLogo, Button } from '@pequemodas/ui';

export interface AdminMobileNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface AdminMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  items: AdminMobileNavItem[];
  profileName: string;
  roleLabel: string;
  logoUrl?: string | null;
  commercialName?: string | null;
  onSignOut: () => void;
}

export function AdminMobileDrawer({
  open,
  onClose,
  items,
  profileName,
  roleLabel,
  logoUrl,
  commercialName,
  onSignOut
}: AdminMobileDrawerProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50" aria-hidden={false}>
      <button
        type="button"
        aria-label="Cerrar menú del panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
      />
      <aside
        id="admin-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-mobile-drawer-title"
        onClick={(event) => event.stopPropagation()}
        className="relative h-full w-[88%] max-w-xs bg-white shadow-elevated flex flex-col border-r border-slate-200"
      >
        <div className="px-4 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <BrandLogo logoUrl={logoUrl} commercialName={commercialName} size="sm" />
            <h2
              id="admin-mobile-drawer-title"
              className="mt-2 font-heading text-sm font-extrabold text-slate-900 truncate"
            >
              Menú del panel
            </h2>
            <p className="mt-0.5 text-[11px] font-bold text-slate-500 truncate">
              {profileName} · {roleLabel}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="Menú principal móvil"
          className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        >
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
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
            onClick={() => {
              onClose();
              onSignOut();
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </div>
  );
}
