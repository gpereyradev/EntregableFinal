# Backend Laravel de Nova Salud

Consulta el [README principal](../README.md). La API está en `routes/web.php` bajo `/api`, para compartir sesión y protección CSRF con la SPA.

- Controladores: `app/Http/Controllers/`
- Validaciones: `app/Http/Requests/`
- Reglas transaccionales: `app/Services/InventoryService.php`
- Migraciones y seeder: `database/`
- Pruebas: `tests/Feature/InventoryTest.php` y `tests/concurrency.php`

No añadir endpoints que modifiquen existencias al margen del servicio transaccional.
