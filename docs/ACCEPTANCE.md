# ACCEPTANCE — Matriz de Criterios de Aceptación Final

| # | Criterio de Aceptación | Estado | Evidencia Técnica |
| :-: | :--- | :---: | :--- |
| 1 | La tienda pública funciona con sus 12 páginas | Cumplido | `apps/storefront/src/pages/*` + nueva `/instalar` + rutas verificadas en E2E |
| 2 | El panel administrativo funciona en Android, iPhone/iPad y PC | Cumplido | `apps/admin` con menú hamburguesa en móvil, guía iOS en `/acceso` + sidebar escritorio |
| 3 | Katia puede gestionar productos y categorías | Cumplido | Crear, editar, publicar, ocultar, duplicar, archivar y eliminar |
| 4 | Carga múltiple y optimización WebP de fotografías | Cumplido | `optimizeProductImage()` + `PhotosManagerSection` + bucket `product-images` |
| 5 | Sistema flexible de variantes ilimitadas | Cumplido | `attributes jsonb` libre + precio propio opcional en la moneda del producto (`CUP`/`USD`) |
| 6 | Inventario híbrido (Cantidades + Manual) | Cumplido | RPC `record_inventory_movement` + modal de confirmación al cambiar modalidad |
| 7 | Carrito persistente funcional | Cumplido | `CartContext.tsx` con persistencia `localStorage` y pruebas RTL |
| 8 | Pedidos por WhatsApp sin descontar stock | Cumplido | `buildWhatsAppOrderMessage` + `wa.me` + RPC `request_received` verificada |
| 9 | Base de datos con políticas RLS completas | Cumplido | 12 tablas con `rowsecurity = true` y `disable_signup = true` en vivo |
| 10 | PWA instalable en Android, iPhone y iPad sin caché obsoleta | Cumplido | `manifest.webmanifest`, iconos 180/192/512 + `maskable`, etiquetas Apple, `apple-touch-icon.png` opaco y `sw.js` que excluye API Supabase |
| 11 | Pruebas unitarias, integración y E2E en verde | Cumplido | Vitest (30/30), Playwright (12/12 Android + Escritorio) y 7 pruebas iOS en WebKit/Chromium; GitHub Actions en cada `push` |
| 12 | Ningún archivo de código supera 300 líneas | Cumplido | Verificado por `pnpm check:lines` (`scripts/check-line-limit.mjs`) |
| 13 | Catálogo inicial vacío y cero datos inventados | Cumplido | `0` productos en BD; teléfonos, tarifas y horarios vacíos y editables |
| 14 | Documentación completa (16 documentos + estado) | Cumplido | Carpeta `docs/` con `PWA_IOS.md` + `PROJECT_STATUS.md` + `README.md` |
| 15 | Bloqueos externos identificados con transparencia | Cumplido | Documentados en sección inferior y en `DEPLOYMENT.md` |
| 16 | Katia configura CUP o USD por producto y moneda principal | Cumplido | Selectores en `Productos`/`Ajustes`, `CHECK` en BD, totales separados y apéndice en vídeo |
| 17 | iPhone/iPad recibe una guía real de instalación sin promesas falsas | Cumplido | `useIosInstallGuide`, `IosInstallSteps`, `/instalar`, meta etiquetas Apple y verificación WebKit en GitHub Actions |

**Nota honesta sobre iOS:** Safari no dispara `beforeinstallprompt`; la instalación
en iPhone siempre es manual desde Compartir → «Añadir a pantalla de inicio».
La plataforma ya lo explica dentro de la app en lugar de esperar un botón que
Apple no ofrece.

## Lista Transparente de Bloqueos y Limitaciones Externas

1. **Plan Vercel Hobby para operación comercial definitiva:** La cuenta Vercel proporcionada (`junmoxia41`) opera bajo el plan `hobby` (no comercial según los Términos de Servicio de Vercel). Los proyectos y entornos de vista previa técnica quedan configurados y operativos con catálogo vacío, pero **antes de iniciar ventas comerciales reales sobre Vercel se requiere autorización de presupuesto para Vercel Pro** (no contratado por restricción estricta de cero pagos/tarjetas).
2. **Renombrado del nombre visible de la Organización en Supabase vía PAT:** Ambos proyectos de Supabase fueron renombrados exitosamente a `pequemodas-jugueteria` y `pequemodas-jugueteria-dev` vía Management API (`200 OK`), pero la API pública de Supabase (`/v1/organizations/{slug}`) solo expone `GET` para tokens `sbp_` y exige cambiar el nombre visible de la organización (`MiSaldo` -> `PequeModas-Juguetería`) manualmente desde el navegador en *Supabase Dashboard → Organization Settings → General* (toma 10 segundos sin tarjeta).
3. **Logotipo gráfico definitivo y número real de WhatsApp de Katia:** Al no adjuntarse un archivo de imagen de logotipo ni teléfono comercial, el sistema incorpora un emblema vectorial oficial coherente y permite a Katia subir su logotipo oficial y registrar su número `+53...` directamente desde *Ajustes de la Tienda*.
