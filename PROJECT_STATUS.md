# Estado Oficial del Proyecto — PequeModas-Juguetería (`v2.7.0`)

**Desarrollado por:** StudioLexair  
**Propietaria:** Katia (Cuba)  
**Repositorio GitHub:** `https://github.com/Gxforge/pequemodas-jugueteria`  
**Fecha de actualización:** 2026-11-06  

---

## 1. Dominios Oficiales Verificados en Producción

- **Tienda Pública (PWA v2.7.1):** `https://pequemodas.vercel.app` *(dominios antiguos retirados definitivamente — HTTP 404)*
- **Panel Administrativo:** `https://pequemodas-admin.vercel.app` *(dominios antiguos retirados definitivamente — HTTP 404)*
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

## 3. Novedades Incorporadas en `v2.7.0`

1. **Dominio Oficial `pequemodas.vercel.app` + Icono/Vista Previa Limpia para WhatsApp:**
   - Asignados y verificados los dominios cortos `pequemodas.vercel.app` y `pequemodas-admin.vercel.app`.
   - Generado `favicon.ico` multi-resolución (`16/32/48/64px`) en la raíz y nueva tarjeta `og-pequemodas-v3.jpg` (`< 150 KB`) con el logo real de PequeModas-Juguetería, reemplazando definitivamente el antiguo icono por defecto de dos cuadrados.
2. **Chat Instantáneo estilo WhatsApp con Reloj y Confirmación de Lectura (`🕐`, `✓`, `✓✓`):**
   - Corregido el contraste de las burbujas enviadas por la tienda (`bg-[#dcf8c6]` verde menta suave con texto oscuro nítido, nunca blanco sobre blanco).
   - Envío optimista instantáneo (`0 ms`): muestra reloj (`🕐`) mientras sale del teléfono, un check (`✓`) al guardarse en servidor y doble check celeste (`✓✓`) en cuanto la otra parte abre la conversación (`read_at`), más botón *Reintentar* si falla la señal.
3. **Sección `Equipo` con Puestos Reales y Asignación Visual de Tareas:**
   - Puestos claros sin tecnicismos: **Dueña / Propietaria**, **Administrador General**, **Ventas y Atención**, **Encargado(a) de Catálogo** y **Moderador(a) de Tienda**.
   - Casillas sencillas para elegir exactamente qué pantallas y trabajos puede hacer cada persona (atender chat/pedidos, subir productos/fotos, ajustar stock, crear categorías, editar datos de tienda o gestionar equipo), tanto al invitar como al editar miembros existentes.
4. **Cajón de Avisos Inteligentes 100% Dentro de la Aplicación:**
   - Reconstruido con un cajón lateral deslizante (`createPortal` dentro del viewport `right-0 max-w-md`) para que jamás se corte fuera del borde izquierdo de la ventana, navegando directamente a la conversación o sección correspondiente al tocar cada aviso.
5. **Resumen con Doble Servidor de Fotos (`2 GB`) y Doble Base Round-Robin (`1 GB`):**
   - Muestra las **2 tarjetas de Almacenamiento de Fotografías (`1 GB + 1 GB = 2 GB`)** y las **2 Bases de Datos (`500 MB + 500 MB`)** trabajando en conjunto mediante sistema Round-Robin.

---

## 4. Calidad y Verificación

- **Modularidad estricta (`<= 300` líneas por archivo):** `153/153` archivos aprobados (`pnpm check:lines`).
- **TypeScript + ESLint:** `0` errores en los 8 paquetes del monorepo.
- **Tests Unitarios (Vitest):** `17/17` aprobados.
- **Tests End-to-End (Playwright Chromium Android + Escritorio):** `8/8` aprobados.
