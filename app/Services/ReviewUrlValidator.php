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

        if (($parts['scheme'] ?? null) !== 'https'
            || $host === ''
            || isset($parts['user'])
            || isset($parts['pass'])
            || (isset($parts['port']) && $parts['port'] !== 443)) {
            return false;
        }

        $path = $parts['path'] ?? '';

        if ($host === 'g.page') {
            return $path !== '/'
                && $path !== ''
                && preg_match('#^/(?:r/[^/]+/review|[^/]+(?:/review)?)/*$#i', $path) === 1;
        }

        if ($host === 'maps.app.goo.gl') {
            return preg_match('#^/[A-Za-z0-9_-]+/*$#', $path) === 1;
        }

        if ($host === 'goo.gl') {
            return preg_match('#^/maps/[A-Za-z0-9_-]+/*$#', $path) === 1;
        }

        if (preg_match('/^(?:(www|maps|search)\.)?google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/', $host, $matches) !== 1) {
            return false;
        }

        $subdomain = $matches[1] ?? '';

        if ($subdomain === 'search') {
            return preg_match('#^/local/writereview/?$#i', $path) === 1
                && isset($parts['query']);
        }

        if ($subdomain === 'maps') {
            return $path === '/' || str_starts_with(strtolower($path), '/maps');
        }

        return preg_match('#^/(?:maps(?:/|$)|local/writereview/?$)#i', $path) === 1;
    }
}
