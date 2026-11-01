<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiSession
{
    public function handle(Request $r, Closure $next)
    {
        if (! $r->user() || ! $r->user()->active) {
            auth()->logout();

            return response()->json(['message' => 'Inicia sesión para continuar.'], 401);
        }

        return $next($r);
    }
}
