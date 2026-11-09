# DATABASE — Modelo Relacional PostgreSQL y Migraciones

## 1. Tablas del Dominio PequeModas-Juguetería

Todas las tablas emplean claves primarias `uuid` (`gen_random_uuid()`), marcas temporales UTC (`created_at`, `updated_at`), claves foráneas con integridad referencial e índices específicos de consulta.

| Tabla | Propósito Principal | Acceso Público (RLS) | Acceso Admin (`is_store_admin()`) |
| :--- | :--- | :--- | :--- |
| `stores` | Identidad raíz de la tienda activa | `SELECT` si `is_active = true` | `ALL` |
| `profiles` | Vínculo `auth.users` con rol `owner`/`admin` | Ninguno (solo usuario propio/admin) | `SELECT`, `UPDATE` |
| `store_settings` | WhatsApp, horarios, entrega/recogida, redes y `default_currency_code` | `SELECT` | `ALL` |
| `categories` | Categorías y subcategorías (`parent_id` recursivo) | `SELECT` si activa y no archivada | `ALL` |
| `products` | Catálogo con importe, `currency_code` (`CUP`/`USD`), stock y estado | `SELECT` solo si `published` | `ALL` |
| `product_images` | Metadatos y rutas a `Supabase Storage` (sin binarios) | `SELECT` si producto `published` | `ALL` |
| `product_variants` | Variantes con `attributes jsonb` libre e importe opcional en la moneda del producto | `SELECT` si activa y producto `published` | `ALL` |
| `inventory` | Existencias por producto raíz o por `variant_id` (`>= 0`) | `SELECT` si producto `published` | `ALL` |
| `inventory_movements` | Historial inmutable (`in`, `out`, `adjustment`, `mode_switch`) | Ninguno | `ALL` |
| `orders` | Solicitudes WhatsApp (`request_received`) y confirmados, con `totals_by_currency` | Ninguno (alta vía RPC segura) | `ALL` |
| `order_items` | Líneas históricas con snapshot de nombre, variante, importe y `currency_code` | Ninguno | `ALL` |
| `audit_logs` | Trazabilidad administrativa de cambios | Ninguno | `SELECT`, `INSERT` |

## 2. Restricciones de Integridad Clave

- `products.base_price_cup >= 0` y `product_variants.price_override_cup >= 0`. Estos nombres de columna son históricos: guardan el **importe numérico** y la moneda real está en `products.currency_code`.
- `store_settings.default_currency_code IN ('CUP', 'USD')` y `products.currency_code IN ('CUP', 'USD')`.
- `order_items.currency_code IN ('CUP', 'USD')`; `orders.estimated_total_cup` conserva únicamente el subtotal CUP y `orders.totals_by_currency` guarda el desglose completo.
- `orders.totals_by_currency` y `direct_orders.totals_by_currency` son `jsonb` validados por `public.is_valid_currency_totals()`: solo claves `CUP`/`USD`, valores numéricos `>= 0`.
- `public.build_currency_totals(jsonb)` valida cada línea de pedido en el servidor y agrupa los subtotales por moneda **sin convertir**.
- `inventory.quantity >= 0` e `inventory_movements.new_quantity >= 0` (bloqueo físico en PostgreSQL contra cantidades negativas).
- Índices únicos parciales en `inventory`: `idx_inventory_product_root` y `idx_inventory_product_variant`.
- `categories`: restricción `chk_categories_no_self_parent` y unicidad `(store_id, slug)`.

## 3. Orden de Migraciones Versionadas

Ubicadas en `supabase/migrations/` (Proyecto 1):

1. `20261106000100_extensions_and_helpers.sql` — `pgcrypto` y trigger `set_updated_at()`.
2. `20261106000200_core_store_and_profiles.sql` — `stores`, `profiles`, `store_settings`.
3. `20261106000300_catalog_and_inventory.sql` — `categories`, `products`, `product_images`, `product_variants`, `inventory`.
4. `20261106000400_orders_movements_audit.sql` — `inventory_movements`, `orders`, `order_items`, `audit_logs`.
5. `20261106000500_domain_rpc_functions.sql` — Funciones de dominio y `create_whatsapp_order_request()`.
6. `20261106000600_rls_policies.sql` — Políticas RLS completas.
7. `20261106000700_storage_buckets_and_rls.sql` — Buckets y políticas en `storage.objects`.
8. `20261106000800_safe_auth_user_trigger.sql` — Trigger resiliente en `auth.users`.
9. `20261106000900_admin_invitations.sql` — Invitaciones de administrador de un solo uso.
10. `20261106001000_category_covers.sql` — Portadas opcionales de categorías.
11. `20261106001100_team_roles_and_permissions.sql` — Roles y tareas de `Equipo`.
12. `20261106001200_currency_config.sql` — Moneda por producto, moneda principal, desgloses CUP/USD y RPC WhatsApp currency-aware.

Ubicadas en `supabase/chat-migrations/` (**ambos proyectos**):

1. `000100_crm_chat_tables.sql` — Contactos, pedidos directos, mensajes y avisos.
2. `000200_crm_rpcs_and_bot.sql` — RPC de chat y configuración del bot.
3. `000300_orders_and_signals.sql` — Pedidos directos y señales de carrito.
4. `000400_read_receipts_and_storage.sql` — Ticks de lectura y métricas.
5. `000500_currency_helpers.sql` — Columnas y funciones de totales separados CUP/USD.
6. `000501_currency_orders.sql` — `submit_direct_app_order()` y `record_cart_activity_signal_v2()` con desglose por moneda.
