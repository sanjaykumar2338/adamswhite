<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateReviewLinkRequest;
use App\Models\Product;
use App\Models\ReviewLinkHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function update(UpdateReviewLinkRequest $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);
        DB::transaction(function () use ($request, $product): void {
            $url = $request->validated('google_review_url');
            ReviewLinkHistory::create(['product_id' => $product->id, 'customer_id' => $product->customer_id, 'changed_by' => $request->user()->id, 'old_url' => $product->google_review_url, 'new_url' => $url, 'changed_at' => now()]);
            $product->update(['google_review_url' => $url]);
        });

        return back()->with('success', __('ui.flash.review_updated'));
    }
}
