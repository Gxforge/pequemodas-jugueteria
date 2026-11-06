# PequeModas-Juguetería — Plataforma de Comercio Electrónico

Plataforma integral de comercio electrónico infantil (**Tienda Pública PWA** + **Panel Administrativo Privado**) diseñada y construida por **StudioLexair** para **Katia** (**PequeModas-Juguetería**), concebida para operar sin pasarelas de pago online ni dependencia de tarjetas bancarias internacionales, con pedidos coordinados y confirmados personalmente por **WhatsApp**.

## Estructura del Monorepositorio

- `apps/storefront` — Tienda pública instalable en Android (PWA), catálogo paginado en `CUP`, variantes dinámicas, carrito persistente y preparación de pedidos por WhatsApp.
- `apps/admin` — Panel administrativo privado para Katia (móvil Android y escritorio): productos, fotografías WebP, categorías, inventario híbrido, solicitudes y ajustes.
- `packages/config` — Tokens del sistema de diseño, preset Tailwind y constantes de dominio.
- `packages/schemas` — Esquemas de validación estricta con Zod.
- `packages/shared` — Cliente público de Supabase, repositorios, tipos e inventario híbrido.
- `packages/ui` — Biblioteca de componentes accesibles y Guía Visual interactiva.
- `packages/utils` — Formato de moneda `CUP`, generador `wa.me`, optimizador cliente WebP y utilidades.
- `supabase/` — 8 migraciones SQL versionadas con Row Level Security (RLS), `seed.sql` limpio y Edge Function `storage-health`.
- `docs/` — Los 15 documentos técnicos, de seguridad, despliegue, respaldos y manual paso a paso para Katia (`ADMIN_USER_GUIDE.md`).

## Arranque Rápido Local

```bash
# 1. Instalar dependencias del monorepo
pnpm install

# 2. Configurar variables públicas locales (nunca subir .env.local a Git)
cp .env.example .env.local

# 3. Levantar Tienda Pública (http://localhost:5173) y Panel Admin (http://localhost:5174)
pnpm dev:storefront
pnpm dev:admin
```

## Calidad y Regla de Modularidad (<= 300 líneas)

```bash
pnpm check:lines   # Verifica que ningún archivo de código supere 300 líneas
pnpm typecheck     # TypeScript strict mode en todos los paquetes
pnpm lint          # ESLint + límite de líneas
pnpm test          # Pruebas unitarias y de componentes (Vitest + RTL)
pnpm build         # Compilación de producción de ambas aplicaciones
pnpm test:e2e      # Pruebas E2E Playwright (Android Pixel 7 + Escritorio)
```

Consulta la documentación completa en [`docs/PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md), la guía para Katia en [`docs/ADMIN_USER_GUIDE.md`](./docs/ADMIN_USER_GUIDE.md) y el estado detallado por fases en [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).
