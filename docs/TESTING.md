# TESTING — Estrategia y Ejecución de Pruebas

## 1. Comandos de Verificación de Calidad

```bash
# 1. Comprobar límite estricto de 300 líneas por archivo de código
pnpm check:lines

# 2. Verificación estricta de tipos TypeScript en los 8 paquetes
pnpm typecheck

# 3. Análisis estático ESLint + modularidad
pnpm lint

# 4. Pruebas unitarias y de componentes (Vitest + React Testing Library)
pnpm test

# 5. Compilación de producción de Tienda Pública y Panel Administrativo
pnpm build

# 6. Pruebas End-to-End en Android (Pixel 7) y Escritorio (Playwright)
pnpm test:e2e
```

## 2. Cobertura por Capas

1. **Unitarias (`packages/utils`, `packages/schemas`, `packages/shared`):**
   - Formateo `CUP` / `USD`, redondeo exacto y totales separados sin conversión.
   - Normalización de teléfonos y construcción codificada de enlaces `https://wa.me/...` con variantes, subtotales y modalidad de entrega.
   - Validación MIME y límite de peso de fotografías antes de subir a Storage.
   - Rechazo de variables `SERVICE_ROLE` en cliente y bloqueo de precios/cantidades negativas en Zod.
   - Motor de **Inventario Híbrido** (Modalidad A por cantidades y Modalidad B manual, más sobrescritura de precio por variante).
2. **Integración de Componentes (`apps/storefront`, `apps/admin`):**
   - Carrito persistente (`CartProvider`): suma de cantidades, tope por stock disponible y cálculo separado en `CUP` y `USD`.
   - Renderizado de marca oficial y demostración del Sistema de Diseño.
   - Protección de rutas administrativas sin registro público.
3. **Integración Real contra PostgreSQL 17 + RLS + Storage en Supabase:**
   - Lectura anónima permitida solo sobre tienda activa y productos `published`.
   - Bloqueo verificado de `auth.signUp()` público y escrituras anónimas.
   - Visibilidad cero de borradores (`draft`) y solicitudes (`orders`) para usuarios no autenticados.
   - Movimiento atómico `record_inventory_movement` y bloqueo de stock negativo.
   - Subida y borrado real de WebP en bucket `product-images`.
   - Solicitud de pedido `create_whatsapp_order_request` verificando que **no descuenta inventario**.
4. **End-to-End Multi-dispositivo (`e2e/platform.spec.ts`):**
   - Perfiles `android-chrome` (`Pixel 7`) y `desktop-chromium` verificando Inicio con catálogo vacío, Guía de Pedidos, Carrito, Guía Visual, `manifest.webmanifest` PWA y redirección segura a `/acceso` en el Panel Administrativo.
