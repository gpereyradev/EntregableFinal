# Nova Salud · Inventario y ventas

Aplicación fullstack del trabajo final **PIAD-527 — SENATI**. Centraliza productos, lotes, movimientos y ventas de una botica con una interfaz adaptable, acceso por roles y una API interna extensible.

## Qué incluye

- Sesiones de administrador y vendedor, contraseñas con hash, CSRF y autorización en servidor.
- Productos, categorías, precios en céntimos, búsqueda, filtros, paginación y desactivación.
- Entradas y ajustes por lote con motivo e historial; existencias derivadas de los lotes.
- Punto de venta, descuento FEFO de lotes vigentes, comprobante interno imprimible y anulación trazable.
- Transacciones PostgreSQL, bloqueo de productos y claves de idempotencia para ventas y movimientos.
- Alertas de reposición y vencimiento; reportes por fecha y exportación CSV.
- Datos ficticios de demostración, sin APIs externas ni datos personales reales.
- Interfaz editorial adaptable, con temas claro, oscuro y automático; preferencia persistente en el navegador.

## Arquitectura

**Aplicación:** https://nova-salud-gpereyradev.onrender.com/

`frontend/`: React 19 + TypeScript + Vite + Tailwind 4, Lucide y Recharts.  
`backend/`: Laravel 12 / PHP 8.3+, PostgreSQL 17, API REST y sesiones en base de datos.  
`infra/`: construcción y ejecución en Render. Apache sirve la SPA y la API en el mismo origen HTTPS.

Los lenguajes tienen funciones concretas: TypeScript para interfaz y solicitudes, PHP para reglas y autorización, SQL para persistencia y restricciones, HTML/CSS para estructura y presentación.

## Instalación local

Requisitos: Node 22+, PHP 8.3+, Composer 2, PostgreSQL 16/17; extensiones PHP PDO, pdo_pgsql, mbstring, DOM, XML, curl, zip y tokenizer. Para las pruebas rápidas también pdo_sqlite.

```bash
cd frontend
npm ci
npm run build
cd ../backend
composer install
cp .env.example .env
php artisan key:generate
```

Configura `DB_URL` con tu base PostgreSQL y elige dos contraseñas diferentes de al menos 12 caracteres para `DEMO_ADMIN_PASSWORD` y `DEMO_SELLER_PASSWORD`. Con `APP_DEMO=true`, la primera carga crea las cuentas `admin@novasalud.demo` y `vendedor@novasalud.demo`. No hay registro público. Las contraseñas del despliegue se entregan fuera del repositorio.

```bash
php artisan migrate
php artisan db:seed
```

Copia el contenido de `frontend/dist/` a `backend/public/app/` y ejecuta desde la raíz:

```bash
npm run dev
```

Abre `http://localhost:8000`. Para desarrollo con recarga: `php artisan serve` desde `backend/` y `npm run dev` desde `frontend/`; Vite usa `/app/` y reenvía `/api` a Laravel en el puerto 8000. No se requieren servicios externos para la lógica de negocio.

## Pruebas

Desde `backend/`:

```bash
php vendor/bin/phpunit --no-progress
```

La suite usa SQLite en memoria, clave de cifrado de prueba y datos aislados. No apunta al entorno publicado. Las pruebas de bloqueo reales requieren PostgreSQL: ver [PRUEBAS.md](docs/PRUEBAS.md). Nunca ejecutes `migrate:fresh` contra una base con datos que quieras conservar.

## Despliegue

[Guía de despliegue](docs/DESPLIEGUE.md). El Dockerfile compila React, instala PHP y sirve ambos componentes desde Apache. El usuario final solo necesita un navegador; no instala Docker. PostgreSQL permanece fuera del disco efímero del servidor web. Las migraciones corren al arrancar; el seeder inicial es idempotente y no reinicia datos al redesplegar.

## Documentación

| Documento | Propósito |
|---|---|
| [Matriz de requisitos](docs/REQUISITOS.md) | Distinguir PDF y mejoras, con rutas de código y evidencia |
| [Arquitectura y diagramas](docs/ARQUITECTURA.md) | Entidades, transacciones, concurrencia y seguridad |
| [Contrato OpenAPI](docs/openapi.yaml) | API, autenticación, permisos y cuerpos de datos |
| [Ejemplos API](docs/API.md) | Solicitudes y respuestas para continuar el trabajo |
| [Manual de usuario](docs/MANUAL.md) | Uso de cada módulo |
| [Integraciones](INTEGRACIONES.md) | Puntos de extensión para el compañero |
| [Preguntas guía y competencias](docs/ACADEMICO.md) | Sustento del caso, métricas y competencias |
| [Guion de exposición](docs/EXPOSICION.md) | Recorrido sugerido para la demostración |
| [Verificación](docs/PRUEBAS.md) | Pruebas ejecutadas y límites reales |

## Alcance y reglas

El PDF llama **Nova Salud** a la botica del caso y **FarmaPlus** en sus preguntas guía. Se trata la diferencia como una inconsistencia editorial y se usa Nova Salud en todo el producto.

Las vistas consultan cambios cada **30 segundos** cuando están visibles, al volver a la ventana y tras una operación local. No se afirma sincronización instantánea: una venta siempre vuelve a comprobar el stock en el servidor al confirmarse. No hay WebSockets.

Una fecha de vencimiento igual al día actual se considera vigente hasta finalizar ese día en `America/Lima`. El stock total incluye unidades vencidas; el disponible las excluye. Las alertas usan disponible ≤ mínimo, incluyendo agotados. Próximos a vencer: hoy a hoy + 30 días, ambos incluidos.

Los reportes muestran importes de ventas confirmadas, sin ganancias ni porcentajes de mejora inventados. Los documentos impresos son **comprobantes internos**, sin autorización electrónica SUNAT. Las cuentas y productos iniciales son ficticios.

Las APIs externas quedan para la siguiente etapa del grupo. No hay consultas DNI/RUC, pagos electrónicos, IA, recetas ni facturación tributaria implementadas.
