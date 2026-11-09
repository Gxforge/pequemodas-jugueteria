# REQUIREMENTS — Especificación de Requisitos

## 1. Requisitos Funcionales

### 1.1 Tienda Pública (`apps/storefront`)
- **RF-01:** Mostrar páginas de Inicio, Catálogo, Categorías, Subcategorías, Búsqueda, Detalle de Producto, Carrito, Información de la Tienda, Contacto, Política de Privacidad, Información de Pedidos y Guía Visual.
- **RF-02:** Listar únicamente productos con estado `published` y categorías activas no archivadas.
- **RF-03:** Soportar variantes dinámicas con atributos ilimitados (talla, color, edad, diseño, etc.) y precio propio opcional en la moneda del producto (`CUP` o `USD`).
- **RF-04:** Mantener carrito persistente en almacenamiento local del dispositivo con cálculo exacto de subtotales y totales separados en `CUP` y `USD`.
- **RF-05:** Preparar enlace `https://wa.me/<numero>?text=<mensaje_codificado>` con desglose completo y modalidad de entrega (`Entrega a domicilio` o `Recogida`).
- **RF-06:** Diseñar estados vacíos amigables cuando el catálogo o una búsqueda no tengan resultados publicados.

### 1.2 Panel Administrativo (`apps/admin`)
- **RF-07:** Inicio de sesión exclusivo para cuentas autorizadas en `public.profiles`, recuperación de contraseña por correo y cierre seguro de sesión. Prohibido el registro público.
- **RF-08:** Dashboard con conteo de productos totales, publicados, ocultos/borrador, agotados, categorías, solicitudes de WhatsApp, uso de cuota de Storage y auditoría reciente.
- **RF-09:** CRUD completo de productos con acciones rápidas de publicar, ocultar, archivar, duplicar y eliminar.
- **RF-10:** Carga múltiple de fotografías desde teléfono Android, conversión automática a WebP + miniatura, selección de foto principal, reordenación y borrado seguro en Supabase Storage.
- **RF-11:** Inventario híbrido seleccionable por producto:
  - **Modalidad A (Cantidades):** Entradas, salidas, ajustes e historial atómico sin permitir saldos negativos.
  - **Modalidad B (Manual):** Estados `Disponible`, `Agotado` y `Consultar disponibilidad`.
  - Confirmación explícita al alternar entre modalidades explicando que las cantidades previas y su historial se conservan.
- **RF-12:** Edición completa de identidad comercial, logotipo, WhatsApp, teléfono, horarios, condiciones de entrega/recogida y redes sociales.

## 2. Requisitos No Funcionales

- **RNF-01 Modularidad estricta:** Ningún archivo de código ejecutable o SQL supera las **300 líneas** (verificado automáticamente por `scripts/check-line-limit.mjs`).
- **RNF-02 Seguridad en profundidad:** RLS habilitada en el 100 % de las tablas, separación estricta de variables públicas (`VITE_`) y privadas, sin exponer jamás `SUPABASE_SERVICE_ROLE_KEY` en el cliente.
- **RNF-03 Experiencia Móvil y PWA:** Diseño mobile-first Android, manifest instalable y Service Worker que nunca cachea respuestas de disponibilidad como información obsoleta.
- **RNF-04 Sin servicios prohibidos:** Exclusión total de Cloudflare Pages/Workers/D1/R2, Firebase o APIs de facturación automática con tarjeta.
