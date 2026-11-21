<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use Inertia\Inertia;
use Inertia\Response;

class BatchController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Batches', ['batches' => Batch::withCount(['products', 'products as assigned_count' => fn ($q) => $q->whereNotNull('customer_id'), 'products as available_count' => fn ($q) => $q->whereNull('customer_id')])->orderBy('lot_number')->get()]);
    }
}
