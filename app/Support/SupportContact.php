<?php

namespace App\Support;

use App\Models\SystemSetting;

class SupportContact
{
    public static function email(): string
    {
        $fallback = config('services.shiftrix.support_email');
        $configured = SystemSetting::valueFor('support_email', $fallback);

        return filter_var($configured, FILTER_VALIDATE_EMAIL)
            ? (string) $configured
            : (string) $fallback;
    }

    public static function whatsappUrl(): ?string
    {
        $configured = trim((string) config('services.shiftrix.whatsapp_url'));

        if ($configured === '') {
            return null;
        }

        if (filter_var($configured, FILTER_VALIDATE_URL)) {
            $scheme = strtolower((string) parse_url($configured, PHP_URL_SCHEME));
            $host = strtolower((string) parse_url($configured, PHP_URL_HOST));
            $allowedHosts = ['wa.me', 'api.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com'];

            return $scheme === 'https' && in_array($host, $allowedHosts, true) ? $configured : null;
        }

        if (! preg_match('/^\+?[0-9\s().-]{8,20}$/', $configured)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $configured);

        return strlen($digits) >= 8 && strlen($digits) <= 15 ? "https://wa.me/{$digits}" : null;
    }
}
