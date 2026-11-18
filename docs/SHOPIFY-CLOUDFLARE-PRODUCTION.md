# SHIFTRIX Shopify `/configuration` production integration

## Root cause and selected design

`shiftrix.io` is served by Shopify, so Shopify receives `/configuration?id=CODE_ID` and returns its 404 page. The Laravel application on `app.shiftrix.io` never receives that request. A DNS record for the application subdomain does not route a path on the Shopify apex domain.

Use the scoped Cloudflare Worker in `infrastructure/cloudflare-worker`. Its production route is `https://shiftrix.io/configuration*`; the trailing wildcard is required for query-string matches. The Worker itself accepts only GET/HEAD on the exact `/configuration` path, forwards the complete query string once to `https://app.shiftrix.io/configuration`, and returns Laravel's response without following redirects.

Only GET requests create scan events. HEAD probes resolve the same destination without incrementing customer metrics, preventing browser, CDN or monitoring probes from double counting a scan.

- Active product: one Laravel scan event and a direct browser `302` to Google Reviews.
- Unactivated product: one scan event and a `302` to the Shopify tutorial with the complete query string.
- Invalid/unknown product: `302` to the localized invalid page on `app.shiftrix.io`.
- Disabled product or blocked customer: one blocked event and `302` to the unavailable page on `app.shiftrix.io`.
- Track, registration, login and verification preserve the product ID and query parameters without creating another scan event.

Do not use a Shopify native URL redirect as the permanent integration: Shopify documents that query-string redirects might not work as expected. Do not use an app proxy because Shopify reserves its first path segment and cannot expose the original root-level path.

## Approval gate

Cloudflare Workers Routes require an active Cloudflare zone and a proxied DNS record. If `shiftrix.io` is not already authoritative on Cloudflare, stop. Moving nameservers requires explicit approval and a complete DNS inventory. Recreate the existing Shopify web records and all email-related records exactly; do not change their targets or mail configuration. Validate Shopify storefront, checkout and email before enabling the Worker route.

No Shopify theme change is required for active products. The local tutorial section must not be published until the client approves the current Shopify theme/template and content. The existing `/pages/how-to-configure` page must preserve `id` when it links to `https://app.shiftrix.io/`.

## Namecheap application release (no Node.js and no migrations)

Build locally at the reviewed commit:

```bash
git switch main
git pull --ff-only origin main
npm ci
APP_NAME="Shiftrix Track" VITE_APP_NAME="Shiftrix Track" npm run build
test -f public/build/manifest.json

APP_ARCHIVE="shiftrix-app-$(git rev-parse --short=12 HEAD).tar.gz"
BUILD_ARCHIVE="shiftrix-build-$(git rev-parse --short=12 HEAD).tar.gz"
git archive --format=tar.gz -o "$APP_ARCHIVE" HEAD
tar -czf "$BUILD_ARCHIVE" -C public build
shasum -a 256 "$APP_ARCHIVE" > "${APP_ARCHIVE}.sha256"
shasum -a 256 "$BUILD_ARCHIVE" > "${BUILD_ARCHIVE}.sha256"
```

Upload both archives to `/home/shiflimj/shiftrix-source` on `server239.web-hosting.com`. On Namecheap, use PHP 8.2 and preserve `.env`, storage, inventory, certificate challenges and hosting-managed CGI directories:

```bash
scp -P 21098 \
  "$APP_ARCHIVE" "${APP_ARCHIVE}.sha256" \
  "$BUILD_ARCHIVE" "${BUILD_ARCHIVE}.sha256" \
  shiflimj@server239.web-hosting.com:/home/shiflimj/shiftrix-source/
```

Connect and set the release variables to the approved commit:

