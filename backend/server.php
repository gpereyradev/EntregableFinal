<?php
// Local preview router. Production uses Apache and public/.htaccess.
$path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
$file=__DIR__.'/public'.rawurldecode($path);
if($path!=='/'&&is_file($file))return false;
require __DIR__.'/public/index.php';
