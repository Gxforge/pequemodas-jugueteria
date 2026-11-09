import React, { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderTree,
  Home,
  Search,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { APP_RELEASE, BRAND_IDENTITY } from '@pequemodas/config';
import { BrandLogo } from '@pequemodas/ui';
import { useCart } from '../context/CartContext';
import { useStorefront } from '../context/StorefrontContext';
import { CustomerChatWidget } from './CustomerChatWidget';
import { NetworkResilienceBar } from './NetworkResilienceBar';
import { PwaAppCard } from './PwaAppCard';
import { SmartSearchBox } from './SmartSearchBox';

export function StorefrontLayout() {
  const { settings } = useStorefront();
  const { totalQuantity } = useCart();
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;

  const handleQuickSearch = (term: string) => {
    const q = term.trim();
    navigate(q ? `/buscar?q=${encodeURIComponent(q)}` : '/catalogo');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <NetworkResilienceBar />
      <PwaAppCard />
      <CustomerChatWidget />

      {/* Cabecera Superior Limpia: Logo + Carrito en móvil; Buscador y enlaces en escritorio */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-100/80">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <Link to="/" aria-label={`Ir al inicio de ${storeName}`} className="shrink-0">
            <BrandLogo logoUrl={settings?.logo_url} commercialName={storeName} size="md" />
          </Link>

          <div className="hidden md:block flex-1 max-w-md mx-4">
            <SmartSearchBox
              value={quickQuery}
              onChange={setQuickQuery}
              onSubmitSearch={handleQuickSearch}
              compact
            />
          </div>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-700">
            <NavLink to="/catalogo" className="hover:text-brand-600">
              Catálogo
            </NavLink>
            <NavLink to="/categorias" className="hover:text-brand-600">
              Categorías
            </NavLink>
            <NavLink to="/informacion-pedidos" className="hover:text-brand-600">
              Cómo pedir
            </NavLink>
            <NavLink to="/contacto" className="hover:text-brand-600">
              Contacto
            </NavLink>
          </nav>

          <Link
            to="/carrito"
            aria-label={`Carrito con ${totalQuantity} artículos`}
            className="relative inline-flex items-center gap-2 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-700 px-3.5 py-2 text-sm font-bold transition-colors shrink-0"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {totalQuantity > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-extrabold text-white">
                {totalQuantity}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Contenido de Página (Suspense interno para no desmontar jamás cabecera ni barra inferior) */}
      <main className="flex-1 pb-24 md:pb-12">
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-4 py-12 text-center text-sm font-semibold text-slate-500">
              Abriendo sección...
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Pie de Página */}
      <footer className="border-t border-slate-200 bg-white pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2.5">
            <BrandLogo logoUrl={settings?.logo_url} commercialName={storeName} size="sm" />
            <p className="text-slate-600 leading-relaxed">
              {settings?.description ||
                'Ropa infantil, juguetes y accesorios pensados con cariño para los más pequeños.'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-heading font-bold text-slate-900">Secciones</p>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <Link to="/catalogo" className="hover:text-brand-600">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="hover:text-brand-600">
                  Categorías y subcategorías
                </Link>
              </li>
              <li>
                <Link to="/informacion-pedidos" className="hover:text-brand-600">
                  Cómo pedir paso a paso
                </Link>
              </li>
              <li>
                <Link to="/tienda" className="hover:text-brand-600">
                  Información de la tienda
                </Link>
              </li>
              <li>
                <Link to="/instalar" className="hover:text-brand-600">
                  Instalar la aplicación
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-heading font-bold text-slate-900">Atención y Legal</p>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <Link to="/contacto" className="hover:text-brand-600">
                  Contacto y horarios
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="hover:text-brand-600">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/guia-visual" className="hover:text-brand-600">
                  Sistema de diseño
                </Link>
              </li>
            </ul>
            <p className="pt-2 text-xs text-slate-400">
              © {new Date().getFullYear()} {storeName} · {APP_RELEASE.appLabel} v
              {APP_RELEASE.version} · StudioLexair
            </p>
          </div>
        </div>
      </footer>

      {/* Barra Inferior Móvil de 5 Botones: Inicio, Catálogo, Categorías, Cómo pedir y Buscar */}
      <nav
        aria-label="Navegación rápida móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-5 px-1 py-1.5 shadow-elevated"
      >
        {[
          { to: '/', label: 'Inicio', icon: Home, end: true },
          { to: '/catalogo', label: 'Catálogo', icon: Sparkles },
          { to: '/categorias', label: 'Categorías', icon: FolderTree },
          { to: '/informacion-pedidos', label: 'Cómo pedir', icon: BookOpen },
          { to: '/buscar', label: 'Buscar', icon: Search }
        ].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 rounded-xl text-[10.5px] font-bold transition-colors ${
                isActive ? 'text-brand-600 bg-brand-50/80' : 'text-slate-500 hover:text-brand-600'
              }`
            }
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="truncate max-w-[70px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
