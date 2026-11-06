# SECURITY — Modelo de Seguridad y Aprovisionamiento

## 1. Controles Implementados

1. **Autenticación cerrada (`disable_signup = true`):**
   - El registro público en Supabase Auth está desactivado en el servidor. Ningún visitante externo puede crear cuentas.
2. **Autorización en Base de Datos (RLS):**
   - Cada una de las 12 tablas tiene `ENABLE ROW LEVEL SECURITY`.
   - Los productos en `draft`, `hidden` o `archived` son invisibles para consultas anónimas a nivel de motor PostgreSQL.
   - Las tablas `orders`, `order_items`, `inventory_movements` y `audit_logs` están completamente bloqueadas para lectura anónima.
3. **Separación de Variables y Protección contra Fugas:**
   - `parseClientEnv()` en `@pequemodas/schemas` lanza un error inmediato si detecta cualquier variable que contenga `SERVICE_ROLE` en el entorno del cliente.
   - `.gitignore` bloquea `.env`, `.env.*` (excepto `.env.example`), `*tokens*`, `*.key` y `*.pem`.
4. **Control de Archivos en Storage:**
   - Validación doble (cliente + políticas `storage.buckets` y `storage.objects`) permitiendo únicamente `image/jpeg`, `image/png` e `image/webp` hasta 5 MB en `product-images`, y exigiendo `public.is_store_admin()` para subir, modificar o borrar objetos.
5. **Sin Caché Insegura en Administración:**
   - `apps/admin/vercel.json` envía `Cache-Control: no-store, max-age=0` y `<meta name="robots" content="noindex, nofollow" />`.

## 2. Procedimiento Seguro para Crear la Cuenta Inicial de Katia

No existe ninguna contraseña predeterminada en el código ni en las migraciones. Para dar de alta a la propietaria por primera vez desde una estación segura de StudioLexair:

```bash
SUPABASE_URL="https://<ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role_key_privada>" \
INITIAL_ADMIN_EMAIL="<correo_real_de_katia>" \
INITIAL_ADMIN_PASSWORD="<contraseña_fuerte_unica_min_10_caracteres>" \
INITIAL_ADMIN_NAME="Katia" \
node --experimental-websocket scripts/provision-initial-admin.mjs
```

El script comprueba que no exista previamente una cuenta `owner`, crea el usuario confirmado en `auth.users` y vincula su perfil en `public.profiles` con `role = 'owner'`. Tras el primer ingreso, Katia puede actualizar su clave desde el propio panel o mediante recuperación por correo.
