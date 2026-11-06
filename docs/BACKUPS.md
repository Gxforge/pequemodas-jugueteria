# BACKUPS — Plan de Respaldo y Recuperación sin Costos

## 1. Limitación del Plan Gratuito de Supabase

En el plan gratuito (`Free`) de Supabase no se incluyen respaldos automáticos diarios descargables ni Point-in-Time Recovery (PITR). Por ello, StudioLexair establece un procedimiento periódico y gratuito de respaldo lógico.

## 2. Respaldo de Esquema y Código

- Todo el esquema relacional, funciones RPC, triggers, políticas RLS y definición de buckets está **100 % versionado en Git** dentro de `supabase/migrations/` y replicado en GitHub (`Gxforge/pequemodas-jugueteria`).
- Ante cualquier contingencia, la estructura completa se reconstruye ejecutando las migraciones en orden del `0001` al `0008` más `supabase/seed.sql`.

## 3. Respaldo Periódico de Datos (PostgreSQL)

Desde un ordenador autorizado de StudioLexair con Supabase CLI o `pg_dump` (usando la cadena de conexión privada del panel de Supabase):

```bash
# Exportar datos del esquema público (catálogo, variantes, inventario, ajustes y solicitudes)
supabase db dump --data-only --schema public -f backup_datos_$(date +%Y%m%d).sql
```

**Reglas de seguridad para archivos de respaldo:**
- Guardar los archivos `.sql` de datos fuera del repositorio Git (en almacenamiento cifrado de StudioLexair).
- Frecuencia recomendada: semanal o después de cargas masivas de temporada.

## 4. Respaldo de Fotografías (`product-images` y `brand-assets`)

- Conservar en una carpeta local o nube personal de Katia/StudioLexair las fotografías originales organizadas por categoría, o descargar periódicamente los objetos del bucket mediante script administrativo autenticado.

## 5. Prevención de Pausa por Inactividad

- Los proyectos gratuitos de Supabase se pausan tras 7 días sin tráfico. Basta con abrir la tienda o el panel una vez por semana (o restaurar desde el panel de Supabase sin pérdida de datos ni fotografías).