```bash
ssh -p 21098 shiflimj@server239.web-hosting.com

SOURCE="/home/shiflimj/shiftrix-source"
LIVE="/home/shiflimj/shiftrix-app"
PHP82="/opt/alt/php82/usr/bin/php"
COMPOSER="/home/shiflimj/bin/composer"
RELEASE_SHA="APPROVED_COMMIT_SHORT_SHA"
APP_ARCHIVE="shiftrix-app-${RELEASE_SHA}.tar.gz"
BUILD_ARCHIVE="shiftrix-build-${RELEASE_SHA}.tar.gz"
RELEASE_DIR="$SOURCE/releases/$RELEASE_SHA"
FRONTEND_DIR="$SOURCE/frontend-releases/$RELEASE_SHA"
ROLLBACK_DIR="$SOURCE/rollback/$(date +%Y%m%d-%H%M%S)"

test -x "$PHP82"
"$PHP82" -v
test -f "$SOURCE/$APP_ARCHIVE"
test -f "$SOURCE/$BUILD_ARCHIVE"
cd "$SOURCE"
sha256sum -c "${APP_ARCHIVE}.sha256"
sha256sum -c "${BUILD_ARCHIVE}.sha256"
test ! -e "$RELEASE_DIR"
test ! -e "$FRONTEND_DIR"
mkdir -p "$RELEASE_DIR" "$FRONTEND_DIR" "$ROLLBACK_DIR/app"

tar -xzf "$SOURCE/$APP_ARCHIVE" -C "$RELEASE_DIR"
tar -xzf "$SOURCE/$BUILD_ARCHIVE" -C "$FRONTEND_DIR"
test -f "$FRONTEND_DIR/build/manifest.json"
test -f "$LIVE/.env"
test -d "$LIVE/storage"
```

Create a recoverable application backup before changing live files. This does not read or change the database:

```bash
rsync -a \
  --exclude='.env' \
  --exclude='storage/' \
  "$LIVE/" "$ROLLBACK_DIR/app/"
cp -p "$LIVE/.env" "$ROLLBACK_DIR/production.env"
chmod 600 "$ROLLBACK_DIR/production.env"
```

Enable maintenance mode and synchronize the reviewed source. Every production-owned or hosting-managed path is excluded from deletion:

```bash
cd "$LIVE"
"$PHP82" artisan down --retry=60

rsync -a --delete \
  --exclude='.env' \
  --exclude='storage/' \
  --exclude='vendor/' \
  --exclude='public/build/' \
  --exclude='public/storage' \
  --exclude='public/.well-known/' \
  --exclude='public/cgi-bin/' \
  --exclude='.well-known/' \
  --exclude='cgi-bin/' \
  --exclude='inventory/' \
  --exclude='*.xlsx' \
  --exclude='*.xls' \
  --exclude='database/*.sqlite*' \
  "$RELEASE_DIR/" "$LIVE/"

mkdir -p "$LIVE/public/build"
rsync -a --delete "$FRONTEND_DIR/build/" "$LIVE/public/build/"

cd "$LIVE"
"$PHP82" "$COMPOSER" install --no-dev --prefer-dist --optimize-autoloader --no-interaction

# Normalize application permissions for LiteSpeed without touching certificate
# challenges, hosting-managed CGI files, the protected environment or inventory.
chmod 755 "$LIVE" "$LIVE/public"
find "$LIVE" \
  \( -path "$LIVE/.env" -o -path "$LIVE/storage" -o -path "$LIVE/bootstrap/cache" \
     -o -path "$LIVE/inventory" -o -path "$LIVE/public/.well-known" \
     -o -path "$LIVE/public/cgi-bin" \) -prune \
  -o -type d -exec chmod 755 {} +
find "$LIVE" \
  \( -path "$LIVE/.env" -o -path "$LIVE/storage" -o -path "$LIVE/bootstrap/cache" \
     -o -path "$LIVE/inventory" -o -path "$LIVE/public/.well-known" \
     -o -path "$LIVE/public/cgi-bin" \) -prune \
  -o -type f -exec chmod 644 {} +
find storage bootstrap/cache -type d -exec chmod 775 {} +
find storage bootstrap/cache -type f -exec chmod 664 {} +
chmod 600 .env

"$PHP82" artisan optimize:clear
"$PHP82" artisan config:cache
"$PHP82" artisan route:cache
"$PHP82" artisan view:cache
"$PHP82" artisan up
```

Before caching configuration, edit the existing production `.env` in place: set `APP_NAME="Shiftrix Track"` and preserve the existing `SESSION_COOKIE=shiftrix_staging_session` value. Keeping that exact cookie name prevents the branding change from invalidating authenticated browser sessions. Do not replace `.env` or alter its database, SMTP, Shopify or secret values. Do not run `migrate`, `db:seed`, an inventory import, or any database reset for this release. No migration is required: the changes use the existing `scan_events.request_uuid` unique column and existing product/customer tables.

