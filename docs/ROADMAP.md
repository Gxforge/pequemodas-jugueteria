# ROADMAP — Hoja de Ruta Evolutiva (StudioLexair)

## Fase Actual Entregada (v1.0.0)
- Monorepositorio modular (`<= 300` líneas por archivo) con Tienda Pública PWA y Panel Administrativo.
- Base de datos PostgreSQL 17 en Supabase con RLS estricta, inventario híbrido, variantes dinámicas y fotografías optimizadas a WebP.
- Flujo completo de pedidos por WhatsApp sin pagos online ni reserva automática.

## Evoluciones Futuras Recomendadas (Sin Dependencia de Tarjetas de Clientes)

### v1.1 — Operaciones y Catálogo Rápido en Campo
- **Modo borrador offline en Panel Admin:** Permitir que Katia redacte productos sin conexión móvil y sincronice al recuperar datos.
- **Generación de catálogo PDF / imagen compartible para Estados de WhatsApp:** Exportar automáticamente láminas promocionales en `CUP` de los productos destacados para publicar en grupos de WhatsApp.
- **Carga por lotes de precios en CUP:** Ajuste porcentual o masivo por categoría ante variaciones cambiarias locales.

### v1.2 — Experiencia del Cliente y Fidelización
- **Lista de favoritos local:** Guardar juguetes o prendas para cumpleaños futuros en el teléfono del cliente.
- **Guía interactiva de tallas infantiles:** Tabla configurable por Katia en centímetros/edades por categoría de ropa o calzado.
- **Notificaciones de reposición por enlace directo:** Botón «Avísame cuando vuelva» prellenado para WhatsApp en artículos agotados.

### v1.3 — Escalamiento Comercial (Cuando Exista Presupuesto Autorizado)
- **Activación de Vercel Pro + Dominio propio** (ej. `pequemodas.com`) para operación comercial plena bajo SLA.
- **Respaldos automatizados en almacenamiento externo** programados desde GitHub Actions (`cron` semanal con secretos cifrados).
