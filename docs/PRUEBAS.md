# Verificación ejecutada

Fecha: 1 de noviembre de 2026. Todos los datos usados son ficticios.

## Automatización

| Comprobación | Entorno | Resultado |
|---|---|---|
| Suite funcional Laravel | PHP 8.3, SQLite en memoria | 20 pruebas, 84 aserciones; correctas |
| Misma suite sobre PostgreSQL | GitHub Actions, PostgreSQL 17 | 20 pruebas, 84 aserciones; correctas |
| Dos vendedores compiten por la última unidad | Dos procesos y conexiones PostgreSQL independientes | Una venta y un rechazo; saldo cero |
| Dos envíos simultáneos con la misma clave | Dos procesos con el mismo usuario y UUID | Misma venta, un único descuento |
| Reintento / carrito cambiado / nueva venta idéntica | Node, lógica de claves del frontend | 3 pruebas de regresión correctas |
| TypeScript y construcción de producción | Vite | Compilación correcta |

Evidencia PostgreSQL y construcción: [ejecución de GitHub Actions](https://github.com/gpereyradev/EntregableFinal/actions/runs/41351279766). La verificación más reciente del repositorio incluye también las tres pruebas del frontend.

La suite funcional comprueba sesión, usuario inactivo, permisos, productos únicos, validación monetaria, entradas, ajustes, stock insuficiente, FEFO, vencidos, vigencia el mismo día, producto inactivo, reintentos, anulación única, ventas propias, alertas, reportes sin anuladas, CSV, claves obligatorias y rollback cuando falla una segunda línea.

## Verificación pública de la API

Se ejecutó un cliente HTTP contra el servicio HTTPS publicado:

- Invitado sobre catálogo: 401. Login sin CSRF: 419.
- Inicio de sesión de administrador y vendedor: correcto.
- Entrada de 10 unidades y reintento del mismo UUID: solo suma 10.
- Venta de dos unidades a S/12.50: total S/25.00 y un solo descuento al repetir.
- Vendedor intenta registrar stock o leer reportes: 403.
- Anulación, repetición del UUID y otro UUID sobre la misma venta: stock repuesto una sola vez; último intento 409.
- Reporte JSON y CSV: respuestas correctas.
- Dos solicitudes simultáneas por una unidad ficticia: 201 y 422; stock final cero.
- Dos solicitudes simultáneas con mismo usuario y UUID: mismo ID de venta, un descuento.

Se mantuvo el producto `QA-1101` como ejemplo visible y sus movimientos como evidencia. El producto de carrera se desactivó al terminar; sus ventas de prueba quedaron anuladas. No se borró el historial.

## Navegador

Se comprobó la interfaz pública en Edge: ingreso, dashboard, alta de producto, entrada de lote y punto de venta con confirmación. Se revisaron consola sin errores de la aplicación, detalle de venta, anulación con reposición, alertas, reportes y navegación móvil a 390 × 844 px. Se corrigieron el estado de la venta recién creada, la clave de una segunda venta idéntica y el acceso al perfil en pantallas de poca altura. No se realizaron pruebas de campo con clientes reales.

## Reproducir pruebas

Desde `backend/`, con extensiones de PHP instaladas:

```bash
php vendor/bin/phpunit --no-progress
```

Desde `frontend/` con Node 22.18+:

```bash
npm ci
npm test
npm run build
```

Para PostgreSQL, usar exclusivamente una base de prueba descartable y variables de entorno que prevalezcan sobre `.env`:

```bash
export APP_ENV=testing
export APP_DEMO=false
export DB_CONNECTION=pgsql
export DB_URL='postgresql://USUARIO:CLAVE@HOST/nova_test'
export SESSION_DRIVER=array
export CACHE_STORE=array
php artisan migrate --force
php vendor/bin/phpunit --no-progress
php tests/concurrency.php
```

La suite RefreshDatabase crea/reinicia el esquema de la base seleccionada y usa transacciones por prueba: **nunca apuntarla al servicio publicado**. La prueba de concurrencia necesita `pcntl` y crea datos aislados por sufijo aleatorio; no debe ejecutarse en producción.

## Límites y alcance

- La consulta de cambios entre vistas es cada 30 s, no push instantáneo.
- Las pruebas no sustituyen auditoría de seguridad, prueba de carga sostenida ni evaluación de usabilidad con personal real.
- El comprobante HTML incluye estilos de impresión; la salida física depende del navegador y de la impresora.
- No se ensayaron APIs externas porque pertenecen a la etapa del compañero.
- El intento de conexión directa a Neon desde el entorno local fue bloqueado por su red; las pruebas PostgreSQL se ejecutaron en GitHub Actions y sobre la aplicación pública, sin alterar la base de otro proyecto.
