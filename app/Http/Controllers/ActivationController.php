<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClaimProductRequest;
use App\Models\Activation;
use App\Models\Product;
use App\Models\ReviewLinkHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ActivationController extends Controller
{
    public function store(ClaimProductRequest $request): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $customer->status === 'active', 403);

        DB::transaction(function () use ($request, $customer): void {
            $product = Product::where('code_id', $request->validated('code_id'))->lockForUpdate()->firstOrFail();
            if ($product->status !== 'unclaimed' || $product->customer_id) {
                throw ValidationException::withMessages(['code_id' => 'This product has already been claimed.']);
            }
            if ($customer->products()->where('status', 'active')->count() >= $customer->max_products) {
                throw ValidationException::withMessages(['code_id' => 'Your account has reached its product limit.']);
            }

            $url = $request->validated('google_review_url');
            $product->update(['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => $url, 'claimed_at' => now()]);
            Activation::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'actor_user_id' => $request->user()->id, 'action' => 'claimed', 'activated_at' => now()]);
            ReviewLinkHistory::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'changed_by' => $request->user()->id, 'old_url' => null, 'new_url' => $url, 'changed_at' => now()]);
        });

        return to_route('dashboard')->with('success', 'Product activated successfully.');
    }
}
