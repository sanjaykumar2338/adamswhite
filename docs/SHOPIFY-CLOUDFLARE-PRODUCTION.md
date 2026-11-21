# SHIFTRIX Shopify `/configuration` production integration

## Root cause and selected design

`shiftrix.io` is served by Shopify, so Shopify receives `/configuration?id=CODE_ID` and returns its 404 page. The Laravel application on `app.shiftrix.io` never receives that request. A DNS record for the application subdomain does not route a path on the Shopify apex domain.

Use the scoped Cloudflare Worker in `infrastructure/cloudflare-worker`. Its production route is `https://shiftrix.io/configuration*`; the trailing wildcard is required for query-string matches. The Worker accepts only GET/HEAD on `/configuration` and `/configuration/`, forwards the complete query string once to `https://app.shiftrix.io/configuration`, and returns Laravel's response without following redirects. Because Cloudflare's terminal wildcard also matches suffix paths such as `/configuration-extra`, the Worker passes every non-allowed path through to Shopify unchanged.

Only GET requests create scan events. HEAD probes resolve the same destination without incrementing customer metrics, preventing browser, CDN or monitoring probes from double counting a scan.

- Active product: one Laravel scan event and a direct browser `302` to Google Reviews.
- Unactivated product: one scan event and a `302` to the Shopify tutorial with the complete query string.
- Invalid/unknown product: `302` to the localized invalid page on `app.shiftrix.io`.
- Disabled product: one blocked event and `302` to the unavailable page on `app.shiftrix.io`.
- Blocked customer with an activated product: the physical product continues its direct Google Reviews redirect and eligible scan recording; only dashboard access is restricted.
- Track, registration, login and verification preserve the product ID and query parameters without creating another scan event.

Do not use a Shopify native URL redirect as the permanent integration: Shopify documents that query-string redirects might not work as expected. Do not use an app proxy because Shopify reserves its first path segment and cannot expose the original root-level path.

## Approval gate

Cloudflare Workers Routes require an active Cloudflare zone and a proxied DNS record. If `shiftrix.io` is not already authoritative on Cloudflare, stop. Moving nameservers requires explicit approval and a complete DNS inventory. Recreate the existing Shopify web records and all email-related records exactly; do not change their targets or mail configuration. Validate Shopify storefront, checkout and email before enabling the Worker route.

No Shopify theme change is required for active products. The local tutorial section must not be published until the client approves the current Shopify theme/template and content. The existing `/pages/how-to-configure` page must preserve `id` when it links to `https://app.shiftrix.io/`. The CTA-only helper under `shopify/assets` and `shopify/snippets` can be installed after approval without replacing the existing video, typography, wording or page sections.

## Required Cloudflare access and configuration

The `shiftrix.io` zone must be active and authoritative on Cloudflare, and the apex Shopify DNS record must be proxied. Preserve the existing Shopify record targets and every mail, verification and service record. Use SSL/TLS Full (strict); do not use Flexible mode. A Worker Route cannot activate on an unproxied record or a zone that is not authoritative on the deploying Cloudflare account.

Use an account-owned API token with the narrowest current permissions:

- a new Worker requires Workers product-level `Admin`; after creation, scope deployments and secret management to `Editor` on `shiftrix-saas-router` where possible;
- adding, changing or removing the route requires Zone `Workers Routes Write`, scoped only to `shiftrix.io`;
- DNS changes require separate Zone `DNS Write` authority and do not belong in the routine Worker deployment token;
- no KV, R2, D1, Queues, database, Shopify or inventory permission is required.

Authenticate granular Wrangler access with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The reviewed production configuration is:

```text
Worker:              shiftrix-saas-router
Route:               https://shiftrix.io/configuration*
Zone:                shiftrix.io
SHIFTRIX_ORIGIN:     https://app.shiftrix.io
EDGE_SHARED_SECRET:  Wrangler secret; never commit it
```

