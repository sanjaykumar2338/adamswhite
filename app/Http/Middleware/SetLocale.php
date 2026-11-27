<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public const COOKIE = 'shiftrix_locale';

    /** @var list<string> */
    private const SUPPORTED = ['en', 'fr'];

    public function handle(Request $request, Closure $next): Response
    {
        $authenticatedUser = $request->user();
        $cookieLocale = $this->valid($request->cookie(self::COOKIE));
        $sessionLocale = $this->valid($request->session()->get('locale'));
        $userLocale = $this->valid($authenticatedUser?->preferred_locale);
        $defaultLocale = $this->valid(config('app.locale')) ?? 'en';

        // A browser selection is authoritative. Without one, authenticated users
        // carry their saved preference between devices; guests use their session.
        $locale = $authenticatedUser
            ? ($cookieLocale ?? $userLocale ?? $defaultLocale)
            : ($sessionLocale ?? $cookieLocale ?? $defaultLocale);

        App::setLocale($locale);
        $request->session()->put('locale', $locale);

        $response = $next($request);
        $responseUser = $request->user();

        if ($cookieLocale !== null
            && $responseUser !== null
            && $responseUser->preferred_locale !== $cookieLocale) {
            $responseUser->forceFill(['preferred_locale' => $cookieLocale])->saveQuietly();
        }

        // LocaleController writes the newly selected value itself. For all other
        // authenticated transitions (including login/logout), keep the browser
        // preference available after the session is invalidated.
        if (! $request->routeIs('locale.update')
            && ($cookieLocale !== null || $authenticatedUser !== null || $responseUser !== null)) {
            $persistedLocale = $cookieLocale
                ?? $this->valid($responseUser?->preferred_locale)
                ?? $this->valid($authenticatedUser?->preferred_locale)
                ?? $locale;

            $response->headers->setCookie(cookie(
                self::COOKIE,
                $persistedLocale,
                60 * 24 * 365 * 5,
                '/',
                null,
                $request->isSecure(),
                true,
                false,
                'lax',
            ));
        }

        return $response;
    }

    private function valid(mixed $locale): ?string
    {
        return is_string($locale) && in_array($locale, self::SUPPORTED, true) ? $locale : null;
    }
}
