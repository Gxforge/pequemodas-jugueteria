# ENVIRONMENT — Variables de Entorno y Separación de Entornos

## 1. Archivo Base `.env.example`

En la raíz del monorepositorio se incluye `.env.example` con nombres documentados y valores ficticios de referencia. Para desarrollo local, copia `.env.example` a `.env.local` (ignorado automáticamente por Git).

## 2. Catálogo de Variables

| Variable | Prefijo `VITE_` | Ámbito Permitido | Obligatoria | Descripción |
| :--- | :---: | :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | Sí | Navegador / Build Vite | Sí | URL pública del proyecto Supabase (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Sí | Navegador / Build Vite | Sí | Clave pública anónima sujeta a políticas RLS |
| `VITE_STOREFRONT_URL` | Sí | Navegador / Build Vite | No | URL pública base de la tienda |
| `VITE_ADMIN_URL` | Sí | Navegador / Build Vite | No | URL base del panel administrativo |
| `VITE_MAX_IMAGE_SIZE_MB` | Sí | Navegador / Build Vite | No | Límite máximo de foto en MB (por defecto `5`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **PROHIBIDO** | Exclusivo servidor / CLI local | Solo scripts admin | Clave maestra para aprovisionamiento inicial; jamás exponer al frontend |
| `SUPABASE_PROJECT_REF` | **PROHIBIDO** | Exclusivo CLI / CI | No | Identificador de referencia del proyecto Supabase |
| `INITIAL_ADMIN_EMAIL` | **PROHIBIDO** | Exclusivo CLI local | Solo alta inicial | Correo de Katia al ejecutar `provision-initial-admin.mjs` |

## 3.Separación Desarrollo vs. Producción

- **Desarrollo / Staging:** Proyecto Supabase secundario (`pequemodas-jugueteria-dev`) o instancia local con `supabase start` + `.env.local`.
- **Producción / Preproducción:** Proyecto Supabase principal (`pequemodas-jugueteria`) con variables inyectadas por entorno (`Preview` y `Production`) en Vercel.
- **Validación al arrancar:** `parseClientEnv()` valida formato URL, longitud de clave pública y aborta la ejecución si detecta accidentalmente cualquier variable con `SERVICE_ROLE`.
