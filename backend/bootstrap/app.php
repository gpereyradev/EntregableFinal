<?php

use App\Http\Middleware\AdminOnly;
use App\Http\Middleware\ApiSession;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', health: '/up')
    ->withMiddleware(function (Middleware $m): void {
        $m->trustProxies(at: '*');
        $m->append(SecurityHeaders::class);
        $m->alias(['session.api' => ApiSession::class, 'admin' => AdminOnly::class]);
    })
    ->withExceptions(function (Exceptions $e): void {
        $e->shouldRenderJsonWhen(fn (Request $r, Throwable $t) => $r->is('api/*') || $r->expectsJson());
    })->create();
