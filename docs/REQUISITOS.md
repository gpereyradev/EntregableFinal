# Matriz de requisitos y evidencia

Fuente: `PIAD-527_TRABAJOFINAL.pdf`, páginas 2–4 con contenido legible; la quinta página no contiene texto legible. El documento llama Nova Salud a la botica en el caso y FarmaPlus en sus cinco preguntas. Se mantiene Nova Salud, sin asumir dos empresas distintas.

## Requisitos explícitos del PDF

| ID | Requisito y origen | Módulo / implementación | Evidencia para demostrar |
|---|---|---|---|
| PDF-01 | Inventario centralizado, pág. 2–3 | `ProductController`, modelos Product/Batch | Buscar un producto; abrir sus lotes y consultar total/disponible |
| PDF-02 | Stock actualizado con las operaciones, pág. 2 | `InventoryService::sell/move/cancel` | Registrar una venta y revisar el nuevo saldo y el movimiento |
| PDF-03 | Alertas automáticas de reposición, pág. 2–3 | `ReportController::alerts` | Ver agotados y productos con disponible ≤ mínimo |
| PDF-04 | Registro de ventas, pág. 2–3 | `OperationController`, Sale/SaleItem | Vender, abrir el detalle y conservar el precio histórico |
| PDF-05 | Interfaz que agilice la atención, pág. 3 | React: POS, búsqueda, carrito y confirmación | Buscar por código; ajustar cantidad y confirmar en pocos pasos |
| PDF-06 | Acceso desde dispositivos web, pág. 3 | SPA adaptable, Apache/HTTPS | Abrir desde escritorio y tamaño móvil |
| PDF-07 | Seguridad de datos, pág. 3 | Sesión, CSRF, roles, validaciones, restricciones | Intento de vendedor sobre stock → 403; invitado → 401 |
| PDF-08 | Optimizar gestión y reducir errores, pág. 3 | Transacciones, claves únicas, idempotencia y trazabilidad | Venta insuficiente no cambia nada; reintento no duplica |
| PDF-09 | Sustento de propuesta y diagramas, pág. 4 | Documentación académica y diagramas Mermaid | `ARQUITECTURA.md`, `ACADEMICO.md` y guion |
| PDF-10 | Competencias frontend/backend y despliegue integral, objetivo pág. 2 | React + Laravel + PostgreSQL, repositorio y Render | Aplicación pública con flujo completo |

El PDF menciona actualización «en tiempo real». Esta versión implementa comprobación transaccional al operar y consulta automática cada 30 segundos en las vistas visibles; documenta esa latencia y no la presenta como comunicación instantánea. Si el docente exige push inmediato, añadir SSE/WebSockets en una siguiente iteración; las reglas de stock ya están centralizadas.

## Mejoras del encargo adjunto

| ID | Mejora | Dónde se implementa | Comprobación |
|---|---|---|---|
| MEJ-01 | Roles admin/vendedor y usuarios activos | Middleware `AdminOnly`/`ApiSession`, UserController | Rutas administrativas protegidas; vendedor ve sus propias ventas |
| MEJ-02 | Lotes y vencimientos | Batch, StockRequest, InventoryService | No se venden lotes vencidos; FEFO entre lotes vigentes |
| MEJ-03 | Entradas y ajustes con motivo | `POST /api/stock`, Movement | Ajuste negativo rechazado si excede saldo; sin borrado histórico |
| MEJ-04 | Precio y detalle histórico | SaleItem en céntimos | Cambiar el producto no modifica ventas anteriores |
| MEJ-05 | Anulación autorizada una sola vez | `InventoryService::cancel` | Repone las asignaciones originales, registra motivo y responsable |
| MEJ-06 | Comprobante interno imprimible | React `SaleDetail`, estilos de impresión | Imprimir desde el detalle, texto de documento interno visible |
| MEJ-07 | Panel, períodos, más vendidos, CSV | ReportController + Recharts | Total excluye anuladas; CSV por fecha |
| MEJ-08 | Concurrencia y doble envío | `InventoryService::once`, bloqueos por fila | Suite funcional + `tests/concurrency.php` en PostgreSQL |
| MEJ-09 | Persistencia al reiniciar | PostgreSQL externo, seeder solo inicial | El arranque no restaura ni borra existencias |
| MEJ-10 | API documentada y extensible | `openapi.yaml`, API.md e INTEGRACIONES.md | Compañero puede consumir la API preservando reglas |
| MEJ-11 | Auditoría de acciones | Audit y `GET /api/audits` | Entradas, edición, login, ventas y anulaciones trazables |

Se implementa una API externa (Telegram Bot API) que avisa al cruzar el stock mínimo. No se implementan notificaciones por correo, facturación SUNAT, cálculo de rentabilidad, control de recetas ni gestión de proveedores. El panel de alertas sigue siendo la vista principal y se actualiza con cada operación.
