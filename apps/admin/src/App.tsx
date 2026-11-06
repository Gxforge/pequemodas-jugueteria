import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';

const UpdatePasswordPage = lazy(() =>
  import('./pages/UpdatePasswordPage').then((m) => ({ default: m.UpdatePasswordPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ProductsListPage = lazy(() =>
  import('./pages/ProductsListPage').then((m) => ({ default: m.ProductsListPage }))
);
const ProductEditorPage = lazy(() =>
  import('./pages/ProductEditorPage').then((m) => ({ default: m.ProductEditorPage }))
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
);
const InventoryPage = lazy(() =>
  import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const OrdersPage = lazy(() =>
  import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const DesignSystemPage = lazy(() =>
  import('@pequemodas/ui').then((m) => ({ default: m.DesignSystemShowcase }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function RouteLoader() {
  return (
    <div className="py-12 text-center text-sm font-medium text-slate-500">
      Cargando módulo administrativo...
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/acceso" element={<LoginPage />} />
              <Route path="/actualizar-clave" element={<UpdatePasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="productos" element={<ProductsListPage />} />
                <Route path="productos/nuevo" element={<ProductEditorPage />} />
                <Route path="productos/:productId" element={<ProductEditorPage />} />
                <Route path="categorias" element={<CategoriesPage />} />
                <Route path="inventario" element={<InventoryPage />} />
                <Route path="pedidos" element={<OrdersPage />} />
                <Route path="configuracion" element={<SettingsPage />} />
                <Route path="sistema-diseno" element={<DesignSystemPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
