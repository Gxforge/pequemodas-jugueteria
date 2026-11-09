# Estado Oficial del Proyecto — PequeModas-Juguetería (`v3.1.2`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Dominios Oficiales Verificados en Producción

- **Tienda Pública (PWA v3.1.2):** `https://pequemodas.vercel.app` — despliegue `dpl_BdCwi6rRQMcUxaJHt2xjTo6Juv8x` (`200 OK`, `/version.json = 3.1.2`).
- **Panel Administrativo (PWA v3.1.2):** `https://pequemodas-admin.vercel.app` — despliegue `dpl_GNWge8G9o9U6aJJTAA8fxKKQDd7u` (`200 OK`, `/version.json = 3.1.2`).
- **Dominios antiguos:** `pequemodas-jugueteria.vercel.app` y `pequemodas-jugueteria-admin.vercel.app` continúan retirados (`404`).
- **Cabeceras verificadas:** `/version.json` y `/sw.js` con `no-store`; `/assets/*` con `public, max-age=31536000, immutable` y `content-type` real `application/javascript` / `text/css`.
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

## 3. `v3.1.0` — Moneda `CUP` / `USD`

1. **Moneda principal configurable en `Ajustes`:** Katia elige `CUP` o `USD` como moneda inicial para los productos nuevos. Cambiarla **no modifica** los productos ya existentes.
2. **Moneda independiente por producto:** En `Productos → Nuevo/Editar` aparece **«Moneda del precio»**. Cada artículo conserva `CUP` o `USD`; sus variantes/tallas/colores usan esa misma moneda. El precio escrito se respeta exactamente, sin equivalencias.
3. **Cero conversiones y cero mezclas:** Sin tasa de cambio. Carrito, WhatsApp, pedido directo, solicitudes, chat y notificaciones muestran importes **por separado** (`2500 CUP + 12 USD`).
4. **Orden por precio honesto:** agrupa primero por moneda principal y compara importes solo dentro de cada moneda.
5. **Persistencia y seguridad:** columnas `currency_code`, `default_currency_code` y `totals_by_currency` con `CHECK`; validación Zod y de moneda en RPC; desglose JSONB en pedidos de ambos proyectos.

---

## 4. `v3.1.1` — Corrección de caché PWA

- **Causa real:** el despliegue estático había aplanado las rutas anidadas de `dist/`; `/assets/*` no existía en su ruta y el `rewrite` SPA devolvía `index.html` como si fuera JS/CSS. El ServiceWorker cacheó HTML.
- **Corrección:** `scripts/deploy-static.mjs` conserva rutas relativas completas, usa `headers`/`rewrites` modernos, verifica `content-type` antes de aliasar y restaura la configuración del proyecto.
- **Cachés invalidadas:** Storefront `v9` / `img-by-id-v2`, Admin `v2`; descartan respuestas HTML viejas y solo guardan JS/CSS válidos.

---

## 5. `v3.1.2` — Menú hamburguesa del Panel Admin en Android

1. **Se eliminó la barra inferior de 5 botones del Panel Admin móvil.** Ya no estorba ni duplica funciones en pantallas pequeñas.
2. **Nuevo botón de tres líneas arriba a la izquierda**, acompañado del logotipo y la campana de avisos.
3. **Panel lateral deslizante** con **todas** las secciones permitidas: `Resumen`, `Chat Clientes`, `Productos`, `Categorías`, `Inventario`, `Base de Datos`, `Historial`, `WhatsApp Ext.`, `Vista Previa`, `Equipo` y `Ajustes`, más `Cerrar sesión`.
4. **Comportamiento Android:** fondo oscuro, cierre al tocar fuera, con `Escape`, al navegar o con la `X`; bloqueo del scroll de fondo, foco en el botón de cierre y sección activa resaltada.
5. **Escritorio intacto:** el sidebar izquierdo sigue siempre visible y solo el panel derecho muestra carga o errores.
6. **Tienda pública intacta:** conserva su barra inferior de 5 botones con `Buscar` y `Carrito` en la cabecera, tal como se pidió anteriormente.
7. **Ajustes de espacio:** se quitó el relleno inferior de `24` unidades y se bajaron a `bottom-4` la tarjeta de actualización y el botón guardar del editor, ahora que no hay barra inferior.

---

## 6. Limpieza de pruebas solicitada por Katia

Se eliminó **sin respaldo**, por decisión explícita de la propietaria, todo el rastro de pruebas detectado en ambos proyectos:

- **3 productos** (`Carro de Bombero`, `Cactus bailarín`, `Patineta`), sus variantes, inventario, movimientos y **11 objetos de fotos** en `BD-3`/`BD-4` mediante la API oficial de Storage.
- **9 mensajes**, **3 contactos**, **1 pedido directo pendiente** (`APP-BAAED5`), **5 notificaciones**, señales de carrito, solicitudes/ítems de pedidos y auditoría de productos/pedidos.
- **Verificación en cero:** productos, fotos, inventario, pedidos, mensajes, contactos, notificaciones, almacenamiento de productos y auditoría de productos/pedidos.
- **Preservado:** `3` categorías, `1` configuración, `3` perfiles, `2` invitaciones, `bot_config`, `5` recursos oficiales de marca, cuentas y planes. No se crearon datos de prueba nuevos.

---

## 7. Vídeos para Katia

- **Tutorial completo (`v3.0.0`):** `/home/user/Tutorial-Katia-PequeModas-Completo.mp4` — `2 min 27 s`.
- **Apéndice de moneda (`v3.1.0`, compatible con `v3.1.2`):** `/home/user/Tutorial-Katia-Monedas-CUP-USD.mp4` — `53 s`, `1280×720`, H.264 + AAC, `2.2 MB`, voz española y subtítulos.
- Las capturas del apéndice seleccionan `USD` sin guardar y simulan un carrito mixto solo en `localStorage`.

---

## 8. Calidad y Verificación (`v3.1.2`)

- **Límite `<= 300` líneas:** `100%` de `176` archivos conformes (`pnpm check:lines`).
- **Tipado, Linter, Unitarias y Build:** `pnpm typecheck`/`build`, `pnpm lint` y `pnpm test` (`23/23`) en verde.
- **Suite E2E Playwright:** `12/12` aprobadas en `Android Pixel 7` y `Desktop Chromium`, incluida la nueva prueba del menú hamburguesa sin barra inferior.
- **Producción verificada:** `v3.1.2`, JS/CSS con su `content-type` real, fallback SPA `/catalogo`, panel lateral del Admin en vivo, cero errores de consola y cero errores de assets; dominios antiguos en `404`.
- **Infraestructura intacta:** sin pagos, sin dominios comprados, sin `SERVICE_ROLE` en frontend, sin pasarelas y sin datos comerciales inventados.
