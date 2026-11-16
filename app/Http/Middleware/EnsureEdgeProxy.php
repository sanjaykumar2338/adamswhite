<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEdgeProxy
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.shiftrix.edge_secret');
        if ($expected !== '' && ! hash_equals($expected, (string) $request->header('X-Shiftrix-Edge'))) {
            abort(403);
        }

        return $next($request);
    }
}
