<?php

namespace App\Services;

use App\Jobs\ResolveScanCountry;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Support\CountryCode;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScanRecorder
{
    public function __construct(private readonly IpinfoCountryResolver $countryResolver) {}

    public function record(Product $product, Request $request, string $result, ?float $startedAt = null): ScanEvent
    {
        $userAgent = (string) $request->userAgent();
        $referrerHost = parse_url((string) $request->headers->get('referer'), PHP_URL_HOST);
        $key = (string) config('app.key', 'shiftrix');

        $edgeRequestId = (string) $request->header('X-Shiftrix-Request-Id');
        $requestUuid = Str::isUuid($edgeRequestId) ? $edgeRequestId : (string) Str::uuid();
        $isProbableBot = preg_match('/bot|crawler|spider|preview|facebookexternalhit|slurp/i', $userAgent) === 1;
        $countryCode = $this->trustedEdgeCountryCode($request);

        $event = ScanEvent::firstOrCreate(['request_uuid' => $requestUuid], [
            'product_id' => $product->id,
            'customer_id' => $product->customer_id,
            'result' => $result,
            'ip_hash' => $request->ip() ? hash_hmac('sha256', $request->ip(), $key) : null,
            'user_agent_hash' => $userAgent !== '' ? hash('sha256', $userAgent) : null,
            'device_category' => $this->deviceCategory($userAgent),
            'country_code' => $countryCode,
            'referrer_host' => is_string($referrerHost) ? mb_substr($referrerHost, 0, 255) : null,
            'is_probable_bot' => $isProbableBot,
            'response_time_ms' => $startedAt ? max(0, (int) round((microtime(true) - $startedAt) * 1000)) : null,
            'scanned_at' => now(),
        ]);

        if ($event->wasRecentlyCreated) {
            $product->forceFill(['last_scanned_at' => now()])->saveQuietly();

            $clientIp = $this->trustedClientIp($request);
            if ($result === 'redirected' && ! $isProbableBot && $countryCode === null && $this->countryResolver->isConfigured() && IpinfoCountryResolver::isPublicIp($clientIp)) {
                ResolveScanCountry::dispatch($event->id, $clientIp);
            }
        }

        return $event;
    }

    private function deviceCategory(string $userAgent): ?string
    {
        if ($userAgent === '') {
            return null;
        }

        if (preg_match('/iPhone|iPad|iPod/i', $userAgent) === 1) {
            return 'iphone';
        }

        if (preg_match('/Android/i', $userAgent) === 1) {
            return 'android';
        }

        return 'other';
    }

    private function trustedEdgeCountryCode(Request $request): ?string
    {
        if (! $this->isTrustedEdge($request)) {
            return null;
        }

        return CountryCode::normalize($request->header('X-Shiftrix-Country'));
    }

    private function trustedClientIp(Request $request): ?string
    {
        if ($this->isTrustedEdge($request)) {
            $forwarded = trim(explode(',', (string) $request->header('X-Forwarded-For'))[0]);
            if (IpinfoCountryResolver::isPublicIp($forwarded)) {
                return $forwarded;
            }
        }

        $ip = $request->ip();

        return IpinfoCountryResolver::isPublicIp($ip) ? $ip : null;
    }

    private function isTrustedEdge(Request $request): bool
    {
        $edgeSecret = (string) config('services.shiftrix.edge_secret');

        return $edgeSecret !== '' && hash_equals($edgeSecret, (string) $request->header('X-Shiftrix-Edge'));
    }
}
