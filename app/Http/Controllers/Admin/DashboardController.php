<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use App\Support\AdminOverviewCache;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $firstChartDay = CarbonImmutable::today()->subDays(29);
        $firstSevenDay = CarbonImmutable::today()->subDays(6);
        $today = CarbonImmutable::today()->startOfDay();
        $dailyTotals = DB::table('scan_events')
            ->selectRaw('DATE(scanned_at) day, COUNT(*) total')
            ->where('scanned_at', '>=', $firstChartDay->startOfDay())
            ->where('result', 'redirected')
            ->where('is_probable_bot', false)
            ->groupByRaw('DATE(scanned_at)')
            ->pluck('total', 'day');
        $scanSeries = collect(range(0, 29))->map(function (int $offset) use ($firstChartDay, $dailyTotals): array {
            $day = $firstChartDay->addDays($offset)->toDateString();

            return ['day' => $day, 'total' => (int) ($dailyTotals[$day] ?? 0)];
        });

        $batchScans = ScanEvent::query()
            ->join('products', 'scan_events.product_id', '=', 'products.id')
            ->where('scan_events.scanned_at', '>=', $firstChartDay->startOfDay())
            ->where('scan_events.result', 'redirected')
            ->where('scan_events.is_probable_bot', false)
            ->selectRaw('products.batch_id, COUNT(*) total')
            ->groupBy('products.batch_id')
            ->pluck('total', 'products.batch_id');
        $batchActivity = Batch::query()
            ->withCount([
                'products',
                'products as claimed_count' => fn ($query) => $query->whereNotNull('customer_id'),
                'products as available_count' => fn ($query) => $query->whereNull('customer_id')->where('status', 'unclaimed'),
            ])
            ->orderBy('lot_number')
            ->get(['id', 'code', 'lot_number'])
            ->map(fn (Batch $batch): array => [
                'id' => $batch->id,
                'code' => $batch->code,
                'lot_number' => $batch->lot_number,
                'products_count' => $batch->products_count,
                'claimed_count' => $batch->claimed_count,
                'available_count' => $batch->available_count,
                'scans_30d' => (int) ($batchScans[$batch->id] ?? 0),
            ])
            ->sortByDesc(fn (array $batch): array => [$batch['scans_30d'], $batch['claimed_count'], $batch['lot_number']])
            ->take(8)
            ->values();

        if (app()->runningUnitTests()) {
            AdminOverviewCache::forget();
        }
        $metrics = Cache::remember(AdminOverviewCache::KEY, now()->addSeconds(45), function () use ($today, $firstSevenDay, $firstChartDay): array {
            $products = Product::query()->selectRaw("COUNT(*) total, SUM(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END) claimed, SUM(CASE WHEN customer_id IS NULL AND status = 'unclaimed' THEN 1 ELSE 0 END) available, SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) disabled, SUM(CASE WHEN customer_id IS NOT NULL AND (google_review_url IS NULL OR google_review_url = '') THEN 1 ELSE 0 END) missing_review")->first();
            $customers = Customer::query()->selectRaw("COUNT(*) total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) active, SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) blocked")->first();
            $scans = ScanEvent::query()->where('result', 'redirected')->where('is_probable_bot', false)->selectRaw('SUM(CASE WHEN scanned_at >= ? THEN 1 ELSE 0 END) today, SUM(CASE WHEN scanned_at >= ? THEN 1 ELSE 0 END) seven, SUM(CASE WHEN scanned_at >= ? THEN 1 ELSE 0 END) thirty', [$today, $firstSevenDay->startOfDay(), $firstChartDay->startOfDay()])->first();
            $totalProducts = (int) $products->total;
            $claimedProducts = (int) $products->claimed;

            return [
                'customers' => (int) $customers->total,
                'activeCustomers' => (int) $customers->active,
                'disabledCustomers' => (int) $customers->blocked,
                'multiProductCustomers' => Customer::has('products', '>', 1)->count(),
                'activeManagers' => DB::table('customer_memberships')->where('role', 'manager')->where('status', 'active')->count(),
                'users' => User::count(),
                'totalProducts' => $totalProducts,
                'claimed' => $claimedProducts,
                'available' => (int) $products->available,
                'disabled' => (int) $products->disabled,
                'missingReview' => (int) $products->missing_review,
                'scansToday' => (int) $scans->today,
                'scans7d' => (int) $scans->seven,
                'scans30d' => (int) $scans->thirty,
                'claimRate' => $totalProducts > 0 ? round(($claimedProducts / $totalProducts) * 100, 1) : 0,
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'metrics' => $metrics,
            'scanSeries' => $scanSeries,
            'variantDistribution' => Product::query()
                ->select('variant')
                ->selectRaw('COUNT(*) total')
                ->groupBy('variant')
                ->orderBy('variant')
                ->get()
                ->map(fn (Product $product): array => ['variant' => $product->variant, 'total' => (int) $product->total]),
            'batchActivity' => $batchActivity,
            'recentCustomers' => Customer::query()
                ->withCount(['users', 'products'])
                ->latest()
                ->limit(6)
                ->get(['id', 'business_name', 'status', 'max_products', 'created_at']),
            'deviceDistribution' => ScanEvent::where('scanned_at', '>=', $firstChartDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false)->selectRaw("COALESCE(device_category, 'unknown') label, COUNT(*) total")->groupBy('label')->get(),
            'countryDistribution' => ScanEvent::where('scanned_at', '>=', $firstChartDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false)->selectRaw("COALESCE(country_code, 'unknown') label, COUNT(*) total")->groupBy('label')->orderByDesc('total')->limit(8)->get(),
            'topProducts' => ScanEvent::query()->join('products', 'products.id', '=', 'scan_events.product_id')->where('scan_events.scanned_at', '>=', $firstChartDay->startOfDay())->where('scan_events.result', 'redirected')->where('scan_events.is_probable_bot', false)->selectRaw('products.id, products.code_id, COUNT(*) total')->groupBy('products.id', 'products.code_id')->orderByDesc('total')->limit(5)->get(),
            'topCustomers' => ScanEvent::query()->join('customers', 'customers.id', '=', 'scan_events.customer_id')->where('scan_events.scanned_at', '>=', $firstChartDay->startOfDay())->where('scan_events.result', 'redirected')->where('scan_events.is_probable_bot', false)->selectRaw('customers.id, customers.business_name, COUNT(*) total')->groupBy('customers.id', 'customers.business_name')->orderByDesc('total')->limit(5)->get(),
            'recentActions' => AuditLog::with('actor:id,name')->latest()->limit(6)->get(),
        ]);
    }
}
