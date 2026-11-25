<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\ReviewUrlValidator;
use App\Services\ScanRecorder;
use App\Support\TutorialMedia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrackController extends Controller
{
    public function __invoke(Request $request, ScanRecorder $recorder, ReviewUrlValidator $validator, TutorialMedia $tutorialMedia): RedirectResponse|Response
    {
        $started = microtime(true);
        $rawCode = $request->query('id');
        $code = is_string($rawCode) ? strtoupper(trim($rawCode)) : '';
        $product = null;
        $invalid = false;

        if ($code !== '') {
            if (preg_match('/^(CARD|PLATE|STAND)-\d{5}$/', $code)) {
                $product = Product::where('code_id', $code)->first();
            }

            $invalid = ! $product;
        }

        if ($request->routeIs('home') && $product) {
            if ($product->status === 'active' && $validator->isValid($product->google_review_url)) {
                if ($request->isMethod('GET')) {
                    $recorder->record($product, $request, 'redirected', $started);
                }

                return redirect()->away($product->google_review_url, 302);
            }

            if (in_array($product->status, ['active', 'paused', 'disabled'], true) || $product->customer_id) {
                if ($request->isMethod('GET')) {
                    $recorder->record($product, $request, 'blocked', $started);
                }

                return Inertia::render('Configuration/Unavailable', [
                    'code' => $product->code_id,
                    'reason' => $product->status === 'active' ? 'unconfigured' : $product->status,
                ]);
            }

            if ($request->isMethod('GET')) {
                $recorder->record($product, $request, 'unclaimed', $started);
            }

            $query = $request->query();
            $query['id'] = $product->code_id;
            $continueUrl = route('activation.lookup', $query, absolute: false);
            $request->session()->put('pending_product_code', $product->code_id);
            $request->session()->put('url.intended', $continueUrl);
            $media = $tutorialMedia->forLocale(app()->getLocale());

            return Inertia::render('Track/Tutorial', [
                'product' => [
                    ...$product->only(['code_id', 'variant', 'unit_type']),
                    'image_url' => $product->image_url,
                ],
                'continueUrl' => $continueUrl,
                ...$media,
            ]);
        }

        if ($product && $product->status === 'unclaimed' && ! $product->customer_id) {
            $query = $request->query();
            $query['id'] = $product->code_id;
            $intended = route('activation.lookup', $query, absolute: false);
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
