# DATABASE — Modelo Relacional PostgreSQL y Migraciones

## 1. Tablas del Dominio PequeModas-Juguetería

Todas las tablas emplean claves primarias `uuid` (`gen_random_uuid()`), marcas temporales UTC (`created_at`, `updated_at`), claves foráneas con integridad referencial e índices específicos de consulta.

| Tabla | Propósito Principal | Acceso Público (RLS) | Acceso Admin (`is_store_admin()`) |
| :--- | :--- | :--- | :--- |
| `stores` | Identidad raíz de la tienda activa | `SELECT` si `is_active = true` | `ALL` |
| `profiles` | Vínculo `auth.users` con rol `owner`/`admin` | Ninguno (solo usuario propio/admin) | `SELECT`, `UPDATE` |
| `store_settings` | Teléfono WhatsApp, horarios, entrega/recogida, redes | `SELECT` | `ALL` |
| `categories` | Categorías y subcategorías (`parent_id` recursivo) | `SELECT` si activa y no archivada | `ALL` |
| `products` | Catálogo con precio `CUP`, modalidad de stock y estado | `SELECT` solo si `published` | `ALL` |
| `product_images` | Metadatos y rutas a `Supabase Storage` (sin binarios) | `SELECT` si producto `published` | `ALL` |
| `product_variants` | Variantes con `attributes jsonb` libre y precio opcional | `SELECT` si activa y producto `published` | `ALL` |
| `inventory` | Existencias por producto raíz o por `variant_id` (`>= 0`) | `SELECT` si producto `published` | `ALL` |
| `inventory_movements` | Historial inmutable (`in`, `out`, `adjustment`, `mode_switch`) | Ninguno | `ALL` |
| `orders` | Solicitudes WhatsApp (`request_received`) y confirmados | Ninguno (alta vía RPC segura) | `ALL` |
| `order_items` | Líneas históricas con snapshot de nombre, variante y precio | Ninguno | `ALL` |
| `audit_logs` | Trazabilidad administrativa de cambios | Ninguno | `SELECT`, `INSERT` |

## 2. Restricciones de Integridad Clave

- `products.base_price_cup >= 0` y `product_variants.price_override_cup >= 0`.
- `inventory.quantity >= 0` y `inventory_movements.new_quantity >= 0` (bloqueo físico en motor PostgreSQL contra cantidades negativas).
- Índices únicos parciales en `inventory`:
  - `idx_inventory_product_root` sobre `(product_id) WHERE variant_id IS NULL`.
  - `idx_inventory_product_variant` sobre `(product_id, variant_id) WHERE variant_id IS NOT NULL`.
- `categories`: restricción `chk_categories_no_self_parent` (`parent_id <> id`) y unicidad `(store_id, slug)`.

## 3. Orden de Migraciones Versionadas

Ubicadas en `supabase/migrations/`:

1. `20261106000100_extensions_and_helpers.sql` — Extensión `pgcrypto` y trigger `set_updated_at()`.
2. `20261106000200_core_store_and_profiles.sql` — Tablas `stores`, `profiles`, `store_settings`.
3. `20261106000300_catalog_and_inventory.sql` — Tablas `categories`, `products`, `product_images`, `product_variants`, `inventory`.
4. `20261106000400_orders_movements_audit.sql` — Tablas `inventory_movements`, `orders`, `order_items`, `audit_logs`.
5. `20261106000500_domain_rpc_functions.sql` — Funciones `is_store_admin()`, `record_inventory_movement()` y `create_whatsapp_order_request()`.
6. `20261106000600_rls_policies.sql` — Políticas RLS completas para las 12 tablas.
7. `20261106000700_storage_buckets_and_rls.sql` — Buckets `product-images` y `brand-assets` + políticas en `storage.objects`.
8. `20261106000800_safe_auth_user_trigger.sql` — Trigger resiliente al aprovisionar cuentas en `auth.users`.
