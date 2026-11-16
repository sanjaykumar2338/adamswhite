<?php

namespace App\Services;

class ReviewUrlValidator
{
    public function isValid(?string $url): bool
    {
        if (! is_string($url) || filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');

        if (($parts['scheme'] ?? null) !== 'https' || $host === '' || isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }

        return $host === 'g.page'
            || $host === 'maps.app.goo.gl'
            || $host === 'goo.gl'
            || preg_match('/^([a-z0-9-]+\.)*google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/', $host) === 1;
    }
}
