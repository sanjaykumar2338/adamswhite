<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function update(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->customers()->whereKey($customer->id)->wherePivot('status', 'active')->exists(), 403);
        $request->session()->put('current_customer_id', $customer->id);

        return to_route('dashboard');
    }
}
