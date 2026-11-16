<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StatisticsExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);

        return response()->streamDownload(function () use ($customer): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['date', 'code_id', 'variant', 'scans']);
            $rows = DB::table('scan_events')->join('products', 'products.id', '=', 'scan_events.product_id')->where('scan_events.customer_id', $customer->id)->where('scan_events.result', 'redirected')->where('scan_events.is_probable_bot', false)->selectRaw('DATE(scan_events.scanned_at) day, products.code_id, products.variant, COUNT(*) total')->groupByRaw('DATE(scan_events.scanned_at), products.id, products.code_id, products.variant')->orderBy('day')->cursor();
            foreach ($rows as $row) {
                fputcsv($out, [$row->day, $row->code_id, $row->variant, $row->total]);
            }
            fclose($out);
        }, 'shiftrix-statistics-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }
}
