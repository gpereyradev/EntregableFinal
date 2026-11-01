# Guía para incorporar APIs externas

La entrega ya contiene la API interna y todas las operaciones base. La siguiente etapa del compañero consiste en añadir proveedores externos reales, sin reemplazar las reglas que protegen las existencias.

## Por dónde empezar

1. Ejecuta el proyecto local siguiendo README y revisa `docs/openapi.yaml`.
2. Crea una rama de Git para la integración. Para cambios de esquema usa una base de prueba aislada, sin tocar el entorno publicado.
3. Define el caso de uso y su permiso: por ejemplo, consulta de catálogo de proveedor desde administración.
4. Crea una interfaz y un adaptador dentro de `backend/app/Integrations/<Proveedor>/`; esos directorios se añadirán cuando haya una integración real. No hay proveedores simulados en esta entrega.
5. Usa el cliente HTTP de Laravel, con `timeout`, `connectTimeout`, validación de respuesta y manejo de estados. Configura la URL y las credenciales en `config/services.php` y variables de entorno del servidor. Nunca pongas claves en React o en `VITE_*`.
6. Añade un controlador propio, una FormRequest y middleware de rol. Documenta el endpoint en OpenAPI.
7. Escribe pruebas con `Http::fake()` para error, timeout, respuestas malformadas y reintentos. Identifica esas pruebas como simulación de proveedor, no como integración pública comprobada.
8. Verifica con un entorno sandbox real del proveedor y registra solo evidencias que realmente se ejecutaron.

## Fronteras que se deben preservar

- Una consulta de producto o documento no puede escribir cantidades directamente en `batches`.
- Una compra o reposición validada termina en una entrada mediante InventoryService, con actor autorizado, lote, fecha, motivo y clave de idempotencia.
- Nunca confíes en el total enviado por React: `sell` calcula el precio desde Product.
- Las anulaciones solo pasan por `cancel`, que conoce las asignaciones originales.
- No hagas HTTP externo mientras mantienes bloqueadas filas del inventario. Primero consulta/valida el proveedor y después abre la transacción corta.
- Los webhooks necesitan verificación criptográfica y una clave única por evento; no basta con ocultar la URL. Conserva idempotencia del proveedor además del recibo interno por usuario.
- Una pasarela de pago necesita una máquina de estados propia: pendiente, autorizado, confirmado, rechazado o reembolsado. Registrar el método `card` actual no equivale a procesar un pago.
- Si se agrega emisión SUNAT, mantén una entidad fiscal separada con sus estados, validaciones y respuestas del proveedor. No cambies el rótulo del comprobante interno para aparentar autorización.

## Ejemplo de patrón (orientativo, no implementado)

```php
$response = Http::acceptJson()
    ->connectTimeout(3)
    ->timeout(8)
    ->withToken(config('services.proveedor.token'))
    ->get(config('services.proveedor.url').'/catalogo');
$response->throw();
```

Nombres ilustrativos: definirlos con el contrato real. No aplicar reintentos automáticos a una escritura externa si el proveedor no garantiza idempotencia. No registrar tokens, documentos completos ni datos sensibles en los logs.

## Entrega del compañero

Actualizar `.env.example` sin secretos, OpenAPI, manual y matriz; ejecutar la suite de inventario y concurrencia; agregar pruebas específicas de integración; revisar permisos; desplegar y comprobar un flujo real en el sandbox autorizado. Documentar límites, cuotas y proveedor elegido. No hace falta añadir microservicios para una primera API.
