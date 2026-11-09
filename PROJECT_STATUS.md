# Estado Oficial del Proyecto — PequeModas-Juguetería (`v3.1.0`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Dominios Oficiales Verificados en Producción

- **Tienda Pública (PWA v3.1.0):** `https://pequemodas.vercel.app` — despliegue `dpl_CYvvB9yaGXyo9L1U5vovTd9nJmZ6` (`200 OK`, `/version.json = 3.1.0`).
- **Panel Administrativo (PWA v3.1.0):** `https://pequemodas-admin.vercel.app` — despliegue `dpl_BqxXqjmXoJHu29ozmqj2V5CgGiqW` (`200 OK`, `/version.json = 3.1.0`).
- **Dominios antiguos:** `pequemodas-jugueteria.vercel.app` y `pequemodas-jugueteria-admin.vercel.app` continúan retirados (`404`).
- **Cabeceras verificadas:** `/version.json` y `/sw.js` con `no-store`; `/assets/*` con `public, max-age=31536000, immutable`.
- **Aviso sobre Vercel Hobby / Comercial:** Ambos proyectos operan actualmente en plan gratuito Hobby para validación técnica sin pagos ni tarjetas. Conforme a los Términos de Servicio de Vercel, para uso comercial permanente se debe contemplar el paso a Vercel Pro cuando el proyecto disponga de un medio de pago autorizado.

---

## 2. Arquitectura Interna de 4 Unidades (`BD-1` a `BD-4`)

1. **Proyecto 1 (`vcohlillbvznsovswdng` · `pequemodas-jugueteria`):**
   - **BD-1 (500 MB):** Catálogo, inventario, moneda por producto, moneda principal, equipo con permisos por tareas y clientes/chats iniciales.
   - **BD-3 (1024 MB = 1 GB):** Almacenamiento de fotografías 1 (`product-images` + `brand-assets`).
   - **Edge Functions activas:** `accept-admin-invite`, `storage-health` y `crm-admin-gateway`.
2. **Proyecto 2 (`ikwekjyeoqxwyyandyrr` · `pequemodas-jugueteria-chat`):**
   - **BD-2 (500 MB):** Conversaciones, clientes, pedidos directos, avisos, bot y totales separados CUP / USD.
   - **BD-4 (1024 MB = 1 GB):** Almacenamiento de fotografías 2 (`product-images`).
   - **Edge Function activa:** `crm-admin-gateway`.

---

## 3. Novedades Incorporadas en `v3.1.0` — Moneda `CUP` / `USD`

1. **Moneda principal configurable en `Ajustes`:** Katia elige `CUP` o `USD` como moneda inicial para los productos nuevos. Cambiarla **no modifica** los productos ya existentes.
2. **Moneda independiente por producto:** En `Productos → Nuevo/Editar` aparece el selector **«Moneda del precio»**. Cada artículo conserva `CUP` o `USD`; sus variantes/tallas/colores usan esa misma moneda. El precio escrito se respeta exactamente, sin calcular equivalencias.
3. **Cero conversiones y cero mezclas:** No se añadió tasa de cambio. El carrito, el mensaje de WhatsApp, el pedido directo en la App, las solicitudes del panel, el chat y las notificaciones muestran los importes **por separado** (`2500 CUP + 12 USD`).
4. **Orden por precio honesto:** Al ordenar por menor/mayor precio, la tienda agrupa primero por la moneda principal y compara importes solo dentro de cada moneda. La ayuda rápida del catálogo lo explica sin tecnicismos.
5. **Persistencia y seguridad:** Nuevas columnas `currency_code`, `default_currency_code` y `totals_by_currency` con `CHECK` en PostgreSQL; validación Zod en formularios; validación de moneda y cantidades dentro de las RPC; desglose JSONB en pedidos de ambos proyectos Supabase.
6. **Carrito offline compatible:** Los carritos guardados antes de `v3.1.0` se normalizan a `CUP` automáticamente; los nuevos guardan la moneda de cada línea. La instantánea offline pasa a `v2` para evitar datos de esquema obsoletos.

---

## 4. Vídeos para Katia

- **Tutorial completo (`v3.0.0`):** `/home/user/Tutorial-Katia-PequeModas-Completo.mp4` — `2 min 27 s`, recorrido general del panel.
- **Apéndice de moneda (`v3.1.0`):** `/home/user/Tutorial-Katia-Monedas-CUP-USD.mp4` — `53 s`, `1280×720`, H.264 + AAC, `2.2 MB`, voz española `voice-00`, subtítulos y llamadas visuales sobre capturas reales de `Ajustes`, `Productos` y `Carrito`.
- **Cero datos de prueba:** Las capturas del apéndice seleccionan `USD` sin guardar y simulan un carrito mixto solo en `localStorage` del navegador; no se escribió ningún producto, precio ni pedido falso en Supabase.

---

## 5. Calidad y Verificación (`v3.1.0`)

- **Límite estricto `<= 300` líneas por archivo:** `100%` de `174` archivos conformes (`pnpm check:lines`).
- **Tipado, Linter, Pruebas Unitarias y Build:** `pnpm typecheck`, `pnpm lint`, `pnpm test` (`23/23`) y `pnpm build` en verde (`0` errores).
- **Suite E2E Playwright:** `10/10` pruebas aprobadas en `Android Pixel 7` y `Desktop Chromium`, incluida una prueba de los selectores `CUP`/`USD` sin guardar datos de prueba.
- **Migraciones en vivo:** `20261106001200_currency_config.sql` aplicada al Proyecto 1; `000500_currency_helpers.sql` y `000501_currency_orders.sql` aplicadas a ambos proyectos. Verificadas columnas, restricciones, RPC y formato `3600,00 CUP + 12,50 USD`.
- **Infraestructura intacta:** Sin pagos, sin dominios comprados, sin `SERVICE_ROLE` en frontend, sin pasarelas y sin datos comerciales inventados.
