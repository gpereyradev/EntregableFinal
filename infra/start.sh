#!/bin/sh
set -eu
sed -i "s/Listen 80/Listen ${PORT:-10000}/" /etc/apache2/ports.conf
sed -i "s/VirtualHost \*:80/VirtualHost *:${PORT:-10000}/" /etc/apache2/sites-available/000-default.conf
# Free Render services do not offer pre-deploy commands. Boot fails if a migration fails.
php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction
php artisan config:cache
exec apache2-foreground
