import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminBootSplash } from './components/AdminBootSplash';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatabasesPage } from './pages/DatabasesPage';
import { HistoryPage } from './pages/HistoryPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { MessagesChatPage } from './pages/MessagesChatPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductEditorPage } from './pages/ProductEditorPage';
import { ProductsListPage } from './pages/ProductsListPage';
import { SettingsPage } from './pages/SettingsPage';
import { StorePreviewPage } from './pages/StorePreviewPage';
import { TeamPage } from './pages/TeamPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';

const DesignSystemPage = lazy(() =>
  import('@pequemodas/ui').then((m) => ({ default: m.DesignSystemShowcase }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 1000 * 60 * 30,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminBootSplash />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/acceso" element={<LoginPage />} />
              <Route path="/invitacion" element={<AcceptInvitePage />} />
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
                <Route path="mensajes" element={<MessagesChatPage />} />
                <Route path="vista-previa" element={<StorePreviewPage />} />
                <Route path="productos" element={<ProductsListPage />} />
                <Route path="productos/nuevo" element={<ProductEditorPage />} />
                <Route path="productos/:productId" element={<ProductEditorPage />} />
                <Route path="categorias" element={<CategoriesPage />} />
                <Route path="inventario" element={<InventoryPage />} />
                <Route path="bases-de-datos" element={<DatabasesPage />} />
                <Route path="historial" element={<HistoryPage />} />
                <Route path="pedidos" element={<OrdersPage />} />
                <Route path="equipo" element={<TeamPage />} />
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
