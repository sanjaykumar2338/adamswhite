<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

final class AdminOverviewCache
{
    public const KEY = 'admin.overview.metrics.v1';

    public static function forget(): void
    {
        Cache::forget(self::KEY);
    }
}
