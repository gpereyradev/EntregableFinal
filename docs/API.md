# API interna: uso y ejemplos

Contrato completo: [openapi.yaml](openapi.yaml), 22 operaciones. Base pública: `https://nova-salud-gpereyradev.onrender.com/api`.

## Autenticación y CSRF

1. `GET /session` crea/recupera la sesión y responde `{ "user": null, "csrf_token": "…", "demo": true }` antes del login.
2. Conserva las cookies con un cookie jar o `credentials: 'same-origin'`.
3. Envía el token en `X-CSRF-TOKEN` al hacer POST/PUT, incluso login.
4. `POST /login` recibe correo y contraseña y devuelve usuario y nuevo token. Actualiza el token guardado.
5. `POST /logout` invalida la sesión y devuelve un nuevo token.

No hay JWT, tokens públicos en React ni registro libre de administradores. La cookie de sesión es HttpOnly. Ejemplo de integración en el frontend: `frontend/src/api.ts`. En un cliente de otro origen necesitarías diseñar autenticación y CORS específicos; no abrir `Access-Control-Allow-Origin: *` con credenciales.

## Consultar productos

```http
GET /api/products?search=paracetamol&status=all&per_page=20&page=1
Accept: application/json
```

Fragmento de respuesta ilustrativa; IDs y cifras dependen de los datos actuales:

```json
{
  "data": [{
    "id": 1,
    "code": "PAR-500",
    "name": "Paracetamol 500 mg",
    "category_id": 1,
    "presentation": "Blíster · 10 tabletas",
    "price_cents": 350,
    "min_stock": 20,
    "active": true,
    "total_stock": 184,
    "available_stock": 172,
    "category": {"id": 1, "name": "Analgésicos"}
  }],
  "current_page": 1,
  "last_page": 1,
  "total": 1
}
```

`GET /products/{id}` añade `batches`. Los valores de sumas sin lotes pueden ser null; tratarlos como cero. `low` incluye disponible ≤ mínimo y `out` disponible = 0. Un vendedor solo lista activos.

## Crear producto y registrar entrada (administrador)

```http
POST /api/products
Content-Type: application/json
X-CSRF-TOKEN: <token actual>
```

```json
{"code":"DEMO-NUEVO","name":"Producto de exposición","category_id":1,"presentation":"Unidad","description":"Datos ficticios","price_cents":1250,"min_stock":5,"active":true}
```

Responde 201. El stock inicial es cero y se añade con una operación independiente:

```http
POST /api/stock
Idempotency-Key: <UUID nuevo>
X-CSRF-TOKEN: <token actual>
Content-Type: application/json
```

```json
{"type":"entry","product_id":17,"code":"LOTE-EXPO-01","expires_at":"2027-12-31","quantity":20,"reason":"Ingreso de demostración académica"}
```

Responde 201 con `message` y `batch`. La fecha debe ser vigente al ejecutar la solicitud. Un ajuste recibe `type=adjustment`, `batch_id`, `product_id`, cantidad firmada y motivo; no puede dejar el lote en negativo. Si una entrada usa un lote existente debe conservar su vencimiento.

## Confirmar venta

```http
POST /api/sales
Idempotency-Key: <UUID nuevo>
X-CSRF-TOKEN: <token actual>
Content-Type: application/json
```

```json
{"payment_method":"cash","items":[{"product_id":1,"quantity":2},{"product_id":3,"quantity":1}]}
```

Responde 201 con `message` y `sale`: ID, total en céntimos, estado, responsable, líneas y asignaciones de lote. El servidor ignora cualquier precio o total ajeno al contrato y calcula desde los productos. Una línea repetida se rechaza. Los métodos admitidos son `cash`, `card` y `transfer`; solo registran el medio de pago.

Para un reintento, conserva **la misma clave y exactamente el mismo cuerpo**. El servidor devuelve la venta original; no descuenta otra vez. Reutilizar la clave con otros datos responde 409. La unicidad es por usuario y clave, con huella de ruta y cuerpo. Se conservan los recibos sin borrado automático en esta entrega.

## Consultar y anular

`GET /sales?from=2026-11-01&to=2026-11-30&status=completed&page=1` lista operaciones; un vendedor ve solo las suyas. `GET /sales/{id}` incluye `items.allocations.batch` y `user`; al consultar una anulada también `canceller`.

```http
POST /api/sales/28/cancel
Idempotency-Key: <UUID nuevo>
X-CSRF-TOKEN: <token actual>
Content-Type: application/json
```

```json
{"reason":"Cliente desistió de la compra"}
```

Solo administrador. Devuelve `sale` con `status=cancelled`, responsable, fecha y motivo. Un segundo intento con otra clave responde 409; la misma clave con el mismo motivo reproduce la respuesta previa. No hay endpoint para borrar ventas.

## Alertas, reportes y equipo

`GET /alerts` devuelve `low_stock`, `expiring`, `expired` y `as_of`. Al confirmar una venta o un ajuste que deja un producto con disponible ≤ mínimo, el servidor envía un aviso a Telegram si está configurado; no aparece en esta respuesta.  
`GET /reports?from=AAAA-MM-DD&to=AAAA-MM-DD` devuelve importes, conteos, serie diaria y top 5 por unidades. Máximo 366 días.  
`GET /reports/export` con el mismo filtro descarga CSV diario, UTF-8 con BOM.  
`GET /movements?type=entry&product_id=1&page=1` permite reconstruir cambios por lote.  
`GET /audits` conserva acciones relevantes y referencias al objeto.  
`GET /users`, `POST /users`, `PUT /users/{id}` administran el equipo; las contraseñas no aparecen en respuestas.

Estas rutas requieren administrador. Consulta OpenAPI para campos, límites y parámetros. Los errores de recursos inexistentes pueden resolverse antes del control del rol y devolver 404.

## Errores

| Estado | Significado |
|---|---|
| 401 | Sesión ausente o usuario inactivo |
| 403 | Rol insuficiente o venta ajena |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto de clave o venta ya anulada |
| 419 | CSRF inválido; volver a consultar /session |
| 422 | Datos inválidos, vencimiento o stock insuficiente |
| 429 | Límite de login o de operaciones |
| 500 | Error inesperado, sin trazas en producción |

```json
{"message":"El ajuste dejaría existencias negativas.","errors":{"quantity":["El ajuste dejaría existencias negativas."]}}
```

El navegador muestra los errores junto a los campos cuando existe un campo correspondiente y conserva un mensaje general para errores de la operación.
