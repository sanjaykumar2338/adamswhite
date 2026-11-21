<?php

namespace App\Jobs;

use App\Models\ScanEvent;
use App\Services\IpinfoCountryResolver;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ResolveScanCountry implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $scanEventId,
        public readonly string $ip,
    ) {
        $this->onConnection('deferred');
    }

    public function handle(IpinfoCountryResolver $resolver): void
    {
        $country = $resolver->resolve($this->ip);
        if ($country === null) {
            return;
        }

        ScanEvent::query()
            ->whereKey($this->scanEventId)
            ->where('result', 'redirected')
            ->where('is_probable_bot', false)
            ->whereNull('country_code')
            ->update(['country_code' => $country]);
    }
}
