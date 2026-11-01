<?php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\{Exceptions,Middleware};
use Illuminate\Http\Request;
return Application::configure(basePath:dirname(__DIR__))
 ->withRouting(web:__DIR__.'/../routes/web.php',health:'/up')
 ->withMiddleware(function(Middleware $m):void{$m->trustProxies(at:'*');$m->append(\App\Http\Middleware\SecurityHeaders::class);$m->alias(['session.api'=>\App\Http\Middleware\ApiSession::class,'admin'=>\App\Http\Middleware\AdminOnly::class]);})
 ->withExceptions(function(Exceptions $e):void{$e->shouldRenderJsonWhen(fn(Request $r,\Throwable $t)=>$r->is('api/*')||$r->expectsJson());})->create();
