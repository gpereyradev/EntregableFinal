# Despliegue reproducible

## Recursos

Un servicio web **gratuito** de Render, en Virginia, desde `gpereyradev/EntregableFinal`, rama `main`, runtime Docker, contexto `.`, Dockerfile raíz. PostgreSQL en el proyecto exclusivo `nova-salud-entregable` de Neon, región AWS us-east-1. No se comparte la base de Nexus-AI ni se modifican otros proyectos.

La base conserva datos independientemente del reinicio del servicio web. La rama `test-integridad` es exclusiva para pruebas y no es la base publicada. Se creó una base separada para esta entrega usando las conexiones autorizadas.

## Variables del servicio

| Variable | Valor / procedencia |
|---|---|
| APP_NAME | Nova Salud |
| APP_ENV | production |
| APP_DEBUG | false |
| APP_KEY | clave aleatoria de 32 bytes codificada con prefijo base64: |
| APP_URL | URL HTTPS del servicio |
| APP_DEMO | true para la presentación académica |
| DB_CONNECTION | pgsql |
| DB_URL | conexión PostgreSQL secreta; usar TLS `sslmode=require` |
| DB_SSLMODE | require |
| SESSION_DRIVER | database |
| SESSION_SECURE_COOKIE | true |
| SESSION_SAME_SITE | lax |
| CACHE_STORE | database |
| LOG_CHANNEL | stderr |
| DEMO_ADMIN_PASSWORD | contraseña aleatoria, fuera del repositorio |
| DEMO_SELLER_PASSWORD | otra contraseña aleatoria |

Se utiliza una conexión directa para las migraciones. Para esta demostración de baja concurrencia también es adecuada para Apache; si se aumenta la escala, usar el host agrupado para la aplicación y una conexión directa separada en el paso de migración.

## Construcción y arranque

1. Render compila React con `npm ci` y `npm run build`.
2. Instala Laravel desde `composer.lock`, sin dependencias de desarrollo.
3. Copia los recursos a `public/app/`.
4. Al arrancar, aplica migraciones pendientes. Una migración fallida detiene el arranque.
5. Ejecuta el seeder; no modifica datos si ya hay usuarios. En PostgreSQL, un bloqueo asesor protege la primera carga simultánea.
6. Cachea configuración y ejecuta Apache como proceso principal, escuchando `0.0.0.0:$PORT`.

El frontend usa `/app/assets/` y API relativa `/api`; no hay secretos en variables `VITE_*`. La configuración de cookies seguras requiere acceder mediante HTTPS. `/up` es el endpoint de salud de Laravel. La raíz comprueba que puede servir la aplicación y `/api/session` comprueba la disponibilidad de sesión.

## Actualizaciones del repositorio

El servicio se creó desde una URL pública de GitHub. En esta modalidad, Render puede mostrar `autoDeploy=yes` y aun así no recibir webhooks del proveedor. Durante esta entrega se verificó que los nuevos commits no creaban un despliegue automático y se lanzó manualmente la versión final. Para próximas actualizaciones, comprobar que exista un deploy para el commit y, si no existe, iniciarlo desde Render; alternativamente enlazar el proveedor Git en su panel. No crear otro servicio para actualizar este.

## Publicación y verificación

Comprueba que el despliegue esté `live`; recibir un ID no significa que terminó. Abre la raíz, inicia sesión, registra una entrada y una venta; verifica el saldo y consulta el detalle. Prueba un vendedor e intenta una acción administrativa. Revisa los logs sin publicar secretos.

Los servicios gratuitos de Render pueden suspenderse tras inactividad y tardar en despertar. La cuenta puede limitar la cantidad de servicios, horas de uso o proyectos. Las cuotas y condiciones de alojamiento pueden cambiar; revisar el panel del proveedor antes de una exposición. Este proyecto no contrata planes de pago. Los datos no dependen del filesystem efímero del servicio web.

Las fechas de los lotes demo se fijan respecto de la primera carga. Con el paso de las semanas pueden quedar vencidos; registrar entradas nuevas desde la aplicación, sin borrar historiales.

## Operación responsable

No ejecutar `migrate:fresh`, borrar tablas ni reiniciar el seeder sobre datos existentes. Para respaldo, usar `pg_dump` desde una conexión directa y guardar el archivo de forma privada; restaurar primero en una base de prueba. Un rollback de código no deshace ventas ni migraciones. Probar cambios de esquema en una rama aislada antes de publicar. Separar roles de base con permisos mínimos es una mejora recomendada para producción fuera de esta demostración.
