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
set -a; source .env.local; set +a   # aporta E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
pnpm test:e2e

# 7. Verificación estática de la PWA para iPhone / iPad
pnpm check:pwa:ios

# 8. E2E iPhone 13 (WebKit) + regresión Android sobre el build
pnpm test:e2e:ios

# 9. Verificación de producción con User-Agent de Safari en iPhone
node scripts/check-pwa-ios.mjs --live
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
5. **Credenciales de pruebas:** `e2e/platform.spec.ts` ya no contiene contraseñas reales. Las pruebas de acceso leen `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` del entorno local (`.env.local`, ignorado por Git); si faltan, esas pruebas se omiten con un aviso claro. GitHub Actions ejecuta la suite iOS, que no necesita credenciales.
6. **PWA en iPhone / iPad (`e2e/pwa-ios.spec.ts` y `scripts/check-pwa-ios.mjs`):**
   - WebKit con perfil `iPhone 13` comprueba meta etiquetas Apple, icono opaco de `180 × 180`, `manifest.webmanifest`, `content-type` real de JS/SW, guía manual de «Añadir a pantalla de inicio» en la Tienda y en `/acceso`, y que no aparezca un botón falso de instalación.
   - Chromium con `Pixel 7` confirma que Android conserva sus 5 botones y no recibe la guía de iPhone.
   - GitHub Actions ejecuta lint, tipos, `30` unitarias, build, la verificación estática y la suite iOS en cada `push`; con `workflow_dispatch` valida además producción. No usa secretos reales: genera variables `VITE_*` ficticias sólo para compilar.
