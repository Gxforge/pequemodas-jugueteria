# ADS STUDIOLEXAIR — Integración en PequeModas-Juguetería

## 1. Decisión de arquitectura

Este repositorio contiene dos **SPA web con Vite/React**: una Tienda pública
(`apps/storefront`) y un Panel privado (`apps/admin`). No existe una app nativa,
WebView, Flutter, Electron ni Tauri. Por tanto se usa el **widget web oficial**
`https://studiolexair.ddns.net/ads.js`, encapsulado en Shadow DOM, y **no** la
integración nativa por API JSON.

- **Slug del proyecto:** `pequemodas`.
  Verificado contra `ads-feed`: `project=pequemodas` devuelve el anuncio activo
  `Stock Desk`; `project=pequemodas-jugueteria` devuelve `ads: []`.
- **Tienda pública:** carga el script una sola vez desde `index.html`.
- **Panel Admin:** no carga anuncios. Es una superficie privada y sensible;
  excluirla evita impactar login, formularios y datos de Katia.
- **Sin secretos:** no se añadió ninguna clave, token ni `VITE_*` privado. El
  backend de anuncios es 100 % público y CORS `*`.

## 2. Carga no bloqueante y compatibilidad CORP

En `apps/storefront/index.html`:

```html
<link rel="preconnect" href="https://studiolexair.ddns.net" crossorigin />
<link rel="preconnect" href="https://ywrspyrplgwxkwdboaiz.supabase.co" crossorigin />
<script src="/ads-cors-patch.js" defer></script>
<script src="https://studiolexair.ddns.net/ads.js" data-project="pequemodas" defer crossorigin="anonymous"></script>
```

La etiqueta pedida originalmente era
`<script src="https://studiolexair.ddns.net/ads.js" data-project="pequemodas" defer></script>`.
Se añadió **`crossorigin="anonymous"`** por una condición real del servidor
central: `ads.js` responde `Cross-Origin-Resource-Policy: same-origin` junto con
`Access-Control-Allow-Origin: *`. Sin modo CORS, Safari/WebKit cancela el script
con `Cross-origin script load denied by Cross-Origin Resource Sharing policy`.
Con `crossorigin`, el navegador hace una petición CORS válida y el script se
ejecuta. Si StudioLexair vuelve a servir `CORP: cross-origin`, el atributo se
puede retirar y volver a la etiqueta exacta.

`ads-cors-patch.js` es un shim mismo-origen muy pequeño, cargado **antes** de
`ads.js` con `defer`. El servidor central también sirve las imágenes/vídeos de
los anuncios con `CORP: same-origin`; el shim activa `crossOrigin = 'anonymous'`
en los elementos `img`, `video` y `poster` cuyo `src` apunte a
`studiolexair.ddns.net`. No modifica imágenes de Supabase Storage ni de la
tienda, no intercepta red y no guarda datos.

Ambos scripts están en el documento raíz y usan `defer`, por lo que el render no
se bloquea y React Router no los duplica al cambiar de ruta. No se añadió un
slot `data-lexair-ad-slot="inline"` porque no se requiere una zona fija: si el
panel central publica un anuncio `inline`, el script lo inserta automáticamente
antes del `<footer>` de la Tienda.

El script genera `lexair_vid` en `localStorage`, consulta:

```text
GET https://ywrspyrplgwxkwdboaiz.supabase.co/functions/v1/ads-feed?project=pequemodas&visitor=<lexair_vid>&path=<ruta>
```

y reporta impresiones/clics con `fetch(..., { keepalive: true })`. El servidor ya
aplica `exclude_paths`, `frequency_mode`, `cooldown_hours`,
`dedupe_across_projects`, `delay_seconds` y `auto_hide_seconds`; el cliente
además evita mostrar el anuncio mientras la usuaria escribe en un formulario.

## 3. CSP

El repositorio **no define** `Content-Security-Policy` en `vercel.json`,
`_headers`, meta etiquetas, `next.config` ni en `scripts/deploy-static.mjs`.
Por tanto no hubo que relajar directivas y no se introdujo una CSP nueva que
pudiera romper Tailwind, Supabase Storage, WhatsApp o el módulo de Vite.

`scripts/check-ads-integration.mjs` audita este punto: si en el futuro aparece
una CSP, exige:

- `https://studiolexair.ddns.net` en `script-src`, `img-src` y `media-src`;
- `https://ywrspyrplgwxkwdboaiz.supabase.co` en `connect-src`, `img-src` y `media-src`;
- `'self'` en `script-src`, necesario para `/ads-cors-patch.js`.

También verifica la cabecera CSP en vivo con `--live`.

## 4. Service Worker / PWA

Ambos Service Workers mantienen una regla **Network-Only explícita** para:

```text
studiolexair.ddns.net
ywrspyrplgwxkwdboaiz.supabase.co
```

Esto garantiza que `ads.js` y `ads-feed` nunca entren en cachés offline ni
devuelvan respuestas obsoletas. La regla usa hosts exactos, por lo que **no**
interrumpe el caché legítimo de imágenes en los buckets `product-images` y
`brand-assets` de los dos proyectos Supabase de la tienda.

Se invalidaron las cachés del SW: Storefront `v13` / `img-by-id-v4` y Admin
`v5`, para que los navegadores instalen de inmediato la nueva regla y el shim.

## 5. Verificación

```bash
pnpm build
pnpm check:ads                         # HTML final, shim, CSP y SW
pnpm check:pwa:ios
pnpm test:e2e:ios                      # incluye carga única + cero errores de consola
node scripts/check-ads-integration.mjs --live
pnpm deploy:static                     # verifica ads.js y el shim antes de aliasar producción
```

`e2e/pwa-ios.spec.ts` simula `ads.js` y `ads-feed` sin red externa, comprueba
que la etiqueta aparece **una sola vez** con `data-project="pequemodas"`,
`defer`, `crossorigin="anonymous"` y el shim mismo-origen, navega a `/catalogo`
sin recargar el documento, verifica que no haya errores de consola/CSP/
`requestfailed` relacionados con anuncios y confirma que el HTML del Panel
Admin no contiene `ads.js`.

La verificación final en producción usa WebKit con perfil `iPhone 13` y
Chromium `Pixel 7` contra los dominios reales: `ads.js` responde `200`, se crea
`lexair_vid`, `ads-feed` responde `200`, el anuncio y su imagen cargan con
`crossorigin`, y no hay errores de consola ni bloqueos CSP. GitHub Actions
ejecuta `pnpm check:ads` tras el build y, en el job de producción,
`node scripts/check-ads-integration.mjs --live` con User-Agent de iPhone Safari.
