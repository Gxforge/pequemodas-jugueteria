import React, { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppBootSplash } from './components/AppBootSplash';
import { StorefrontLayout } from './components/StorefrontLayout';
import { CartProvider } from './context/CartContext';
import { StorefrontProvider } from './context/StorefrontContext';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { CategoriesIndexPage } from './pages/CategoriesIndexPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { OrderGuidePage } from './pages/OrderGuidePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { StoreInfoPage } from './pages/StoreInfoPage';

const DesignSystemPage = lazy(() =>
  import('@pequemodas/ui').then((m) => ({ default: m.DesignSystemShowcase }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 6000)
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StorefrontProvider>
        <CartProvider>
          <AppBootSplash />
          <BrowserRouter>
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
          </BrowserRouter>
        </CartProvider>
      </StorefrontProvider>
    </QueryClientProvider>
  );
}
