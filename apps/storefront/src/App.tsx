import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppBootSplash } from './components/AppBootSplash';
import { StorefrontLayout } from './components/StorefrontLayout';
import { CartProvider } from './context/CartContext';
import { StorefrontProvider } from './context/StorefrontContext';
import { HomePage } from './pages/HomePage';

const loadCatalog = () =>
  import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage }));
const loadCategories = () =>
  import('./pages/CategoriesIndexPage').then((m) => ({
    default: m.CategoriesIndexPage
  }));
const loadCategoryDetail = () =>
  import('./pages/CategoryDetailPage').then((m) => ({
    default: m.CategoryDetailPage
  }));
const loadSearch = () =>
  import('./pages/SearchResultsPage').then((m) => ({
    default: m.SearchResultsPage
  }));
const loadProductDetail = () =>
  import('./pages/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage
  }));
const loadCart = () =>
  import('./pages/CartPage').then((m) => ({ default: m.CartPage }));

const CatalogPage = lazy(loadCatalog);
const CategoriesIndexPage = lazy(loadCategories);
const CategoryDetailPage = lazy(loadCategoryDetail);
const SearchResultsPage = lazy(loadSearch);
const ProductDetailPage = lazy(loadProductDetail);
const CartPage = lazy(loadCart);
const StoreInfoPage = lazy(() =>
  import('./pages/StoreInfoPage').then((m) => ({ default: m.StoreInfoPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const OrderGuidePage = lazy(() =>
  import('./pages/OrderGuidePage').then((m) => ({ default: m.OrderGuidePage }))
);
const DesignSystemPage = lazy(() =>
  import('@pequemodas/ui').then((m) => ({ default: m.DesignSystemShowcase }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 25_000,
      gcTime: 1000 * 60 * 30,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 6000)
    }
  }
});

function PageFallback() {
  return (
    <div className="py-16 text-center text-sm font-semibold text-slate-500">
      Cargando sección...
    </div>
  );
}

export function App() {
  useEffect(() => {
    // Pre-calienta los módulos esenciales de compra tras el primer pintado para soporte Offline-First real
    const timer = window.setTimeout(() => {
      if (navigator.onLine) {
        void Promise.allSettled([
          loadCatalog(),
          loadCart(),
          loadProductDetail(),
          loadCategories(),
          loadCategoryDetail(),
          loadSearch()
        ]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StorefrontProvider>
        <CartProvider>
          <AppBootSplash />
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<StorefrontLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="catalogo" element={<CatalogPage />} />
                  <Route path="categorias" element={<CategoriesIndexPage />} />
                  <Route path="categorias/:categorySlug" element={<CategoryDetailPage />} />
                  <Route
                    path="categorias/:categorySlug/:subcategorySlug"
                    element={<CategoryDetailPage />}
                  />
                  <Route path="buscar" element={<SearchResultsPage />} />
                  <Route path="producto/:slug" element={<ProductDetailPage />} />
                  <Route path="carrito" element={<CartPage />} />
                  <Route path="tienda" element={<StoreInfoPage />} />
                  <Route path="contacto" element={<ContactPage />} />
                  <Route path="privacidad" element={<PrivacyPolicyPage />} />
                  <Route path="informacion-pedidos" element={<OrderGuidePage />} />
                  <Route path="guia-visual" element={<DesignSystemPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </StorefrontProvider>
    </QueryClientProvider>
  );
}
