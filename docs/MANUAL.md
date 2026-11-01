# Manual breve de Nova Salud

## Acceso

Abre la URL del servicio e ingresa el correo y la contraseña recibidos de forma privada. Usa la cuenta de administrador para gestionar y la de vendedor para atender. Si el servidor gratuito estaba suspendido, la primera carga puede tardar. En móvil, abre el menú con el icono de tres líneas.

## Administrador: preparar inventario

1. En **Inventario → Nuevo producto**, completa código único, nombre, categoría, presentación, precio y stock mínimo.
2. Crear un producto no crea unidades. Selecciona **Registrar entrada**, busca el producto, elige su nombre y registra lote, fecha, cantidad y motivo.
3. Si ingresas de nuevo el mismo lote, conserva exactamente su fecha de vencimiento. Las unidades se sumarán al lote existente.
4. Para corregir un conteo, elige **Ajuste**, selecciona un lote y registra una variación: `+5` agrega cinco, `-3` retira tres. Describe el motivo.
5. **Ver lotes** muestra el detalle. El disponible no incluye vencidos; el total sí. Los productos inactivos permanecen en el historial y no se venden.

Si una entrada no aparece en el selector, revisa la búsqueda. Los resultados de consulta por solicitud se limitan a 100; utiliza un nombre o código concreto para encontrar un producto entre catálogos grandes.

## Vendedor: registrar una venta

1. Abre **Punto de venta** y busca por nombre o código; puedes filtrar por categoría.
2. Selecciona los productos. Revisa las cantidades y los subtotales en el carrito.
3. Retira una línea con la X o vacía el carrito. Elige efectivo, tarjeta o transferencia. Solo se registra el método; no se procesa un cobro externo.
4. Pulsa **Confirmar venta**. Revisa el resumen y registra.
5. Se abrirá el comprobante interno. Revisa el detalle e imprime si lo necesitas.

Si otro usuario consumió las últimas unidades, el servidor rechaza la venta completa sin descontar nada. Actualiza y ajusta el carrito. Si ocurre un error de conexión después de confirmar, vuelve a intentar sin cambiar los datos: se conserva la clave de esa operación para evitar duplicados mientras continúes en esa pantalla.

No recargues ni cierres la pantalla para reintentar una venta cuya respuesta se perdió: primero consulta el historial y verifica si se registró. La protección de reintento del navegador se mantiene en la sesión actual de la vista; no es una cola offline.

## Consultar y anular

**Ventas** permite filtrar fechas y estado. La flecha abre el detalle, con importes y lotes originales. Un vendedor ve únicamente sus ventas. El administrador ve las de todo el equipo.

Para anular, el administrador abre una venta confirmada, pulsa **Anular venta**, explica el motivo y confirma. La aplicación repone las unidades a los lotes originales y conserva la venta como anulada. No se puede volver a reponer una venta anulada. No se eliminan ventas.

## Alertas y reportes

- **Alertas → Productos por reponer:** disponible igual o inferior al stock mínimo; incluye agotados.
- **Próximos a vencer:** lotes con unidades y fecha entre hoy y los siguientes 30 días.
- **Vencidos:** lotes con unidades y fecha anterior a hoy, bloqueados para venta.
- **Reportes:** selecciona inicio y fin, hasta 366 días. Revisa importes, cantidad de ventas, ticket promedio y productos más vendidos. Exporta el detalle diario con **CSV**.

Las ventas anuladas no se incluyen en importes ni ranking. Los importes no representan utilidad. Las alertas no envían WhatsApp ni correo.

## Equipo y cierre

En **Equipo**, el administrador crea cuentas y modifica nombre, correo, rol o estado. Contraseña: mínimo 12 caracteres. Para conservar la contraseña al editar, deja el campo vacío. No puedes desactivar tu propio acceso de administrador ni cambiarte a vendedor desde esa sesión.

Cierra sesión con el icono junto a tu perfil. La sesión dura 120 minutos de inactividad según la configuración; vuelve a ingresar si vence.

## Actualización de las vistas

Los datos se consultan automáticamente cada 30 segundos cuando la ventana está visible, al volver a ella y después de operaciones locales. El botón de actualización permite consultar antes. El carrito muestra los precios seleccionados; el comprobante y el total definitivo los recalcula el servidor con el precio vigente al confirmar.
