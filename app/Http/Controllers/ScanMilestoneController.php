<?php

namespace App\Http\Controllers;

use App\Models\ScanEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ScanMilestoneController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);

        $threshold = max(1, (int) config('services.shiftrix.scan_milestone_threshold', 10));
        $isReached = ScanEvent::query()
            ->where('customer_id', $customer->id)
            ->genuine()
            ->count() >= $threshold;

        if (config('services.shiftrix.scan_milestone_enabled', false) && $isReached) {
            $customer->newQuery()
                ->whereKey($customer->id)
                ->whereNull('genuine_scan_milestone_dismissed_at')
                ->update(['genuine_scan_milestone_dismissed_at' => now()]);
        }

        return redirect()->route('dashboard');
    }
}
