# API — Contratos de Datos, Repositorios y Funciones RPC

## 1. Arquitectura de Acceso a Datos

Ambas aplicaciones consumen el paquete compartido `@pequemodas/shared`, que encapsula el cliente público de Supabase (`VITE_SUPABASE_ANON_KEY`) protegido por **Row Level Security** en PostgreSQL.

### Módulos de Repositorio (`packages/shared/src/`)
- `settings.repository.ts`:
  - `fetchActiveStoreAndSettings()`: Obtiene tienda activa y configuración pública.
  - `updateStoreSettings(storeId, input)`: Actualiza configuración comercial y registra auditoría.
  - `uploadStoreLogo(storeId, file)`: Sube logotipo validado al bucket `brand-assets`.
- `categories.repository.ts`:
  - `fetchCategories({ includeArchived, onlyActive })` y `buildCategoryTree(rows)`.
  - `createCategory`, `updateCategory`, `deleteCategory`.
- `products-read.repository.ts`:
  - `fetchProductsPaginated(filters)`: Búsqueda, filtros por categoría/subcategoría/estado, ordenación (`newest`, `price_asc`, `price_desc`, `name_asc`) y paginación por rangos (`range(from, to)`).
  - `fetchProductBySlug(slug)`, `fetchProductById(id)`, `fetchRelatedProducts(productId, categoryId)`.
- `products-write.repository.ts` y `products-variants.repository.ts`:
  - `createProductWithVariants`, `updateProductWithVariants`, `syncProductVariants`, `setProductPublicationStatus`, `duplicateProduct`, `deleteProductPermanently`.
- `storage.repository.ts`:
  - `uploadProductPhotograph`, `setPrimaryProductImage`, `reorderProductImages`, `deleteProductImage`.
- `inventory.repository.ts`:
  - `recordInventoryMovement`, `switchProductInventoryMode`, `fetchInventoryMovements`.
- `orders.repository.ts`:
  - `submitWhatsAppOrderRequest`, `fetchOrdersForAdmin`, `updateOrderStatusByAdmin`, `fetchDashboardStats`.

## 2. Funciones RPC en PostgreSQL

### `public.is_store_admin() -> boolean`
Verifica mediante `auth.uid()` si el usuario autenticado posee fila activa en `public.profiles` con rol `owner` o `admin`.

### `public.record_inventory_movement(p_product_id, p_variant_id, p_movement_type, p_quantity, p_reason)`
- **Seguridad:** Requiere `is_store_admin() = true`.
- **Comportamiento:** Bloquea fila de inventario, aplica `in` (+), `out` (-) o `adjustment` (=), rechaza saldos `< 0`, inserta movimiento e inserta traza en `audit_logs`.

### `public.create_whatsapp_order_request(...) -> jsonb`
- **Seguridad:** Disponible para visitantes de la tienda cuando `record_whatsapp_requests = true`, con límite de frecuencia de 25 solicitudes por minuto.
- **Comportamiento:** Crea solicitud con `status = 'request_received'` y código único `PM-XXXXXX` **sin descontar ni reservar inventario**.

## 3. Supabase Edge Function (`supabase/functions/storage-health`)
Endpoint auxiliar autenticado (`GET/POST`) que verifica `is_store_admin()` y calcula el porcentaje de uso del bucket de imágenes frente a la cuota gratuita de 1 GB.
