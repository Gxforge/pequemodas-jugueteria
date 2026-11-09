# DESIGN SYSTEM — Guía Visual y Experiencia de Usuario

## 1. Dirección Visual

El sistema visual de **PequeModas-Juguetería** combina alegría infantil con orden comercial y confianza para madres, padres y familiares:

- **Marca oficial:** Emblema de bloques infantiles y percha boutique con nombre **PequeModas-Juguetería** intacto (configurable en Ajustes si la propietaria sube un archivo de logotipo personalizado).
- **Optimización Android-first:** Todos los botones y controles interactivos respetan alturas mínimas táctiles de `44px`, con barra de navegación inferior fija de 5 accesos tanto en la Tienda Pública como en el Panel Administrativo.

## 2. Paleta Cromática (`@pequemodas/config`)

| Token | Color Hex | Uso Principal |
| :--- | :--- | :--- |
| `brand-600` | `#D4385B` | Acciones primarias, precios en CUP / USD y acentos de marca (contraste AA sobre blanco) |
| `brand-50` | `#FFF1F4` | Fondos suaves de secciones destacadas |
| `sky-600` | `#0284C7` | Acciones secundarias, categorías e insignias informativas |
| `sunny-500` | `#F59E0B` | Etiquetas de productos destacados e imagen principal |
| `mint-600` | `#059669` | Indicador semántico de stock «Disponible» |
| `whatsapp-600` | `#1DA851` | Botón oficial de envío de solicitud por WhatsApp |
| `cream` | `#FFFDF9` | Fondo cálido general de la tienda pública |

## 3. Tipografía y Escala

- **Titulares (`font-heading`):** `'Nunito', 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif` — redondeada, amable y legible.
- **Cuerpo y precios (`font-sans`):** `'Inter', 'Segoe UI', system-ui, sans-serif` — lectura nítida en pantallas pequeñas.

## 4. Catálogo de Componentes (`@pequemodas/ui`)

- `BrandLogo`: Logotipo adaptable (`sm`, `md`, `lg`) con soporte de imagen remota y fallback vectorial.
- `Button`: Variantes `primary`, `secondary`, `whatsapp`, `outline`, `ghost`, `danger` con estado `isLoading`.
- `Input`, `Textarea`, `Select`: Campos accesibles con `label`, `hint`, `error`, `aria-invalid` y `aria-describedby`.
- `Card`, `Badge`, `AvailabilityBadge`: Tarjetas comerciales e insignias semánticas de disponibilidad.
- `Modal`, `Alert`: Diálogo adaptable (hoja inferior en móvil, centrado en escritorio) con soporte de tecla `Escape`.
- `EmptyState`, `Skeleton`, `ProductCardSkeleton`: Estados vacíos orientativos y esqueletos de carga.
- **Demostración en vivo:** Disponible en `/guia-visual` (Tienda Pública) y `/sistema-diseno` (Panel Admin).