The Cloudflare route wildcard is broader than the application path by necessity: Cloudflare route patterns cannot contain query parameters. The Worker path guard and Shopify pass-through are therefore part of the storefront isolation boundary. See [Cloudflare Worker route matching](https://developers.cloudflare.com/workers/configuration/routing/routes/) and [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/).

## Namecheap application release (local frontend build and reviewed migrations)

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

Create recoverable application and database backups before changing live files. Use Namecheap/cPanel's database-backup facility or `mysqldump` with credentials supplied securely by the operator; never print or commit credentials. Verify that the SQL backup is non-empty and store it outside the live application tree. Record its path and checksum in the deployment log.

The filesystem backup is:

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
"$PHP82" artisan migrate:status
"$PHP82" artisan migrate --force
"$PHP82" artisan migrate:status
"$PHP82" artisan config:cache
"$PHP82" artisan route:cache
"$PHP82" artisan view:cache
"$PHP82" artisan up
```

The release procedure must preserve the existing production `.env` and its current session cookie, database, SMTP, Shopify and secret values. Do not copy a staging `.env` or force a staging cookie name into production.

This release contains three additive migrations and they must run in timestamp order after the database backup and before bringing the application back online:

```text
2026_11_21_000001_add_product_labels_and_scan_metadata.php
2026_11_21_000002_add_customer_account_management.php
2026_11_21_000003_add_admin_console_fields.php
```

Do not run `db:seed`, the inventory importer, `migrate:fresh`, `migrate:refresh`, or any database reset. The migrations add nullable/defaulted columns, indexes and the deletion-request review table; they do not update product identifiers, NFC URLs, ownership or historical scans.

## Edge secret and Worker release

Generate one high-entropy secret outside Git. Add the same value as `SHIFTRIX_EDGE_SECRET` in the existing production `.env` without replacing that file. Setting it makes direct browser requests to `app.shiftrix.io/configuration` return 403; requests through the original `shiftrix.io/configuration` URL continue to work. Then refresh Laravel's configuration cache.

The values and locations must be exactly:

```text
Laravel production .env:  SHIFTRIX_EDGE_SECRET=<shared high-entropy value>
Cloudflare Worker secret: EDGE_SHARED_SECRET=<same value>
Laravel tutorial URL:     SHIFTRIX_TUTORIAL_URL=https://shiftrix.io/pages/how-to-configure
```

`EnsureEdgeProxy` enforces the shared header only on the Laravel `/configuration` endpoint; the Track homepage, authentication and dashboard routes remain directly accessible. Coordinate the secret and route in one approved maintenance window. Do not leave the Laravel secret enabled with no functioning Worker route unless temporarily returning 403 from the direct scan origin is intentional.

From a local machine with Node.js and authenticated Wrangler:

```bash
cd infrastructure/cloudflare-worker
npx wrangler secret put EDGE_SHARED_SECRET --config wrangler.example.jsonc
node --test test/worker.test.mjs
npx wrangler deploy --config wrangler.example.jsonc
```

The `EDGE_SHARED_SECRET` value must match production `SHIFTRIX_EDGE_SECRET`. Running `wrangler deploy` with the route in the example configuration is a production change; do not run it before approval and DNS readiness.

The Worker also forwards Cloudflare's built-in `CF-IPCountry` value as `X-Shiftrix-Country` for future, aggregate customer analytics. Laravel accepts that value only when the request carries the matching edge secret. Existing scan rows remain unchanged and display as Unknown/Unavailable; no external geolocation service is used.

For a first deployment, create and validate the Worker without the production route on a temporary Cloudflare hostname or staging zone. Add the production route only after the Worker exists, its secret is installed, the Laravel secret is coordinated, and staging verifies Shopify pass-through. Record the prior Worker version and route configuration before activation.

## Production verification and rollback

Verify with distinct known test products after approval:

```bash
curl -sS -D - -o /dev/null 'https://shiftrix.io/configuration?id=ACTIVE_TEST_CODE'
curl -sS -D - -o /dev/null 'https://shiftrix.io/configuration?id=UNACTIVATED_TEST_CODE&utm_source=production-smoke-test'
curl -sS -D - -o /dev/null 'https://shiftrix.io/configuration?id=CARD-99999'
```

Expected results are respectively the configured Google URL, the Shopify tutorial with preserved parameters, and the application invalid page. Confirm exactly one eligible scan per request in the dashboard.

Application rollback uses the `ROLLBACK_DIR` created above and still preserves `.env`, storage, inventory, `.well-known` and `cgi-bin`. The three migrations are backward-compatible with the prior application, so leave them applied during a normal code rollback. Do not run `migrate:rollback` on production: its down methods drop the new columns/table. Restore the verified pre-release database backup only if a database-level rollback is explicitly approved and required.

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
