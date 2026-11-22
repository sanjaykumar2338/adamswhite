<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\ReviewUrlValidator;
use App\Services\ScanRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ConfigurationController extends Controller
{
    public function __invoke(Request $request, ScanRecorder $recorder, ReviewUrlValidator $validator): RedirectResponse
    {
        $started = microtime(true);
        $rawCode = $request->query('id');
        $code = is_string($rawCode) ? strtoupper(trim($rawCode)) : '';
        $query = $request->query();
        $query['id'] = $code;

        if (! preg_match('/^(CARD|PLATE|STAND)-\d{5}$/', $code)) {
            return redirect()->away(route('configuration.invalid', $query), 302);
        }

        $product = Product::with(['batch', 'customer'])->where('code_id', $code)->first();
        if (! $product) {
            return redirect()->away(route('configuration.invalid', $query), 302);
        }

        if ($product->status === 'active' && $validator->isValid($product->google_review_url)) {
            if ($request->isMethod('GET')) {
                $recorder->record($product, $request, 'redirected', $started);
            }

            return redirect()->away($product->google_review_url, 302);
        }

        if (in_array($product->status, ['disabled', 'paused'], true)) {
            if ($request->isMethod('GET')) {
                $recorder->record($product, $request, 'blocked', $started);
            }

            return redirect()->away(route('configuration.unavailable', $query), 302);
        }

        if ($request->isMethod('GET')) {
            $recorder->record($product, $request, 'unclaimed', $started);
        }

        $tutorialUrl = rtrim((string) config('services.shiftrix.tutorial_url'), '?&');

        return redirect()->away($tutorialUrl.'?'.http_build_query($query), 302);
    }
}
