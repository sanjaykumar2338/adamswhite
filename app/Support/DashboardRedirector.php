<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardRedirector
{
    public static function redirect(Request $request, array $parameters = []): RedirectResponse
    {
        if ($request->user()->is_admin) {
            return redirect(route('admin.dashboard', $parameters, false));
        }

        $intendedUrl = $request->session()->get('url.intended');
        $intendedPath = $intendedUrl ? parse_url($intendedUrl, PHP_URL_PATH) : null;

        if ($intendedPath === '/admin' || str_starts_with((string) $intendedPath, '/admin/')) {
            $request->session()->forget('url.intended');
        }

        return redirect()->intended(route('dashboard', $parameters, false));
    }
}
