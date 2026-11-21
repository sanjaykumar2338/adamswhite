<?php

namespace App\Services;

use App\Support\CountryCode;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class IpinfoCountryResolver
{
    public function resolve(string $ip): ?string
    {
        if (! $this->isConfigured() || ! self::isPublicIp($ip)) {
            return null;
        }

        $cacheKey = 'ipinfo-lite:country:'.hash('sha256', $ip);

        try {
            $cached = CountryCode::normalize(Cache::get($cacheKey));
            if ($cached !== null) {
                return $cached;
            }
        } catch (Throwable) {
            // A cache outage must not prevent a country lookup or a scan redirect.
        }

        try {
            $response = Http::acceptJson()
                ->connectTimeout((int) config('services.ipinfo_lite.connect_timeout', 1))
                ->timeout((int) config('services.ipinfo_lite.timeout', 2))
                ->get($this->endpoint().'/'.$ip, [
                    'token' => (string) config('services.ipinfo_lite.token'),
                ]);

            if (! $response->successful()) {
                return null;
            }

            $payload = $response->json();
            if (! is_array($payload) || ($payload['bogon'] ?? false) === true) {
                return null;
            }

            $responseIp = $payload['ip'] ?? null;
            if (! is_string($responseIp) || ! $this->sameAddress($ip, $responseIp)) {
                return null;
            }

            $country = CountryCode::normalize($payload['country_code'] ?? null);
            if ($country === null) {
                return null;
            }

            try {
                Cache::put($cacheKey, $country, (int) config('services.ipinfo_lite.cache_ttl', 604800));
            } catch (Throwable) {
                // Successful resolution remains useful even when caching is unavailable.
            }

            return $country;
        } catch (Throwable) {
            return null;
        }
    }

    public function isConfigured(): bool
    {
        return (bool) config('services.ipinfo_lite.enabled')
            && trim((string) config('services.ipinfo_lite.token')) !== '';
    }

    public static function isPublicIp(?string $ip): bool
    {
        return is_string($ip) && filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    private function endpoint(): string
    {
        $endpoint = rtrim((string) config('services.ipinfo_lite.endpoint'), '/');

        return str_starts_with($endpoint, 'https://') ? $endpoint : 'https://api.ipinfo.io/lite';
    }

    private function sameAddress(string $requested, string $returned): bool
    {
        $requestedBinary = @inet_pton($requested);
        $returnedBinary = @inet_pton($returned);

        return $requestedBinary !== false && $returnedBinary !== false && hash_equals($requestedBinary, $returnedBinary);
    }
}
