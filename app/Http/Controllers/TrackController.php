<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrackController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $code = strtoupper(trim((string) $request->query('id')));
        $product = null;
        $invalid = false;

        if ($code !== '') {
            if (preg_match('/^(CARD|PLATE|STAND)-\d{5}$/', $code)) {
                $product = Product::where('code_id', $code)->first();
            }

            $invalid = ! $product;
        }

        if ($product && $product->status === 'unclaimed' && ! $product->customer_id) {
            $intended = route('home', ['id' => $product->code_id], absolute: false);
            $request->session()->put('pending_product_code', $product->code_id);
            $request->session()->put('url.intended', $intended);
        }

        $user = $request->user();
        $customer = $user?->currentCustomer();

        return Inertia::render('Track/Index', [
            'code' => $code,
            'invalid' => $invalid,
            'product' => $product ? [
                ...$product->only(['code_id', 'variant', 'unit_type', 'status']),
                'image_url' => $product->image_url,
                'is_available' => $product->status === 'unclaimed' && ! $product->customer_id,
            ] : null,
            'customer' => $customer?->only(['business_name', 'status']),
            'canActivate' => (bool) ($user?->hasVerifiedEmail() && $customer?->status === 'active'),
            'needsVerification' => (bool) ($user && ! $user->hasVerifiedEmail()),
        ]);
    }
}
