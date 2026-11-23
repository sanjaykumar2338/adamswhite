<?php

return [

    'shiftrix' => [
        'edge_secret' => env('SHIFTRIX_EDGE_SECRET'),
        'tutorial_url' => env('SHIFTRIX_TUTORIAL_URL', 'https://shiftrix.io/pages/how-to-configure'),
        'support_email' => env('SHIFTRIX_SUPPORT_EMAIL', 'support@shiftrix.io'),
        'whatsapp_url' => env('SHIFTRIX_WHATSAPP_URL', '+1 601 871 0613'),
    ],

    'ipinfo_lite' => [
        'enabled' => env('IPINFO_LITE_ENABLED', false),
        'token' => env('IPINFO_LITE_TOKEN'),
        'endpoint' => env('IPINFO_LITE_ENDPOINT', 'https://api.ipinfo.io/lite'),
        'connect_timeout' => (int) env('IPINFO_LITE_CONNECT_TIMEOUT', 1),
        'timeout' => (int) env('IPINFO_LITE_TIMEOUT', 2),
        'cache_ttl' => (int) env('IPINFO_LITE_CACHE_TTL', 604800),
    ],

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
