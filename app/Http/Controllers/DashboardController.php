<?php

namespace App\Http\Controllers;

use App\Models\ScanEvent;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): RedirectResponse|Response
    {
        if ($request->user()->is_admin) {
            return redirect(route('admin.dashboard', absolute: false));
        }

        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);
        $validated = $request->validate(['location' => ['nullable', 'integer']]);
        $locationId = isset($validated['location']) && $customer->locations()->whereKey($validated['location'])->exists()
            ? (int) $validated['location']
            : null;
        $today = CarbonImmutable::today();
        $firstChartDay = $today->subDays(29);
        $firstSevenDay = $today->subDays(6);
        $previousSevenDay = $today->subDays(13);
        $products = $customer->products()->with(['batch', 'location'])
            ->when($locationId, fn ($query, int $location) => $query->where('location_id', $location))
            ->withCount(['scanEvents as scans_7d' => fn ($q) => $q->where('scanned_at', '>=', $firstSevenDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false), 'scanEvents as scans_30d' => fn ($q) => $q->where('scanned_at', '>=', $firstChartDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false)])
            ->latest('claimed_at')->get()->append('image_url');
        $eligibleScans = ScanEvent::query()
            ->where('customer_id', $customer->id)
            ->when($locationId, fn ($query, int $location) => $query->whereHas('product', fn ($product) => $product->where('location_id', $location)))
            ->genuine();
        $totalScans = (clone $eligibleScans)->count();
        $scansToday = (clone $eligibleScans)->whereBetween('scanned_at', [$today->startOfDay(), $today->endOfDay()])->count();
        $scansSevenDays = (clone $eligibleScans)->where('scanned_at', '>=', $firstSevenDay->startOfDay())->count();
        $previousSevenDays = (clone $eligibleScans)->whereBetween('scanned_at', [$previousSevenDay->startOfDay(), $firstSevenDay->subDay()->endOfDay()])->count();
        $sevenDayChange = $previousSevenDays > 0
            ? round((($scansSevenDays - $previousSevenDays) / $previousSevenDays) * 100, 1)
            : ($scansSevenDays > 0 ? 100.0 : 0.0);
        $dailyTotals = DB::table('scan_events')
            ->when($locationId, fn ($query, int $location) => $query->join('products', 'products.id', '=', 'scan_events.product_id')->where('products.location_id', $location))
            ->selectRaw('DATE(scan_events.scanned_at) day, COUNT(*) total')
            ->where('scan_events.customer_id', $customer->id)
            ->where('scan_events.scanned_at', '>=', $firstChartDay->startOfDay())
            ->where('scan_events.result', 'redirected')
            ->where('scan_events.is_probable_bot', false)
            ->groupByRaw('DATE(scan_events.scanned_at)')
            ->pluck('total', 'day');
        $series = collect(range(0, 29))->map(function (int $offset) use ($firstChartDay, $dailyTotals): array {
            $day = $firstChartDay->addDays($offset)->toDateString();

            return ['day' => $day, 'total' => (int) ($dailyTotals[$day] ?? 0)];
        });
        $milestoneThreshold = max(1, (int) config('services.shiftrix.scan_milestone_threshold', 10));
        $milestoneEnabled = (bool) config('services.shiftrix.scan_milestone_enabled', false);
        $genuineScanTotal = $milestoneEnabled
            ? ($locationId
                ? ScanEvent::query()->where('customer_id', $customer->id)->genuine()->count()
                : $totalScans)
            : 0;
        $scanMilestone = $milestoneEnabled
            && $genuineScanTotal >= $milestoneThreshold
            && $customer->genuine_scan_milestone_dismissed_at === null
                ? ['threshold' => $milestoneThreshold, 'count' => $genuineScanTotal]
                : null;

        return Inertia::render('Dashboard', [
            'customer' => $customer,
            'locations' => $customer->locations()->orderBy('name')->get(),
            'selectedLocation' => $locationId,
            'role' => $request->user()->roleFor($customer),
            'products' => $products,
            'series' => $series,
            'summary' => [
                'products' => $products->count(),
                'totalScans' => $totalScans,
                'scansToday' => $scansToday,
                'scans7d' => $scansSevenDays,
                'scans7dChange' => $sevenDayChange,
                'scans30d' => $products->sum('scans_30d'),
            ],
            'onboarding' => [
                'emailVerified' => $request->user()->hasVerifiedEmail(),
                'productActivated' => $products->isNotEmpty(),
                'reviewConfigured' => $products->contains(fn ($product): bool => filled($product->google_review_url)),
                'firstScanReceived' => $totalScans > 0,
            ],
            'scanMilestone' => $scanMilestone,
            'timezone' => config('app.timezone'),
        ]);
    }
}
