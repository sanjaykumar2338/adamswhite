<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:120']]);
        $search = trim($filters['search'] ?? '');
        $customers = Customer::withCount(['users', 'products'])
            ->when($search !== '', fn ($query) => $query->where('business_name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Customers', [
            'customers' => $customers,
            'filters' => ['search' => $search],
            'summary' => [
                'total' => Customer::count(),
                'active' => Customer::where('status', 'active')->count(),
                'blocked' => Customer::where('status', 'blocked')->count(),
                'products' => Product::whereNotNull('customer_id')->count(),
            ],
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', 'in:active,blocked'], 'max_products' => ['required', 'integer', 'min:1', 'max:10000']]);
        $data['blocked_at'] = $data['status'] === 'blocked' ? now() : null;
        $data['blocked_by'] = $data['status'] === 'blocked' ? $request->user()->id : null;
        $customer->update($data);

        return back()->with('success', __('ui.flash.customer_updated'));
    }
}
