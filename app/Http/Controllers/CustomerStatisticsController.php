<?php

namespace App\Http\Controllers;

use App\Models\ScanEvent;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerStatisticsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);

        $validated = $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90']]);
        $days = (int) ($validated['days'] ?? 30);
        $timezone = (string) config('app.timezone', 'UTC');
        $today = CarbonImmutable::today($timezone);
        $start = $today->subDays($days - 1)->startOfDay()->utc();

        $base = ScanEvent::query()
            ->where('scan_events.customer_id', $customer->id)
            ->where('scan_events.result', 'redirected')
            ->where('scan_events.is_probable_bot', false)
            ->where('scan_events.scanned_at', '>=', $start);

        $daily = [];
        $weekday = array_fill(0, 7, 0);
        $hourly = array_fill(0, 24, 0);
        $total = 0;
        foreach ((clone $base)->orderBy('scan_events.scanned_at')->cursor(['scan_events.scanned_at']) as $event) {
            $local = $event->scanned_at->timezone($timezone);
            $day = $local->toDateString();
            $daily[$day] = ($daily[$day] ?? 0) + 1;
            $weekday[$local->dayOfWeek]++;
            $hourly[$local->hour]++;
            $total++;
        }

        $series = collect(range(0, $days - 1))->map(function (int $offset) use ($today, $days, $daily): array {
            $day = $today->subDays($days - 1)->addDays($offset)->toDateString();

            return ['day' => $day, 'total' => (int) ($daily[$day] ?? 0)];
        })->values();

        $deviceTotals = (clone $base)->selectRaw("COALESCE(device_category, 'unknown') category, COUNT(*) total")->groupBy('category')->pluck('total', 'category');
        $countries = (clone $base)->selectRaw("COALESCE(country_code, 'unknown') country, COUNT(*) total")->groupBy('country')->orderByDesc('total')->orderByRaw("CASE WHEN COALESCE(country_code, 'unknown') = 'unknown' THEN 1 ELSE 0 END")->orderBy('country')->get()->map(fn ($row): array => ['country' => $row->country, 'total' => (int) $row->total]);
        $rankingBase = (clone $base)->join('products', 'products.id', '=', 'scan_events.product_id')->where('products.customer_id', $customer->id);
        $topProducts = (clone $rankingBase)->selectRaw('products.id, products.code_id, products.display_name, products.variant, COUNT(*) total')->groupBy('products.id', 'products.code_id', 'products.display_name', 'products.variant')->orderByDesc('total')->orderBy('products.code_id')->limit(10)->get();
        $topStaff = (clone $rankingBase)->whereNotNull('products.display_name')->where('products.display_name', '<>', '')->selectRaw('products.id, products.code_id, products.display_name, COUNT(*) total')->groupBy('products.id', 'products.code_id', 'products.display_name')->orderByDesc('total')->orderBy('products.display_name')->limit(10)->get();

        $mostActiveDay = $series->sortByDesc('total')->first();
        $mostActiveHour = collect($hourly)->sortDesc()->keys()->first();

        return Inertia::render('Statistics/Index', [
            'days' => $days,
            'timezone' => $timezone,
            'total' => $total,
            'series' => $series,
            'weekday' => collect($weekday)->map(fn (int $total, int $day): array => ['day' => $day, 'total' => $total])->values(),
            'hourly' => collect($hourly)->map(fn (int $total, int $hour): array => ['hour' => $hour, 'total' => $total])->values(),
            'devices' => [
                ['category' => 'iphone', 'total' => (int) ($deviceTotals['iphone'] ?? 0)],
                ['category' => 'android', 'total' => (int) ($deviceTotals['android'] ?? 0)],
                ['category' => 'other', 'total' => (int) ($deviceTotals['other'] ?? 0)],
                ['category' => 'unknown', 'total' => (int) ($deviceTotals['unknown'] ?? 0)],
            ],
            'countries' => $countries,
            'topProducts' => $topProducts,
            'topStaff' => $topStaff,
            'mostActive' => [
                'day' => $total === 0 ? null : $mostActiveDay,
                'hour' => $total === 0 ? null : ['hour' => (int) $mostActiveHour, 'total' => $hourly[$mostActiveHour]],
            ],
        ]);
    }
}
