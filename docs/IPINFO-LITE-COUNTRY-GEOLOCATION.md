# IPinfo Lite country geolocation

This integration enriches only newly recorded, eligible human redirects. It does not alter product identifiers, NFC URLs, activation, deduplication, ownership, or historical scan events.

## Resolution flow

1. Laravel accepts `X-Shiftrix-Country` only when the request also contains the configured `X-Shiftrix-Edge` shared secret. The Cloudflare Worker derives this header from Cloudflare metadata.
2. When trusted country metadata is unavailable, Laravel accepts the Worker's single `X-Forwarded-For` address only with the same shared-secret check. Direct requests use Laravel's client IP and do not trust arbitrary forwarded or `CF-IPCountry` headers.
3. Private, loopback, reserved, documentation, and malformed IPv4/IPv6 addresses are rejected locally.
4. A deferred in-process job runs after Laravel sends the redirect response. It calls the HTTPS IPinfo Lite endpoint with short connection and request timeouts.
5. The response `country_code` field is normalized and validated against ISO 3166-1 alpha-2. Successful results are cached for seven days using a SHA-256-derived cache key; raw IP addresses are not used in cache keys or application logs.
6. Failures, timeouts, authentication errors, rate limits, malformed responses, and unavailable cache storage leave `country_code` null. Statistics display these scans as Unknown/Unavailable.

IPinfo documents the Lite response field as `country_code`: <https://ipinfo.io/developers/lite-api>.
The customer and admin Statistics pages include the attribution required by the IPinfo Lite license: <https://ipinfo.io/attribution>.

## Production environment

Add these values to the production `.env` through cPanel or SSH. Never add the real token to Git, a deployment archive, a command transcript, or frontend assets.

```dotenv
IPINFO_LITE_TOKEN=replace-with-the-production-token
IPINFO_LITE_ENABLED=true
```

Optional defaults are deliberately bounded:

```dotenv
IPINFO_LITE_CONNECT_TIMEOUT=1
IPINFO_LITE_TIMEOUT=2
IPINFO_LITE_CACHE_TTL=604800
```

The endpoint defaults to `https://api.ipinfo.io/lite` and should not be overridden in production. The existing `SHIFTRIX_EDGE_SECRET` must continue to match the Cloudflare Worker secret.

## Namecheap shared-hosting release steps

1. Back up the application files, production `.env`, and database using the existing release runbook.
2. Upload the reviewed application release without replacing `.env`, inventory files, or user uploads.
3. Add the two required IPinfo values to `.env`. Preserve every existing setting and secret.
4. Run `composer install --no-dev --optimize-autoloader` and upload the locally generated `public/build` assets.
5. Run `php artisan optimize:clear` followed by `php artisan config:cache`.
6. No database migration is required for this integration. The existing nullable `scan_events.country_code` column is reused.
7. No persistent queue worker or cron entry is required. The `deferred` queue connection executes the lookup after the redirect response within the same PHP request lifecycle.
8. Run the smoke test below, then confirm customer and admin statistics. Do not modify Cloudflare, Shopify, or DNS as part of this application release.

To disable enrichment without affecting scans or redirects, set `IPINFO_LITE_ENABLED=false` and rebuild the config cache.

## India iPhone verification

1. On an iPhone using an Indian mobile or Wi-Fi connection, scan an already activated SHIFTRIX product.
2. Confirm Safari reaches the configured Google Review destination immediately.
3. Confirm exactly one eligible scan is recorded, its device category is `iphone`, and its `country_code` becomes `IN` after the response completes.
4. Open the owning customer's Statistics page for the applicable 7-, 30-, or 90-day period and confirm **India** appears in Country distribution.
5. Open Admin Statistics for the same period and confirm India appears there too.
6. Confirm another customer cannot see this scan and the original product ID/NFC URL is unchanged.

Mobile carriers, VPNs, iCloud Private Relay, and corporate networks can geolocate to a different country. The application displays the verified API result and never guesses or retroactively fills historical records.
