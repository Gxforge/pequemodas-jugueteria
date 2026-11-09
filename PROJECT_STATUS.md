# Estado Oficial del Proyecto — PequeModas-Juguetería (`v3.1.1`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Dominios Oficiales Verificados en Producción

- **Tienda Pública (PWA v3.1.1):** `https://pequemodas.vercel.app` — despliegue `dpl_BAaJmJaEVzpJrtS3gcdnBN82zu1a` (`200 OK`, `/version.json = 3.1.1`).
- **Panel Administrativo (PWA v3.1.1):** `https://pequemodas-admin.vercel.app` — despliegue `dpl_GESr2UYB4Z3p57qtH7NYhTCJJibF` (`200 OK`, `/version.json = 3.1.1`).
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

## 3. Novedades de `v3.1.0` — Moneda `CUP` / `USD`

1. **Moneda principal configurable en `Ajustes`:** Katia elige `CUP` o `USD` como moneda inicial para los productos nuevos. Cambiarla **no modifica** los productos ya existentes.
2. **Moneda independiente por producto:** En `Productos → Nuevo/Editar` aparece el selector **«Moneda del precio»**. Cada artículo conserva `CUP` o `USD`; sus variantes/tallas/colores usan esa misma moneda. El precio escrito se respeta exactamente, sin calcular equivalencias.
3. **Cero conversiones y cero mezclas:** No se añadió tasa de cambio. El carrito, el mensaje de WhatsApp, el pedido directo en la App, las solicitudes del panel, el chat y las notificaciones muestran los importes **por separado** (`2500 CUP + 12 USD`).
4. **Orden por precio honesto:** Al ordenar por menor/mayor precio, la tienda agrupa primero por la moneda principal y compara importes solo dentro de cada moneda.
5. **Persistencia y seguridad:** Columnas `currency_code`, `default_currency_code` y `totals_by_currency` con `CHECK` en PostgreSQL; validación Zod y de moneda dentro de las RPC; desglose JSONB en pedidos de ambos proyectos Supabase.

---

## 4. Corrección de `v3.1.1` — Caché PWA y módulos JS/CSS

- **Causa real del error reportado:** el script de despliegue estático había aplanado las rutas anidadas de `dist/`; los archivos de `/assets/*` no existían en la raíz del despliegue y el `rewrite` SPA devolvía `index.html` con `content-type: text/html`. El ServiceWorker cacheó esas respuestas HTML como si fueran módulos.
- **Corrección aplicada:** el empaquetado de archivos conserva ahora rutas relativas completas (`assets/...`, `brand/...`, `icons/...`); configuración `vercel.json` con `headers` y `rewrites` modernos; verificación obligatoria de `content-type` antes de aliasar el dominio.
- **Limpieza de caché en dispositivos:** Storefront pasa a cachés `v9` e `img-by-id-v2`; Admin pasa a cachés `v2`. El nuevo `sw.js` descarta respuestas HTML antiguas, borra cachés obsoletas y solo guarda JS/CSS válidos. El detector de versión `v3.1.1` avisa a las pestañas abiertas.
- **Sin cambios en la base de datos:** esta corrección fue exclusivamente de despliegue, PWA y versionado.

---

## 5. Limpieza de pruebas solicitada por Katia

Se eliminó **sin respaldo**, por decisión explícita de la propietaria, todo el rastro de pruebas detectado en ambos proyectos:

- **3 productos:** `Carro de Bombero`, `Cactus bailarín` y `Patineta`, junto con sus variantes, inventario, movimientos y `5 + 6` objetos de fotos en los buckets `product-images` de `BD-3` y `BD-4` mediante la API oficial de Supabase Storage.
- **9 mensajes** de cliente/admin/bot, **3 contactos**, **1 pedido directo pendiente** (`APP-BAAED5`), **5 notificaciones**, señales de carrito, solicitudes/ítems de pedidos y auditoría de productos/pedidos.
- **Verificación posterior en cero:** `products`, `product_images`, `inventory`, `orders`, `direct_orders`, `chat_messages`, `customer_contacts`, `admin_notifications`, `product-images` y auditoría de productos/pedidos = `0` en los proyectos correspondientes.
- **Preservado intacto:** `3` categorías, `1` configuración de tienda, `3` perfiles, `2` invitaciones, `bot_config`, `5` recursos oficiales de marca, cuentas y planes. No se creó ningún dato de prueba nuevo durante la limpieza.

---

## 6. Vídeos para Katia

- **Tutorial completo (`v3.0.0`):** `/home/user/Tutorial-Katia-PequeModas-Completo.mp4` — `2 min 27 s`, recorrido general del panel.
- **Apéndice de moneda (`v3.1.0`, compatible con `v3.1.1`):** `/home/user/Tutorial-Katia-Monedas-CUP-USD.mp4` — `53 s`, `1280×720`, H.264 + AAC, `2.2 MB`, voz española `voice-00`, subtítulos y capturas reales de `Ajustes`, `Productos` y `Carrito`.
- **Cero datos de prueba:** las capturas del apéndice seleccionan `USD` sin guardar y simulan un carrito mixto solo en `localStorage` del navegador.

---

## 7. Calidad y Verificación (`v3.1.1`)

- **Límite estricto `<= 300` líneas por archivo:** `100%` de `174` archivos conformes (`pnpm check:lines`).
- **Tipado, Linter, Pruebas Unitarias y Build:** `pnpm typecheck`/`build`, `pnpm lint` y `pnpm test` (`23/23`) en verde.
- **Suite E2E Playwright:** `10/10` pruebas aprobadas en `Android Pixel 7` y `Desktop Chromium`.
- **Producción verificada:** `version.json = 3.1.1`, `sw.js` con `no-store`, módulos JS con `application/javascript`, CSS con `text/css`, fallback SPA `/catalogo` en `200` y dominios antiguos en `404`.
- **Infraestructura intacta:** Sin pagos, sin dominios comprados, sin `SERVICE_ROLE` en frontend, sin pasarelas y sin datos comerciales inventados.
