# DEPLOYMENT — Preparación y Condiciones de Despliegue en Vercel

## 1. Configuración Técnica en Vercel (Monorepo)

El repositorio está preparado para desplegar **dos proyectos independientes en Vercel** conectados al repositorio GitHub `Gxforge/pequemodas-jugueteria`:

### Proyecto 1: Tienda Pública (`pequemodas-jugueteria-tienda`)
- **Root Directory:** `apps/storefront`
- **Framework Preset:** `Vite`
- **Install Command:** `pnpm install --frozen-lockfile`
- **Build Command:** `pnpm --filter @pequemodas/storefront build`
- **Output Directory:** `dist`
- **Archivo SPA & Cabeceras:** `apps/storefront/vercel.json` (incluye reescritura SPA `/(.*) -> /index.html` y no-caché para `/sw.js`).

### Proyecto 2: Panel Administrativo (`pequemodas-jugueteria-admin`)
- **Root Directory:** `apps/admin`
- **Framework Preset:** `Vite`
- **Install Command:** `pnpm install --frozen-lockfile`
- **Build Command:** `pnpm --filter @pequemodas/admin build`
- **Output Directory:** `dist`
- **Archivo SPA & Cabeceras:** `apps/admin/vercel.json` (incluye `Cache-Control: no-store` y reescritura SPA).

### Variables de Entorno en Ambos Proyectos Vercel
Configurar únicamente variables públicas (nunca incluir `SUPABASE_SERVICE_ROLE_KEY` en proyectos frontend):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAX_IMAGE_SIZE_MB=5`

---

## 1.1 Despliegue estático verificado (`pnpm deploy:static`)

Para despliegues sin integración Git se usa `scripts/deploy-static.mjs`. El script conserva las rutas anidadas de `dist/` (especialmente `/assets/*`), genera un `vercel.json` con `headers` y `rewrites`, desactiva temporalmente la protección SSO solo para verificar la URL de preview, comprueba que cada módulo responda con `application/javascript` o `text/css`, asigna los alias oficiales y restaura la configuración del proyecto. Así se evita que un `rewrite` SPA devuelva `index.html` con tipo HTML donde el navegador espera JavaScript.

## 2. ADVERTENCIA CRÍTICA DE CUMPLIMIENTO: Plan Vercel Hobby vs. Uso Comercial

Durante la auditoría real de infraestructura se comprobó que la cuenta de Vercel asociada se encuentra en el plan **`hobby`** (`junmoxia41's projects`, `plan: hobby`).

- **Condición contractual de Vercel:** Los Términos de Servicio de **Vercel Hobby** restringen su uso a proyectos personales y **no comerciales** (Fair Use Guidelines). Una tienda de comercio electrónico activa con fines de lucro requiere **Vercel Pro** para operar comercialmente en producción dentro de sus condiciones de servicio.
- **Estado actual preparado por StudioLexair:**
  1. Los proyectos y configuraciones de compilación, variables públicas y despliegues técnicos de **Preview / Verificación QA** quedan listos con catálogo 100 % vacío (sin actividad comercial activa).
  2. **No se contrató Vercel Pro ni se introdujeron tarjetas bancarias.**
  3. **Bloqueo externo documentado para salida comercial definitiva:** Antes de publicar catálogo comercial real al público general sobre Vercel, StudioLexair deberá autorizar un plan comercial válido (**Vercel Pro**) cuando exista presupuesto/medio de pago externo autorizado.

## 3. Restricciones Territoriales y Operativas (Cuba)

- La tienda pública y el panel administrativo utilizan arquitectura estática + llamadas HTTPS estándar a Supabase y enlaces `wa.me`, compatibles con navegadores Android en Cuba.
- Los proyectos del plan gratuito de Supabase se pausan tras **7 días sin actividad**; si la tienda pasa una semana sin visitas, puede reactivarse sin costo desde el panel de Supabase o mediante su Management API (`POST /v1/projects/{ref}/restore`).
