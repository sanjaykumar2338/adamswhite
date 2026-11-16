<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::withCount(['users', 'products'])->when($request->search, fn ($q, $s) => $q->where('business_name', 'like', "%{$s}%"))->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/Customers', ['customers' => $customers, 'filters' => $request->only('search')]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', 'in:active,blocked'], 'max_products' => ['required', 'integer', 'min:1', 'max:10000']]);
        $data['blocked_at'] = $data['status'] === 'blocked' ? now() : null;
        $data['blocked_by'] = $data['status'] === 'blocked' ? $request->user()->id : null;
        $customer->update($data);

        return back()->with('success', 'Customer updated.');
    }
}
