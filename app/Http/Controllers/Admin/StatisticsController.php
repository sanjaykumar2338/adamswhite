<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
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
        $events = ScanEvent::where('scanned_at', '>=', $start)->where('result', 'redirected')->where('is_probable_bot', false)->get(['product_id', 'customer_id', 'device_category', 'country_code', 'scanned_at']);
        $daily = $events->groupBy(fn ($e) => $e->scanned_at->toDateString())->map->count();
        $growth = Customer::where('created_at', '>=', $start)->get()->groupBy(fn ($c) => $c->created_at->toDateString())->map->count();
        $series = collect(range(0, $days - 1))->map(fn ($o) => ['day' => $start->addDays($o)->toDateString(), 'total' => (int) ($daily[$start->addDays($o)->toDateString()] ?? 0), 'customers' => (int) ($growth[$start->addDays($o)->toDateString()] ?? 0)]);
        $products = Product::whereIn('id', $events->pluck('product_id')->filter()->unique())->get(['id', 'code_id', 'variant'])->keyBy('id');
        $customers = Customer::whereIn('id', $events->pluck('customer_id')->filter()->unique())->get(['id', 'business_name'])->keyBy('id');

        return Inertia::render('Admin/Statistics', ['days' => $days, 'total' => $events->count(), 'series' => $series,
            'variants' => $events->groupBy(fn ($event) => $products->get($event->product_id)?->variant ?? 'unknown')->map(fn ($items, $variant) => ['variant' => $variant, 'total' => $items->count()])->values(),
            'devices' => $events->groupBy(fn ($e) => $e->device_category ?: 'unknown')->map(fn ($v, $k) => ['label' => $k, 'total' => $v->count()])->values(),
            'countries' => $events->groupBy(fn ($e) => $e->country_code ?: 'unknown')->map(fn ($v, $k) => ['label' => $k, 'total' => $v->count()])->sortByDesc('total')->values(),
            'topCustomers' => $events->groupBy('customer_id')->map(fn ($v, $id) => ['id' => $id, 'name' => $customers->get((int) $id)?->business_name ?? __('ui.analytics.unknown'), 'total' => $v->count()])->sortByDesc('total')->take(10)->values(),
            'topProducts' => $events->groupBy('product_id')->map(fn ($v, $id) => ['id' => $id, 'code' => $products->get((int) $id)?->code_id ?? __('ui.analytics.unknown'), 'total' => $v->count()])->sortByDesc('total')->take(10)->values(),
        ]);
    }
}
