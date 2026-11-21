<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Models\ReviewLinkHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'variant' => ['nullable', 'in:CARD,PLATE,STAND'],
        ]);
        $products = $customer->products()
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('code_id', 'like', '%'.$search.'%')
                        ->orWhere('display_name', 'like', '%'.$search.'%');
                });
            })
            ->when($filters['variant'] ?? null, fn ($query, string $variant) => $query->where('variant', $variant))
            ->orderByRaw("CASE variant WHEN 'CARD' THEN 1 WHEN 'PLATE' THEN 2 ELSE 3 END")
            ->orderBy('code_id')
            ->get()
            ->each->append(['image_url', 'nfc_url']);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => ['search' => $filters['search'] ?? '', 'variant' => $filters['variant'] ?? ''],
            'counts' => [
                'all' => $customer->products()->count(),
                'CARD' => $customer->products()->where('variant', 'CARD')->count(),
                'PLATE' => $customer->products()->where('variant', 'PLATE')->count(),
                'STAND' => $customer->products()->where('variant', 'STAND')->count(),
            ],
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product): void {
            $url = $request->validated('google_review_url');
            if ($url !== $product->google_review_url) {
                ReviewLinkHistory::create(['product_id' => $product->id, 'customer_id' => $product->customer_id, 'changed_by' => $request->user()->id, 'old_url' => $product->google_review_url, 'new_url' => $url, 'changed_at' => now()]);
            }
            $product->update([
                'display_name' => $request->has('display_name') ? $request->validated('display_name') : $product->display_name,
                'google_review_url' => $url,
            ]);
        });

        return back()->with('success', __('ui.flash.product_updated'));
    }
}
