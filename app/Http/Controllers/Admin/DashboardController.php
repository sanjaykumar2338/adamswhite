<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', ['metrics' => ['customers' => Customer::count(), 'users' => User::count(), 'claimed' => Product::whereNotNull('customer_id')->count(), 'available' => Product::whereNull('customer_id')->count(), 'scans30d' => ScanEvent::where('scanned_at', '>=', now()->subDays(30))->where('result', 'redirected')->where('is_probable_bot', false)->count()], 'recentCustomers' => Customer::latest()->limit(10)->get()]);
    }
}
