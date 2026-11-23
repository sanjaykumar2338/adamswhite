<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ConfigurationController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $query = $request->query();
        if (isset($query['id']) && is_string($query['id'])) {
            $query['id'] = strtoupper(trim($query['id']));
        }

        return redirect()->route('home', $query, 301);
    }
}
