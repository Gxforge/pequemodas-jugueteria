# PROJECT OVERVIEW — PequeModas-Juguetería

## 1. Identidad Comercial y Técnica

- **Nombre comercial:** PequeModas-Juguetería
- **Propietaria:** Katia
- **Empresa desarrolladora:** StudioLexair
- **Naturaleza del negocio:** Tienda infantil especializada en juguetes, ropa infantil, calzado y accesorios para bebés, niñas y niños.
- **Monedas configurables:** `CUP` y `USD` por producto, con moneda principal en Ajustes y totales separados sin conversión.

## 2. Propósito de la Plataforma

PequeModas-Juguetería requiere un catálogo vivo donde precios, tallas, colores, edades recomendadas y existencias cambian con alta frecuencia, administrado íntegramente desde un teléfono Android o computador por su propietaria sin necesidad de conocimientos técnicos.

La solución integra **dos aplicaciones web independientes** sobre un mismo backend PostgreSQL y almacenamiento de objetos en **Supabase**:

1. **Tienda Pública (`@pequemodas/storefront`):** Aplicación Web Progresiva (PWA) instalable en Android, rápida en conexiones móviles lentas, con catálogo paginado, búsqueda, filtros por categorías/subcategorías, selección de variantes dinámicas, carrito persistente y preparación automática de solicitudes de pedido hacia **WhatsApp** (`wa.me`).
2. **Panel Administrativo Privado (`@pequemodas/admin`):** Sistema protegido por autenticación Supabase Auth + Row Level Security (RLS), sin registro público, optimizado para el pulgar en Android y escritorio, desde donde Katia gestiona productos, fotografías optimizadas a WebP, categorías, inventario híbrido, solicitudes recibidas y datos comerciales.

## 3. Principio Operativo Fundamental: Infraestructura Sin Pagos Online

Atendiendo a la realidad operativa en Cuba:

- **Cero pasarelas de pago ni tarjetas bancarias:** Ni los clientes ni la propietaria necesitan tarjetas internacionales para operar el sistema en su capa técnica de desarrollo/catálogo.
- **Confirmación humana por WhatsApp:** Abrir WhatsApp genera un mensaje claro y estructurado, pero **no descuenta inventario automáticamente ni reserva unidades** hasta que Katia confirme disponibilidad y condiciones directamente con el cliente.
- **Catálogo inicial 100 % limpio:** No se incluyen productos, precios, tarifas de mensajería ni direcciones ficticias.
