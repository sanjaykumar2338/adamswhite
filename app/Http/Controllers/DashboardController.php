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
        $today = CarbonImmutable::today();
        $firstChartDay = $today->subDays(29);
        $firstSevenDay = $today->subDays(6);
        $previousSevenDay = $today->subDays(13);
        $products = $customer->products()->with('batch')
            ->withCount(['scanEvents as scans_7d' => fn ($q) => $q->where('scanned_at', '>=', $firstSevenDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false), 'scanEvents as scans_30d' => fn ($q) => $q->where('scanned_at', '>=', $firstChartDay->startOfDay())->where('result', 'redirected')->where('is_probable_bot', false)])
            ->latest('claimed_at')->get()->append('image_url');
        $eligibleScans = ScanEvent::query()
            ->where('customer_id', $customer->id)
            ->where('result', 'redirected')
            ->where('is_probable_bot', false);
        $totalScans = (clone $eligibleScans)->count();
        $scansToday = (clone $eligibleScans)->whereBetween('scanned_at', [$today->startOfDay(), $today->endOfDay()])->count();
        $scansSevenDays = (clone $eligibleScans)->where('scanned_at', '>=', $firstSevenDay->startOfDay())->count();
        $previousSevenDays = (clone $eligibleScans)->whereBetween('scanned_at', [$previousSevenDay->startOfDay(), $firstSevenDay->subDay()->endOfDay()])->count();
        $sevenDayChange = $previousSevenDays > 0
            ? round((($scansSevenDays - $previousSevenDays) / $previousSevenDays) * 100, 1)
            : ($scansSevenDays > 0 ? 100.0 : 0.0);
        $dailyTotals = DB::table('scan_events')
            ->selectRaw('DATE(scanned_at) day, COUNT(*) total')
            ->where('customer_id', $customer->id)
            ->where('scanned_at', '>=', $firstChartDay->startOfDay())
            ->where('result', 'redirected')
            ->where('is_probable_bot', false)
            ->groupByRaw('DATE(scanned_at)')
            ->pluck('total', 'day');
        $series = collect(range(0, 29))->map(function (int $offset) use ($firstChartDay, $dailyTotals): array {
            $day = $firstChartDay->addDays($offset)->toDateString();

            return ['day' => $day, 'total' => (int) ($dailyTotals[$day] ?? 0)];
        });

        return Inertia::render('Dashboard', [
            'customer' => $customer,
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
            'timezone' => config('app.timezone'),
        ]);
    }
}
