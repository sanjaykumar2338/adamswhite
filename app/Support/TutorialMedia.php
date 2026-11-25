<?php

namespace App\Support;

class TutorialMedia
{
    /**
     * @return array{videoUrl: ?string, videoType: ?string, posterUrl: ?string}
     */
    public function forLocale(string $locale): array
    {
        $locale = $locale === 'fr' ? 'fr' : 'en';
        $video = "videos/tutorial-{$locale}.mp4";
        $poster = "videos/tutorial-{$locale}-poster.jpg";

        if (is_file(public_path($video))) {
            return [
                'videoUrl' => asset($video),
                'videoType' => 'file',
                'posterUrl' => is_file(public_path($poster)) ? asset($poster) : null,
            ];
        }

        $fallback = trim((string) config('services.shiftrix.tutorial_video_url'));
        $fallback = filter_var($fallback, FILTER_VALIDATE_URL) && parse_url($fallback, PHP_URL_SCHEME) === 'https'
            ? $fallback
            : null;

        return [
            'videoUrl' => $fallback,
            'videoType' => $fallback
                ? (preg_match('/\.(mp4|webm)(?:\?.*)?$/i', $fallback) ? 'file' : 'embed')
                : null,
            'posterUrl' => null,
        ];
    }
}
