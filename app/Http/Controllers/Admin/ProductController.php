<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activation;
use App\Models\Batch;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:32'],
            'variant' => ['nullable', 'in:'.implode(',', Product::VARIANTS)],
            'batch' => ['nullable', 'integer', 'exists:batches,id'],
            'status' => ['nullable', 'in:unclaimed,active,disabled'],
            'unit_type' => ['nullable', 'in:commercial,backup'],
        ]);

        $search = trim($filters['search'] ?? '');
        $query = Product::query()
            ->with(['batch:id,code,lot_number', 'customer:id,business_name'])
            ->when($search !== '', fn ($q) => $q->where('code_id', 'like', "%{$search}%"))
            ->when($filters['variant'] ?? null, fn ($q, $variant) => $q->where('variant', $variant))
            ->when($filters['batch'] ?? null, fn ($q, $batchId) => $q->where('batch_id', $batchId))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['unit_type'] ?? null, fn ($q, $unitType) => $q->where('unit_type', $unitType))
            ->orderBy('id');

        $products = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Products', [
            'products' => $products,
            'filters' => [...$filters, 'search' => $search],
            'batches' => Batch::query()->orderBy('lot_number')->get(['id', 'code', 'lot_number']),
            'totalProducts' => Product::count(),
            'inventorySummary' => [
                'total' => Product::count(),
                'claimed' => Product::whereNotNull('customer_id')->count(),
                'available' => Product::whereNull('customer_id')->where('status', 'unclaimed')->count(),
                'disabled' => Product::where('status', 'disabled')->count(),
                'backup' => Product::where('unit_type', 'backup')->count(),
            ],
        ]);
    }

    public function reset(Request $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product): void {
            Activation::create(['product_id' => $product->id, 'previous_customer_id' => $product->customer_id, 'actor_user_id' => $request->user()->id, 'action' => 'reset', 'activated_at' => now()]);
            $product->update(['customer_id' => null, 'status' => 'unclaimed', 'google_review_url' => null, 'claimed_at' => null, 'disabled_at' => null]);
        });

        return back()->with('success', __('ui.flash.product_reset'));
    }
}
