<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ScanEvent;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $days = (int) ($request->validate(['days' => ['nullable', 'integer', 'in:7,30,90']])['days'] ?? 30);
        $today = CarbonImmutable::today();
        $start = $today->subDays($days - 1)->startOfDay();
        $base = ScanEvent::query()->where('scan_events.scanned_at', '>=', $start)->where('scan_events.result', 'redirected')->where('scan_events.is_probable_bot', false);
        $daily = (clone $base)->selectRaw('DATE(scan_events.scanned_at) day, COUNT(*) total')->groupByRaw('DATE(scan_events.scanned_at)')->pluck('total', 'day');
        $growth = Customer::where('created_at', '>=', $start)->selectRaw('DATE(created_at) day, COUNT(*) total')->groupByRaw('DATE(created_at)')->pluck('total', 'day');
        $series = collect(range(0, $days - 1))->map(fn ($o) => ['day' => $start->addDays($o)->toDateString(), 'total' => (int) ($daily[$start->addDays($o)->toDateString()] ?? 0), 'customers' => (int) ($growth[$start->addDays($o)->toDateString()] ?? 0)]);

        return Inertia::render('Admin/Statistics', ['days' => $days, 'timezone' => (string) config('app.timezone', 'UTC'), 'total' => (int) $daily->sum(), 'series' => $series,
            'variants' => (clone $base)->join('products', 'products.id', '=', 'scan_events.product_id')->selectRaw("COALESCE(products.variant, 'unknown') variant, COUNT(*) total")->groupBy('variant')->get()->map(fn ($row): array => ['variant' => $row->variant, 'total' => (int) $row->total]),
            'devices' => (clone $base)->selectRaw("COALESCE(device_category, 'unknown') label, COUNT(*) total")->groupBy('label')->get()->map(fn ($row): array => ['label' => $row->label, 'total' => (int) $row->total]),
            'countries' => (clone $base)->selectRaw("COALESCE(country_code, 'unknown') label, COUNT(*) total")->groupBy('label')->orderByDesc('total')->orderByRaw("CASE WHEN COALESCE(country_code, 'unknown') = 'unknown' THEN 1 ELSE 0 END")->orderBy('label')->get()->map(fn ($row): array => ['label' => $row->label, 'total' => (int) $row->total]),
            'topCustomers' => (clone $base)->join('customers', 'customers.id', '=', 'scan_events.customer_id')->selectRaw('customers.id, customers.business_name name, COUNT(*) total')->groupBy('customers.id', 'customers.business_name')->orderByDesc('total')->limit(10)->get(),
            'topProducts' => (clone $base)->join('products', 'products.id', '=', 'scan_events.product_id')->selectRaw('products.id, products.code_id code, COUNT(*) total')->groupBy('products.id', 'products.code_id')->orderByDesc('total')->limit(10)->get(),
        ]);
    }
}
