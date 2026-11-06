# STORAGE — Gestión de Fotografías y Cuotas en Supabase Storage

## 1. Arquitectura de Almacenamiento de Objetos

Siguiendo las mejores prácticas de ingeniería:
- **Cero Base64 ni binarios en PostgreSQL:** Las filas de `public.product_images` almacenan únicamente rutas (`storage_path`, `thumbnail_path`), URLs públicas de lectura CDN y metadatos (`mime_type`, `size_bytes`, `width`, `height`, `is_primary`, `sort_order`).
- **Buckets configurados:**
  1. `product-images` (límite por archivo: `5 MB`, tipos permitidos: `image/jpeg`, `image/png`, `image/webp`).
  2. `brand-assets` (límite por archivo: `3 MB`, tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`).

## 2. Flujo de Optimización en el Teléfono de Katia

Cuando Katia selecciona una o varias fotografías desde su Android:
1. `validateImageFile()` verifica formato MIME y peso máximo antes de procesar.
2. `optimizeProductImage()` redimensiona en `<canvas>` la imagen completa a un máximo de `1280px` y genera una miniatura ligera de `400px`, codificando ambas en **WebP** (`calidad 0.82` / `0.78`, con respaldo automático a JPEG si un navegador antiguo no soporta codificación WebP).
3. Se asignan nombres únicos no colisionables con timestamp y UUID (`products/<productId>/<timestamp>-<uuid>.webp`).
4. Si ocurre un fallo al registrar metadatos en PostgreSQL, el repositorio ejecuta limpieza compensatoria (`remove`) en Storage para evitar archivos huérfanos.
5. Al eliminar una foto o eliminar un producto completo, se borran tanto la imagen principal como su miniatura del bucket.

## 3. Vigilancia del Plan Gratuito de Supabase

- El plan gratuito de Supabase incluye **1 GB de almacenamiento en Storage** y **5 GB de transferencia (egress) en caché / 2 GB sin caché** mensuales.
- Con la compresión automática a WebP (~90–160 KB por par foto + miniatura), 1 GB permite alojar aproximadamente **5,000 a 8,000 fotografías optimizadas**.
- El **Dashboard Administrativo** muestra en tiempo real una barra de consumo (`MB usados / 1024 MB`) para que Katia y StudioLexair vigilen la cuota sin sorpresas.
