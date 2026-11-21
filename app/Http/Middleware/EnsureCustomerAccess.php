<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_admin && $request->user()?->customers()->exists()) {
            abort_unless($request->user()?->currentCustomer()?->status === 'active', 403);
        }

        return $next($request);
    }
}
