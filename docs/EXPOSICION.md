# Guion sugerido · 7 a 9 minutos

## Antes de presentar

Abre la URL varios minutos antes para despertar el servicio gratuito. Ten disponibles las cuentas privadas de administrador y vendedor. Comprueba que existe un producto con stock, uno agotado y un lote vencido. Usa nombres claramente ficticios en la demostración. Mantén abierto el repositorio en la matriz de requisitos, InventoryService y las pruebas de GitHub Actions.

## 0:00–1:00 · Problema y alcance

«Nova Salud tiene inventario y ventas manuales. Esto dificulta consultar disponibilidad, reponer a tiempo y atender de forma rápida. Nuestra solución centraliza los registros y conecta cada venta con un movimiento de stock. El PDF llama FarmaPlus a la empresa en las preguntas; usamos Nova Salud de forma uniforme».

Muestra la matriz de requisitos. Distingue lo solicitado por el PDF de las mejoras de lotes, vencimientos, roles, reportes e idempotencia.

## 1:00–2:15 · Preparar inventario

Ingresa como administrador. En Inventario, crea `EXPO-001`, precio S/12.50 y mínimo 5. Registra 10 unidades en un lote vigente con motivo. Muestra el producto y sus lotes. Explica que el stock de producto se deriva de los lotes y que los movimientos no se eliminan.

## 2:15–3:45 · Atención y venta

Abre Punto de venta, busca el código, agrega dos unidades y elige efectivo. Revisa el total S/25.00 y confirma. Muestra el comprobante interno y aclara que no es un documento SUNAT. Vuelve a Inventario: deben quedar 8 unidades. En Movimientos, localiza la salida con responsable y referencia de venta.

«Aunque dos vendedores vean una unidad, el servidor bloquea las filas y revalida la disponibilidad. Los precios se calculan en el servidor y se conservan en el detalle histórico».

## 3:45–4:45 · Control y excepciones

Abre Alertas. Muestra un producto agotado y el lote vencido. Explica FEFO. Abre la venta creada, anula con motivo de exposición y verifica que el stock vuelve a 10. Muestra el estado anulado y el motivo. Explica que un segundo intento no vuelve a devolver existencias.

## 4:45–5:45 · Información útil

Filtra Reportes por el día actual y descarga CSV. Explica que solo se suman ventas confirmadas, que los importes no representan ganancias y que no se presentan mejoras inventadas. Cambia a vendedor: ve catálogo y ventas propias, sin controles administrativos.

## 5:45–7:00 · Competencias técnicas

Muestra el diagrama: navegador React → Laravel → PostgreSQL. Abre las FormRequest, el servicio transaccional y el esquema. Explica en lenguaje simple: validación antes de escribir, operaciones completas o ninguna, bloqueo de últimas unidades y clave por operación para reintentos. Muestra las pruebas ejecutadas y su resultado real. No afirmes ensayos que no figuren como completados en PRUEBAS.md.

## 7:00–8:00 · Continuidad del grupo

«La API interna está implementada. Nuestro compañero añadirá proveedores externos en adaptadores del servidor, con sus credenciales fuera del frontend. Ninguna integración podrá saltarse las reglas de inventario. OpenAPI describe los contratos y la guía de integraciones explica dónde ampliar».

Cierra mostrando el enlace, el código y la documentación. La nota depende de la evaluación y del dominio del equipo al defender decisiones; no se garantiza un 100/100 por cantidad de tecnologías.

## Respuestas breves a preguntas probables

- **¿Por qué Laravel?** Centraliza validación, autorización, ORM, sesiones y transacciones con una estructura fácil de ampliar.
- **¿Por qué PostgreSQL?** Relaciones y restricciones, transacciones y bloqueos de fila para proteger existencias concurrentes.
- **¿Por qué varios lenguajes?** Cada uno tiene un papel: TypeScript en la interfaz, PHP en negocio y SQL en persistencia; HTML/CSS para presentación.
- **¿Es tiempo real?** El servidor actualiza inmediatamente en la transacción; las vistas ajenas consultan cada 30 segundos y al recuperar foco. No hay push instantáneo.
- **¿Dónde están las APIs externas?** Telegram Bot API avisa cuando un producto llega a su stock mínimo. Se envía después de confirmar la transacción y un fallo no bloquea la venta. La API interna está operativa y documentada.
- **¿Cómo demuestra que se redujo la espera?** Aún no hay medición de campo. Se propone comparar tiempos antes y después, con mediana y p90 en condiciones equivalentes.
