<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $totalProducts = Product::count();
        $claimedProducts = Product::whereNotNull('customer_id')->count();
        $firstChartDay = CarbonImmutable::today()->subDays(29);
        $firstSevenDay = CarbonImmutable::today()->subDays(6);
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

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'customers' => Customer::count(),
                'users' => User::count(),
                'totalProducts' => $totalProducts,
                'claimed' => $claimedProducts,
                'available' => Product::whereNull('customer_id')->where('status', 'unclaimed')->count(),
                'disabled' => Product::where('status', 'disabled')->count(),
                'scans7d' => ScanEvent::where('scanned_at', '>=', $firstSevenDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false)->count(),
                'scans30d' => ScanEvent::where('scanned_at', '>=', $firstChartDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false)->count(),
                'claimRate' => $totalProducts > 0 ? round(($claimedProducts / $totalProducts) * 100, 1) : 0,
            ],
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
        ]);
    }
}
