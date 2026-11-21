<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StatisticsExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);
        $validated = $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90']]);
        $days = (int) ($validated['days'] ?? 30);
        $start = CarbonImmutable::today(config('app.timezone'))->subDays($days - 1)->startOfDay()->utc();

        return response()->streamDownload(function () use ($customer, $start): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['date', 'code_id', 'variant', 'scans']);
            $rows = DB::table('scan_events')->join('products', 'products.id', '=', 'scan_events.product_id')->where('scan_events.customer_id', $customer->id)->where('scan_events.result', 'redirected')->where('scan_events.is_probable_bot', false)->where('scan_events.scanned_at', '>=', $start)->selectRaw('DATE(scan_events.scanned_at) day, products.code_id, products.variant, COUNT(*) total')->groupByRaw('DATE(scan_events.scanned_at), products.id, products.code_id, products.variant')->orderBy('day')->cursor();
            foreach ($rows as $row) {
                fputcsv($out, [$row->day, $row->code_id, $row->variant, $row->total]);
            }
            fclose($out);
        }, 'shiftrix-statistics-'.$days.'d-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }
}
