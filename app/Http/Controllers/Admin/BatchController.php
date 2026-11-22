<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BatchController extends Controller
{
    public function index(Request $request): Response
    {
        $summary = Batch::query()->join('products', 'products.batch_id', '=', 'batches.id')
            ->selectRaw('COUNT(products.id) total, SUM(CASE WHEN products.customer_id IS NOT NULL THEN 1 ELSE 0 END) claimed')
            ->first();

        return Inertia::render('Admin/Batches', [
            'batches' => Batch::withCount([
                'products',
                'products as assigned_count' => fn ($query) => $query->whereNotNull('customer_id'),
                'products as available_count' => fn ($query) => $query->whereNull('customer_id'),
            ])->orderBy('lot_number')->paginate(25)->withQueryString(),
            'summary' => ['total' => (int) ($summary->total ?? 0), 'claimed' => (int) ($summary->claimed ?? 0)],
        ]);
    }
}