## Edge secret and Worker release

Generate one high-entropy secret outside Git. Add the same value as `SHIFTRIX_EDGE_SECRET` in the existing production `.env` without replacing that file. Setting it makes direct browser requests to `app.shiftrix.io/configuration` return 403; requests through the original `shiftrix.io/configuration` URL continue to work. Then refresh Laravel's configuration cache.

From a local machine with Node.js and authenticated Wrangler:

```bash
cd infrastructure/cloudflare-worker
npx wrangler secret put EDGE_SHARED_SECRET --config wrangler.example.jsonc
node --test test/worker.test.mjs
npx wrangler deploy --config wrangler.example.jsonc
```

The `EDGE_SHARED_SECRET` value must match production `SHIFTRIX_EDGE_SECRET`. Running `wrangler deploy` with the route in the example configuration is a production change; do not run it before approval and DNS readiness.

## Production verification and rollback

Verify with distinct known test products after approval:

```bash
curl -sS -D - -o /dev/null 'https://shiftrix.io/configuration?id=ACTIVE_TEST_CODE'
curl -sS -D - -o /dev/null 'https://shiftrix.io/configuration?id=UNACTIVATED_TEST_CODE&utm_source=production-smoke-test'
curl -sS -D - -o /dev/null 'https://shiftrix.io/configuration?id=CARD-99999'
```

Expected results are respectively the configured Google URL, the Shopify tutorial with preserved parameters, and the application invalid page. Confirm exactly one eligible scan per request in the dashboard.

Application rollback uses the `ROLLBACK_DIR` created above and still preserves `.env`, storage, inventory, `.well-known` and `cgi-bin`:

```bash
cd "$LIVE"
"$PHP82" artisan down --retry=60

rsync -a --delete \
  --exclude='.env' \
  --exclude='storage/' \
  --exclude='public/build/' \
  --exclude='public/storage' \
  --exclude='public/.well-known/' \
  --exclude='public/cgi-bin/' \
  --exclude='.well-known/' \
  --exclude='cgi-bin/' \
  --exclude='inventory/' \
  --exclude='*.xlsx' \
  --exclude='*.xls' \
  --exclude='database/*.sqlite*' \
  "$ROLLBACK_DIR/app/" "$LIVE/"

rsync -a --delete "$ROLLBACK_DIR/app/public/build/" "$LIVE/public/build/"

"$PHP82" "$COMPOSER" install --no-dev --prefer-dist --optimize-autoloader --no-interaction
chmod 755 "$LIVE" "$LIVE/public"
find "$LIVE" \
  \( -path "$LIVE/.env" -o -path "$LIVE/storage" -o -path "$LIVE/bootstrap/cache" \
     -o -path "$LIVE/inventory" -o -path "$LIVE/public/.well-known" \
     -o -path "$LIVE/public/cgi-bin" \) -prune \
  -o -type d -exec chmod 755 {} +
find "$LIVE" \
  \( -path "$LIVE/.env" -o -path "$LIVE/storage" -o -path "$LIVE/bootstrap/cache" \
     -o -path "$LIVE/inventory" -o -path "$LIVE/public/.well-known" \
     -o -path "$LIVE/public/cgi-bin" \) -prune \
  -o -type f -exec chmod 644 {} +
find storage bootstrap/cache -type d -exec chmod 775 {} +
find storage bootstrap/cache -type f -exec chmod 664 {} +
chmod 600 .env
"$PHP82" artisan optimize:clear
"$PHP82" artisan config:cache
"$PHP82" artisan route:cache
"$PHP82" artisan view:cache
"$PHP82" artisan up
```

Restore `production.env` only if the approved deployment explicitly changed `.env` and that change must also be rolled back. Never copy it into Git or print it to the terminal.

Cloudflare rollback is to remove only the Worker route (or attach no script to that route). This returns `/configuration` to Shopify's current 404 behavior while leaving every other Shopify path unchanged. Do not alter Shopify checkout, products, payments, theme publication, email DNS, the inventory URLs or the production database during rollback.
