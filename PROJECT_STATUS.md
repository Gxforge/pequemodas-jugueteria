# Estado Oficial del Proyecto — PequeModas-Juguetería (`v2.9.0`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Dominios Oficiales Verificados en Producción

- **Tienda Pública (PWA v2.9.0):** `https://pequemodas.vercel.app` *(dominios antiguos retirados definitivamente — HTTP 404)*
- **Panel Administrativo (`v2.9.0`):** `https://pequemodas-admin.vercel.app` *(dominios antiguos retirados definitivamente — HTTP 404)*
- **Aviso sobre Vercel Hobby / Comercial:** Ambos proyectos operan actualmente en plan gratuito Hobby para validación técnica sin pagos ni tarjetas. Conforme a los Términos de Servicio de Vercel, para uso comercial permanente se debe contemplar el paso a Vercel Pro cuando el proyecto disponga de un medio de pago autorizado.

---

## 2. Arquitectura Dual Round-Robin en Supabase (1 GB Base de Datos + 2 GB Almacenamiento de Fotos)

1. **Proyecto 1 (`vcohlillbvznsovswdng` · `pequemodas-jugueteria`):**
   - **Base de Datos 1 (500 MB):** Catálogo, inventario, equipo con permisos por tareas (`team_role` + `permissions` JSONB) **+ Turno A de Chats, Clientes y Pedidos**.
   - **Almacenamiento de Fotos 1 (1024 MB = 1 GB):** Bucket `product-images` (Pool 1) + `brand-assets`.
   - **Edge Functions activas:** `accept-admin-invite`, `storage-health` y `crm-admin-gateway`.
2. **Proyecto 2 (`ikwekjyeoqxwyyandyrr` · `pequemodas-jugueteria-chat`):**
   - **Base de Datos 2 (500 MB):** **Turno B de Chats, Clientes, Pedidos Directos, Avisos y Bot**.
   - **Almacenamiento de Fotos 2 (+1024 MB = +1 GB Extra):** Bucket `product-images` (Pool 2) con reparto automático **Round-Robin** para sumar **2 GB totales de fotografías**.
   - **Edge Function activa:** `crm-admin-gateway`.

---

## 3. Novedades Incorporadas en `v2.9.0`

1. **Aviso Automático y Rápido de Nueva Versión en Pestañas Abiertas (Sin Necesidad de Recargar):**
   - `usePwaInstall` (Tienda) y `AdminLiveUpdateCard` (Panel Admin) vigilan `/version.json` con `cache: 'no-store'` cada **15 segundos** mientras la pestaña está visible y al enfocar/interactuar, junto con cabeceras CDN `no-store` en Vercel.
   - Al publicarse una versión nueva, aparece automáticamente la tarjeta flotante con mini logo animado y botón **«Actualizar a vX.Y.Z»**, conservando el carrito y la caché local de fotografías por ID (`pequemodas-img-by-id-v1`).
2. **Cabecera Móvil Limpia + Barra Inferior de 5 Botones con `Buscar` (Sin Duplicar `Carrito`):**
   - Eliminado el bloque extra de buscador y píldoras horizontales debajo del logo móvil.
   - `Carrito` permanece únicamente arriba a la derecha, mientras los **5 botones inferiores móviles** quedan limpios y directos: **`Inicio`**, **`Catálogo`**, **`Categorías`**, **`Cómo pedir`** y **`Buscar`**.
3. **Catálogo Ultrarrápido «Texto Primero» + Indicador Visual de Carga de Foto para Conexiones Lentas:**
   - `StorefrontContext` precarga e hidrata el paquete ligero de datos del catálogo para que Inicio, Catálogo, Categorías y Buscador pinten las tarjetas completas (**nombre, categoría, precio en CUP y estado**) en `0 ms` sin esperar las fotos.
   - `SmartProductImage` e `imageIdCache` limitan las descargas simultáneas a `3` por turno en vista cercana (`IntersectionObserver`), muestran una onda *shimmer* con aviso **`Cargando foto...`** mientras la imagen descarga en señal débil, e incluyen botón **`Cargar foto`** si la red móvil corta la descarga.

---

## 4. Calidad y Verificación (`v2.9.0`)

- **Límite estricto `<= 300` líneas por archivo:** Verificado mediante `pnpm check:lines` (`100%` de archivos conformes).
- **Tipado, Linter, Pruebas Unitarias y Build:** `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` en verde (`0` errores).
- **Suite E2E Playwright (`pnpm test:e2e`):** Verificada en Desktop y Mobile (`0` overflow horizontal, detección en vivo de nueva versión sin recargar, barra inferior de 5 botones con `Buscar` y Admin completo).
