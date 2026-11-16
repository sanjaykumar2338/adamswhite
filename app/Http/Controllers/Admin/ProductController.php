<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activation;
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
        $products = Product::with(['batch', 'customer'])->when($request->search, fn ($q, $s) => $q->where('code_id', 'like', "%{$s}%"))->when($request->variant, fn ($q, $v) => $q->where('variant', $v))->when($request->status, fn ($q, $s) => $q->where('status', $s))->when($request->batch, fn ($q, $batch) => $q->whereHas('batch', fn ($b) => $b->where('lot_number', $batch)))->paginate(50)->withQueryString();

        return Inertia::render('Admin/Products', ['products' => $products, 'filters' => $request->only(['search', 'variant', 'status', 'batch'])]);
    }

    public function reset(Request $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product): void {
            Activation::create(['product_id' => $product->id, 'previous_customer_id' => $product->customer_id, 'actor_user_id' => $request->user()->id, 'action' => 'reset', 'activated_at' => now()]);
            $product->update(['customer_id' => null, 'status' => 'unclaimed', 'google_review_url' => null, 'claimed_at' => null, 'disabled_at' => null]);
        });

        return back()->with('success', 'Product reset to unclaimed.');
    }
}
