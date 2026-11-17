<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\ReviewUrlValidator;
use App\Services\ScanRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConfigurationController extends Controller
{
    public function __invoke(Request $request, ScanRecorder $recorder, ReviewUrlValidator $validator): Response|RedirectResponse
    {
        $started = microtime(true);
        $code = strtoupper(trim((string) $request->query('id')));

        if (! preg_match('/^(CARD|PLATE|STAND)-\d{5}$/', $code)) {
            return Inertia::render('Configuration/Invalid', ['code' => $code]);
        }

        $product = Product::with(['batch', 'customer'])->where('code_id', $code)->first();
        if (! $product) {
            return Inertia::render('Configuration/Invalid', ['code' => $code]);
        }

        if ($product->status === 'active' && $product->customer?->status === 'active' && $validator->isValid($product->google_review_url)) {
            $recorder->record($product, $request, 'redirected', $started);

            return redirect()->away($product->google_review_url, 302);
        }

        if ($product->status === 'disabled' || ($product->customer && $product->customer->status !== 'active')) {
            $recorder->record($product, $request, 'blocked', $started);

            return Inertia::render('Configuration/Unavailable', ['code' => $code]);
        }

        $recorder->record($product, $request, 'unclaimed', $started);

        $tutorialUrl = rtrim((string) config('services.shiftrix.tutorial_url'), '?&');

        return redirect()->away($tutorialUrl.'?'.http_build_query(['id' => $code]), 302);
    }
}
