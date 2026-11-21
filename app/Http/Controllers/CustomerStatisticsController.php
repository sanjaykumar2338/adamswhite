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

        $events = ScanEvent::query()
            ->where('customer_id', $customer->id)
            ->where('result', 'redirected')
            ->where('is_probable_bot', false)
            ->where('scanned_at', '>=', $start)
            ->orderBy('scanned_at')
            ->get(['scanned_at', 'device_category', 'country_code']);

        $daily = $events->groupBy(fn (ScanEvent $event): string => $event->scanned_at->timezone($timezone)->toDateString())->map->count();
        $series = collect(range(0, $days - 1))->map(function (int $offset) use ($today, $days, $daily): array {
            $day = $today->subDays($days - 1)->addDays($offset)->toDateString();

            return ['day' => $day, 'total' => (int) ($daily[$day] ?? 0)];
        })->values();

        $weekday = array_fill(0, 7, 0);
        $hourly = array_fill(0, 24, 0);
        foreach ($events as $event) {
            $local = $event->scanned_at->timezone($timezone);
            $weekday[$local->dayOfWeek]++;
            $hourly[$local->hour]++;
        }

        $mostActiveDay = $series->sortByDesc('total')->first();
        $mostActiveHour = collect($hourly)->sortDesc()->keys()->first();

        return Inertia::render('Statistics/Index', [
            'days' => $days,
            'timezone' => $timezone,
            'total' => $events->count(),
            'series' => $series,
            'weekday' => collect($weekday)->map(fn (int $total, int $day): array => ['day' => $day, 'total' => $total])->values(),
            'hourly' => collect($hourly)->map(fn (int $total, int $hour): array => ['hour' => $hour, 'total' => $total])->values(),
            'devices' => [
                ['category' => 'iphone', 'total' => $events->where('device_category', 'iphone')->count()],
                ['category' => 'android', 'total' => $events->where('device_category', 'android')->count()],
                ['category' => 'other', 'total' => $events->where('device_category', 'other')->count()],
                ['category' => 'unknown', 'total' => $events->whereNull('device_category')->count()],
            ],
            'countries' => $events->groupBy(fn (ScanEvent $event): string => $event->country_code ?: 'unknown')
                ->map(fn ($items, string $country): array => ['country' => $country, 'total' => $items->count()])
                ->sortByDesc('total')->values(),
            'mostActive' => [
                'day' => $events->isEmpty() ? null : $mostActiveDay,
                'hour' => $events->isEmpty() ? null : ['hour' => (int) $mostActiveHour, 'total' => $hourly[$mostActiveHour]],
            ],
        ]);
    }
}
