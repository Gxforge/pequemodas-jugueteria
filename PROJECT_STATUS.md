# Estado Oficial del Proyecto — PequeModas-Juguetería (`v3.0.0`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Dominios Oficiales Verificados en Producción

- **Tienda Pública (PWA v3.0.0):** `https://pequemodas.vercel.app` *(dominios antiguos retirados definitivamente — HTTP 404)*
- **Panel Administrativo (PWA v3.0.0):** `https://pequemodas-admin.vercel.app` *(dominios antiguos retirados definitivamente — HTTP 404)*
- **Aviso sobre Vercel Hobby / Comercial:** Ambos proyectos operan actualmente en plan gratuito Hobby para validación técnica sin pagos ni tarjetas. Conforme a los Términos de Servicio de Vercel, para uso comercial permanente se debe contemplar el paso a Vercel Pro cuando el proyecto disponga de un medio de pago autorizado.

---

## 2. Arquitectura Interna de 4 Unidades (`BD-1` a `BD-4`)

1. **Proyecto 1 (`vcohlillbvznsovswdng` · `pequemodas-jugueteria`):**
   - **BD-1 (500 MB):** Catálogo, inventario, equipo con permisos por tareas y clientes/chats iniciales.
   - **BD-3 (1024 MB = 1 GB):** Almacenamiento de fotografías 1 (`product-images` + `brand-assets`).
   - **Edge Functions activas:** `accept-admin-invite`, `storage-health` y `crm-admin-gateway`.
2. **Proyecto 2 (`ikwekjyeoqxwyyandyrr` · `pequemodas-jugueteria-chat`):**
   - **BD-2 (500 MB):** Conversaciones, clientes, pedidos directos, avisos y bot.
   - **BD-4 (1024 MB = 1 GB):** Almacenamiento de fotografías 2 (`product-images`).
   - **Edge Function activa:** `crm-admin-gateway`.

---

## 3. Novedades Incorporadas en `v3.0.0`

1. **Pantalla de Carga Real y Sincronizada (Logo + Nubes Juntos sin Desfase):**
   - `AnimatedBrandCloudsLogo` y `AppBootSplash` decodifican en GPU (`img.decode()`) el logotipo frontal y las nubes antes de levantar el telón, evitando que en teléfonos aparezcan las nubes antes que el logotipo principal.
   - Eliminados los pantallazos en blanco al cambiar de sección en la tienda y retirado el aviso visible de *«Conexión móvil lenta detectada»* (manteniendo la optimización activa en silencio).
2. **Panel Admin convertido en PWA Instalable con Caché Inteligente y Menú Lateral Siempre Fijo:**
   - Añadidos `manifest.webmanifest`, `sw.js`, caché inmutable de módulos `/assets/*` en Vercel, `AdminBootSplash` y precarga automática de datos (`useAdminDataWarmup`).
   - `<Suspense>` y `<AdminPanelErrorBoundary>` viven ahora **únicamente dentro del panel derecho**, de modo que el menú lateral izquierdo jamás desaparece ni se queda en blanco al abrir `Productos`, `Categorías` o `Inventario`.
3. **Resumen Limpio sin Tecnicismos + Nuevas Secciones `Base de Datos` (`BD-1`..`BD-4`) e `Historial`:**
   - Eliminada toda jerga técnica (*Round-Robin*, *Turno A/B*, *Doble Servidor*) de las pantallas del usuario.
   - En `Resumen` aparecen las 4 tarjetas compactas **`BD-1`**, **`BD-2`**, **`BD-3`** y **`BD-4`** con botón **`? Detalles`** que llevan a `/bases-de-datos`.
   - Creada la sección independiente **`Historial`** (`/historial`) con buscador y filtros rápidos para mantener `Resumen` ligero y visual.

---

## 4. Calidad y Verificación (`v3.0.0`)

- **Límite estricto `<= 300` líneas por archivo:** `100%` de archivos conformes (`pnpm check:lines`).
- **Tipado, Linter, Pruebas Unitarias y Build:** `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` en verde (`0` errores).
- **Suite E2E Playwright (`pnpm test:e2e`):** Verificada en Android Chrome y Desktop Chromium (`8/8` pruebas aprobadas).
