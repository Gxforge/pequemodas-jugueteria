# ARCHITECTURE — Arquitectura del Monorepositorio

## 1. Visión General

El sistema está organizado como un **monorepositorio con `pnpm workspaces`** y TypeScript en modo estricto (`strict: true`, `noUncheckedIndexedAccess: true`).

```text
pequemodas-jugueteria/
├── apps/
│   ├── storefront/        # PWA pública para clientes (React 18 + Vite 6 + Tailwind)
│   └── admin/             # Panel privado para Katia (React 18 + Vite 6 + Tailwind)
├── packages/
│   ├── config/            # Tokens visuales, preset Tailwind, constantes y límites
│   ├── schemas/           # Validaciones Zod compartidas (formularios y entorno)
│   ├── shared/            # Cliente Supabase, repositorios, disponibilidad híbrida y tipos
│   ├── ui/                # Sistema de Diseño reutilizable y Guía Visual interactiva
│   └── utils/             # Moneda CUP, codificador wa.me, optimizador WebP y slugs
├── supabase/
│   ├── config.toml        # Configuración declarativa para Supabase CLI
│   ├── migrations/        # 8 migraciones SQL versionadas (< 300 líneas cada una)
│   ├── seed.sql           # Semilla limpia sin productos ni datos comerciales ficticios
│   └── functions/         # Edge Function storage-health para supervisión de cuota
├── scripts/
│   ├── check-line-limit.mjs        # Verificador automático de <= 300 líneas
│   └── provision-initial-admin.mjs # Alta segura de la primera administradora
├── e2e/                   # Pruebas E2E Playwright (Android Pixel 7 + Escritorio)
└── docs/                  # Documentación integral para StudioLexair y Katia
```

## 2. Versiones Tecnológicas Seleccionadas

| Capa | Tecnología | Versión Base | Justificación |
| :--- | :--- | :--- | :--- |
| Lenguaje | TypeScript | `^5.7.3` | Tipado estricto de extremo a extremo |
| UI | React + React DOM | `^18.3.1` | Ecosistema estable y ligero |
| Bundler | Vite | `^6.2.0` | Code splitting eficiente y arranque inmediato |
| Enrutamiento | React Router DOM | `^6.28.0` | Rutas SPA protegidas y carga diferida (`lazy`) |
| Estado Servidor | TanStack Query | `^5.66.0` | Invalidación limpia y control de frescura de stock |
| Formularios | React Hook Form + Zod | `^7.54.2` / `^3.24.2` | Validación accesible sin re-renderizados costosos |
| Estilos | Tailwind CSS | `^3.4.17` | Bundle CSS mínimo (~5.7 kB gzip) ideal para redes móviles |
| Datos y Auth | Supabase JS + PostgreSQL | `^2.49.1` / PG `17` | RLS nativa en motor relacional y Storage S3-compatible |
| Calidad | Vitest + RTL + Playwright | `^3.0.7` / `^1.51.0` | Pirámide completa: unitaria, componentes, BD real y E2E |

## 3. Registro de Decisiones Técnicas (ADR Resumen)

1. **RPC Transaccional para Movimientos de Inventario (`record_inventory_movement`):** En lugar de calcular sumas/restas en el navegador, PostgreSQL bloquea la fila (`FOR UPDATE`), verifica permisos `is_store_admin()`, impide saldos `< 0` y escribe en `inventory_movements` y `audit_logs` en una sola transacción ACID.
2. **RPC Pública con Rate Limiting para Solicitudes WhatsApp (`create_whatsapp_order_request`):** Permite registrar opcionalmente solicitudes recibidas (`status = 'request_received'`) sin abrir permisos `SELECT` ni `INSERT` directos sobre `orders` para usuarios anónimos, y sin descontar stock.
3. **Compresión Cliente WebP + Miniatura Dual:** Antes de transmitir por la red móvil de Katia, el navegador redimensiona la imagen principal (`<= 1280px`) y crea una miniatura (`<= 400px`) en WebP, reduciendo hasta un 80 % el consumo de datos móviles y cuota de Supabase Storage.
4. **Service Worker sin Caché de API:** El SW cachea exclusivamente el App Shell estático e ignora cualquier dominio `*.supabase.co`, garantizando que nunca se muestre un producto agotado como disponible por caché antigua.
