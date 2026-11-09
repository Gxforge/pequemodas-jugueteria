# PWA en iPhone / iPad — Diagnóstico, Corrección y Verificación (`v3.1.3`)

## 1. Qué se detectó

La plataforma estaba preparada únicamente para el mecanismo de **Android + Chrome**:
el evento `beforeinstallprompt`. Ese evento permite mostrar un botón propio de
«Instalar Aplicación» y, al pulsarlo, abrir el diálogo nativo. **Safari en iOS no
implementa `BeforeInstallPromptEvent`**, así que en iPhone ese botón nunca aparecía
y la usuaria no recibía ninguna indicación de cómo añadir la app. La documentación
y las pruebas anteriores hablaban solo de «Android», lo que confirmaba el sesgo.

Además, el HTML de la Tienda y del Panel no incluía las etiquetas propias de Apple
ni un icono `apple-touch-icon` de `180 × 180`, y el `start_url` del manifest de la
Tienda llevaba un parámetro de seguimiento (`/?utm_source=pwa`) innecesario para
Safari. El resultado era: Android instalaba, iPhone parecía «no poder instalar».

## 2. Cómo se corrige en `v3.1.3`

| Punto | Antes | Ahora |
| :--- | :--- | :--- |
| Botón de instalación | Solo si llegaba `beforeinstallprompt` | Android conserva su botón; iPhone/iPad reciben una guía manual visible |
| Etiquetas Apple | Ausentes | `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`, `viewport-fit=cover` |
| Icono de inicio | Solo `192 × 192` genérico | `apple-touch-icon.png` opaco de `180 × 180` en `/icons/` y en la raíz, más `apple-touch-icon-precomposed` |
| Manifest | `start_url: "/?utm_source=pwa"` | `start_url: "/"` y `scope: "/"` en ambas apps; se añade el icono de `180` |
| Guía para la usuaria | Inexistente | Tarjeta con pasos de Safari, página `/instalar` y guía en `/acceso` del Panel |
| Service Worker | Cachés `v9` / `v2` | Cachés `v11` / `v4`, con el icono Apple precargado y sin guardar HTML como JS/CSS |
| Pruebas | Android + escritorio | Se añade WebKit con perfil `iPhone 13` y regresión Android, ejecutables en GitHub Actions |

La guía detecta iPhone, iPad (incluido iPadOS que se identifica como `MacIntel`),
si ya se abrió desde la pantalla de inicio (`navigator.standalone` o
`display-mode: standalone`), y si el enlace se abrió dentro de WhatsApp, Facebook,
Instagram o Chrome/Firefox/Edge para iOS, adaptando las instrucciones. Nunca
simula una instalación automática que iOS no permite.

## 3. Pasos que ve Katia o un cliente en iPhone

1. Abrir el enlace oficial en **Safari** (si llegó por WhatsApp: «Abrir en Safari»).
2. Tocar **Compartir** (cuadrado con flecha hacia arriba; en barra compacta, primero los tres puntos).
3. Elegir **«Añadir a pantalla de inicio»**.
4. Dejar activado **«Abrir como App Web»** en iOS 26 o posterior y confirmar con **«Añadir»**.
5. Abrir la app desde el icono nuevo: se mostrará a pantalla completa, sin barras de Safari.

No se descarga nada del App Store, no se pide tarjeta y no se crean datos
comerciales de prueba.

## 4. Verificación automática

### GitHub Actions (`.github/workflows/ci.yml`)

En cada `push` a `main` y en cada Pull Request se ejecuta, sin secretos reales:

1. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
2. `pnpm check:pwa:ios`: analiza el `dist/` de ambas apps (etiquetas Apple,
   manifest, icono PNG opaco de `180 × 180`, Service Worker y versión).
3. Instalación de WebKit y Chromium con dependencias del sistema.
4. `pnpm test:e2e:ios`: `playwright.ios.config.ts` levanta `vite preview` y corre
   `e2e/pwa-ios.spec.ts` con `iPhone 13` (WebKit) y `Pixel 7` (Chromium).

Con `workflow_dispatch` y `verificar_produccion = true`, un segundo trabajo valida
las URLs reales con `User-Agent` de iPhone Safari: HTML con meta etiquetas Apple,
`manifest.webmanifest` con `content-type` correcto, icono `image/png` real,
`/sw.js` y `/assets/*.js` con `application/javascript`, `version.json` coincidente
y fallback SPA.

### Comandos locales

```bash
pnpm check:pwa:ios                         # validación estática del build
pnpm test:e2e:ios                          # WebKit iPhone + regresión Android
node scripts/check-pwa-ios.mjs --live      # validación de producción con UA iPhone
pnpm test:e2e                              # suite completa Android + escritorio
```

## 5. Límites honestos de iOS

- iPhone no muestra un aviso automático de instalación ni permite disparar el
  diálogo desde JavaScript; la instalación siempre es manual desde Safari.
- Las notificaciones push en iOS requieren iOS 16.4 o posterior y que la app ya
  esté en la pantalla de inicio.
- Safari no ofrece sincronización en segundo plano equivalente a Android; la
  plataforma sigue siendo una PWA con caché inteligente, no una app nativa.
- Estas limitaciones son del navegador, no de Supabase, Vercel ni de la tienda.
