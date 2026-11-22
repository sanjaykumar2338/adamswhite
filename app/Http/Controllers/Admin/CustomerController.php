<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Services\AdminAudit;
use App\Support\AdminOverviewCache;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
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
        $data = $request->validate(['status' => ['required', 'in:active,blocked'], 'max_products' => ['required', 'integer', 'min:1', 'max:10000'], 'admin_notes' => ['sometimes', 'nullable', 'string', 'max:10000']]);
        $before = $customer->only(['status', 'max_products']);
        $data['blocked_at'] = $data['status'] === 'blocked' ? now() : null;
        $data['blocked_by'] = $data['status'] === 'blocked' ? $request->user()->id : null;
        $customer->update($data);
        app(AdminAudit::class)->record($request, 'customer.updated', $customer, ['before' => $before, 'changed' => array_keys($customer->getChanges())]);
        if ($before['status'] !== $data['status']) {
            app(AdminAudit::class)->record($request, 'customer.status_changed', $customer, ['from' => $before['status'], 'to' => $data['status']]);
        }
        if ((int) $before['max_products'] !== (int) $data['max_products']) {
            app(AdminAudit::class)->record($request, 'customer.limit_changed', $customer, ['from' => (int) $before['max_products'], 'to' => (int) $data['max_products']]);
        }
        AdminOverviewCache::forget();

        return back()->with('success', __('ui.flash.customer_updated'));
    }

    public function show(Customer $customer): Response
    {
        $start = CarbonImmutable::today()->subDays(29)->startOfDay();
        $eligible = ScanEvent::query()->where('customer_id', $customer->id)->where('result', 'redirected')->where('is_probable_bot', false);
        $daily = (clone $eligible)->where('scanned_at', '>=', $start)->selectRaw('DATE(scanned_at) day, COUNT(*) total')->groupByRaw('DATE(scanned_at)')->pluck('total', 'day');

        return Inertia::render('Admin/CustomerDetail', [
            'customer' => $customer,
            'metrics' => ['products' => $customer->products()->count(), 'total' => (clone $eligible)->count(), 'today' => (clone $eligible)->whereDate('scanned_at', today())->count(), 'days7' => (clone $eligible)->where('scanned_at', '>=', today()->subDays(6))->count(), 'days30' => (clone $eligible)->where('scanned_at', '>=', $start)->count()],
            'series' => collect(range(0, 29))->map(fn ($offset): array => ['day' => $start->addDays($offset)->toDateString(), 'total' => (int) ($daily[$start->addDays($offset)->toDateString()] ?? 0)]),
            'products' => $customer->products()->orderBy('code_id')->get()->append('nfc_url'),
            'members' => $customer->users()->orderBy('name')->get(),
        ]);
    }

    public function sendPasswordReset(Request $request, Customer $customer): RedirectResponse
    {
        $owner = $customer->users()->wherePivot('role', 'owner')->wherePivot('status', 'active')->firstOrFail();
        Password::sendResetLink(['email' => $owner->email]);
        app(AdminAudit::class)->record($request, 'customer.password_reset_requested', $customer, ['user_id' => $owner->id]);

        return back()->with('success', __('ui.flash.password_reset_sent'));
    }
}
