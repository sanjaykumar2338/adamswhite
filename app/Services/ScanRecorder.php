<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ScanEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScanRecorder
{
    public function record(Product $product, Request $request, string $result, ?float $startedAt = null): ScanEvent
    {
        $userAgent = (string) $request->userAgent();
        $referrerHost = parse_url((string) $request->headers->get('referer'), PHP_URL_HOST);
        $key = (string) config('app.key', 'shiftrix');

        $edgeRequestId = (string) $request->header('X-Shiftrix-Request-Id');
        $requestUuid = Str::isUuid($edgeRequestId) ? $edgeRequestId : (string) Str::uuid();

        $event = ScanEvent::firstOrCreate(['request_uuid' => $requestUuid], [
            'product_id' => $product->id,
            'customer_id' => $product->customer_id,
            'result' => $result,
            'ip_hash' => $request->ip() ? hash_hmac('sha256', $request->ip(), $key) : null,
            'user_agent_hash' => $userAgent !== '' ? hash('sha256', $userAgent) : null,
            'referrer_host' => is_string($referrerHost) ? mb_substr($referrerHost, 0, 255) : null,
            'is_probable_bot' => preg_match('/bot|crawler|spider|preview|facebookexternalhit|slurp/i', $userAgent) === 1,
            'response_time_ms' => $startedAt ? max(0, (int) round((microtime(true) - $startedAt) * 1000)) : null,
            'scanned_at' => now(),
        ]);

        if ($event->wasRecentlyCreated) {
            $product->forceFill(['last_scanned_at' => now()])->saveQuietly();
        }

        return $event;
    }
}
