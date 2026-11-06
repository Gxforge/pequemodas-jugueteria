# Estado Oficial del Proyecto — PequeModas-Juguetería (`v2.6.0`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Despliegues Verificados en Producción

- **Tienda Pública (PWA v2.6.0):** `https://pequemodas-jugueteria-tienda.vercel.app`
- **Panel Administrativo:** `https://pequemodas-jugueteria-admin.vercel.app`
- **Aviso sobre Vercel Hobby / Comercial:** Ambos proyectos operan actualmente en plan gratuito Hobby para validación técnica sin pagos ni tarjetas. Conforme a los Términos de Servicio de Vercel, para uso comercial permanente se debe contemplar el paso a Vercel Pro cuando el proyecto disponga de un medio de pago autorizado.

---

## 2. Arquitectura Dual de Bases de Datos en Supabase (Plan Gratuito)

1. **Base de Datos 1 — Catálogo, Fotografías, Inventario y Acceso Admin (`vcohlillbvznsovswdng` · `pequemodas-jugueteria`):**
   - Tablas de tienda, ajustes, categorías con portada (`image_url`), productos, variantes, fotos WebP en Storage (`product-images`, `brand-assets`), auditoría y equipo.
2. **Base de Datos 2 — Clientes, Compras Directas, Chat estilo WhatsApp, Avisos Anti-Spam y Bot (`ikwekjyeoqxwyyandyrr` · `pequemodas-jugueteria-chat`):**
   - `customer_contacts`, `direct_orders`, `chat_messages`, `admin_notifications` (con agrupación `dedupe_key` para nunca saturar de notificaciones) y `bot_config` extensible.
   - Seguridad estricta: RLS activado en todas las tablas, funciones `SECURITY DEFINER` por `customer_token` para clientes y puente autenticado `crm-admin-gateway` (Edge Function) que valida la sesión administrativa de la Base 1 sin doble inicio de sesión.

---

## 3. Mejoras Incorporadas en `v2.6.0`

1. **Logo Oficial Permanente en Cabecera y Pie:** Eliminado por completo el antiguo icono geométrico `<svg>`; ahora siempre muestra el logo transparente oficial de PequeModas-Juguetería.
2. **Paneles Visuales de Categorías con Rotación cada 6 Segundos:**
   - Permite subir una foto de referencia al crear o editar cada categoría en el Admin.
   - En la tienda (`/` y `/categorias`), cada categoría se presenta como un panel visual que rota suavemente fotos aleatorias de sus productos cada `6 segundos` únicamente mientras la sección está visible en pantalla.
3. **Vista Previa Interactiva de la Tienda en el Admin (`/vista-previa`):** Simulador en vivo para Teléfono Android, Tablet y PC.
4. **Resumen Administrativo Rediseñado (`/resumen`):**
   - Movimientos traducidos a español humano claro (sin códigos como `settings.update` o `category.update`).
   - SVGs propios por métrica, 2 tarjetas principales superiores, gráfico visual central y tarjetas secundarias debajo.
   - Indicadores limpios de espacio ocupado/disponible para **ambas** bases de datos de Supabase sin jerga técnica.
5. **Opciones y Tallas Simplificadas:** Selector directo entre *«Artículo único»* y *«Varias opciones (Tallas, Colores, Edades...)»* con botones rápidos (`+ Talla`, `+ Color`, `+ Edad`, `+ Diseño`).
6. **Gestor de Avisos Inteligentes Sin Spam (`NotificationManagerBell`):** Agrupa actividad de carritos (ventana de 30 min por sesión) y mensajes no leídos por contacto para alertar sobre compras y actualización de stock sin saturar.
7. **Compra Dual (En la App o por WhatsApp) + Chat estilo WhatsApp (`/mensajes`) + Bot Configurable:**
   - El cliente elige en `/carrito` entre **Comprar aquí en la App** (guardando nombre, teléfono y dirección en la Base 2 y abriendo su chat en vivo) o **Por WhatsApp**.
   - Panel `/mensajes` estilo WhatsApp con lista de contactos a la izquierda, hilo en vivo a la derecha, selector de estado de pedido, enlace a stock y configurador del Bot Asistente listo para personalizar reglas.

---

## 4. Calidad y Verificación

- **Modularidad estricta (`<= 300` líneas por archivo):** `146/146` archivos aprobados (`pnpm check:lines`).
- **TypeScript + ESLint:** `0` errores en los 7 paquetes del monorepo.
- **Tests Unitarios (Vitest):** `17/17` aprobados.
- **Tests End-to-End (Playwright Chromium Móvil + Escritorio):** `8/8` aprobados.
