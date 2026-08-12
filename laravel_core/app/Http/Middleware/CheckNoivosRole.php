<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckNoivosRole
{
    public function handle(Request $request, Closure $next): Response
    {
        // Se o usuário não estiver logado ou não tiver a flag 'noivos', bloqueia o acesso
        if (!$request->user() || !$request->user()->isNoivo()) {
            return response()->json([
                'status' => 'erro',
                'mensagem' => 'Acesso restrito apenas aos noivos.'
            ], 403);
        }

        return $next($request);
    }
}
