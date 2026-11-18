<?php

namespace App\Http\Controllers;

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
        $products = $customer->products()->with('batch')
            ->withCount(['scanEvents as scans_7d' => fn ($q) => $q->where('scanned_at', '>=', now()->subDays(7))->where('result', 'redirected')->where('is_probable_bot', false), 'scanEvents as scans_30d' => fn ($q) => $q->where('scanned_at', '>=', now()->subDays(30))->where('result', 'redirected')->where('is_probable_bot', false)])
            ->latest('claimed_at')->get()->append('image_url');
        $series = DB::table('scan_events')->selectRaw('DATE(scanned_at) day, COUNT(*) total')->where('customer_id', $customer->id)->where('scanned_at', '>=', now()->subDays(30))->where('result', 'redirected')->where('is_probable_bot', false)->groupByRaw('DATE(scanned_at)')->orderBy('day')->get();

        return Inertia::render('Dashboard', [
            'customer' => $customer,
            'role' => $request->user()->roleFor($customer),
            'products' => $products,
            'series' => $series,
            'summary' => ['products' => $products->count(), 'scans7d' => $products->sum('scans_7d'), 'scans30d' => $products->sum('scans_30d')],
        ]);
    }
}
