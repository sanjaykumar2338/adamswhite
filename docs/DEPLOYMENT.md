# Production deployment runbook

## Requirements

PHP 8.2 or newer with mbstring, openssl, PDO MySQL, tokenizer, XML, ctype, fileinfo, BCMath, GD and ZIP; MySQL 8/MariaDB 10.6+; Composer 2; Node 20+ for build (local CI is acceptable); HTTPS; SMTP; and a cron entry.

## Release

1. Back up the database and current release.
2. Upload or pull the reviewed commit into a directory outside `public_html` where supported.
3. Point the application document root at Laravel's `public` directory. Never expose `.env`, `vendor` internals, storage or the source workbook.
4. Create `.env` from `.env.example` with `APP_ENV=production`, `APP_DEBUG=false`, the final HTTPS URL, MySQL credentials, SMTP settings and secure session settings.
5. Run `composer install --no-dev --optimize-autoloader` and deploy the already-built frontend or run `npm ci && npm run build`.
6. Run `php artisan migrate --force`, then `php artisan config:cache`, `route:cache`, `view:cache` and `storage:link` if public uploads are introduced.
7. Validate and import the workbook from a private server path. Remove it from the host after the controlled import and backup.
8. On Namecheap Shared Hosting, add cron at the permitted five-minute interval: `*/5 * * * * cd /path/to/app && /usr/local/bin/php artisan schedule:run >/dev/null 2>&1`. Confirm the account's PHP CLI path first.
9. Smoke-test registration, verification, password reset, one unclaimed scan, one active redirect, customer/admin authorization and CSV export.
10. Configure the reviewed Cloudflare routes only after staging acceptance, then monitor HTTP failures and redirect latency.

Use a database-backed queue synchronously on restrictive shared hosting or configure a supervised worker where cPanel permits it. Rotate application, database and mail credentials after handover.

## Namecheap compatibility

Namecheap currently documents PHP 8.0–8.5, MariaDB 11.4, MySQLi, Git, SSH (enabled from cPanel), Composer installation over SSH, mod_rewrite, SSL and cPanel cron. This satisfies Laravel 12's PHP 8.2 baseline and this application's database requirements. Shared Hosting prohibits cron intervals shorter than five minutes and more than five simultaneous cron jobs, so Laravel's conventional one-minute scheduler entry must not be used there.

Before upload, verify the actual purchased account has PHP 8.2+, `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `hash`, `mbstring`, `openssl`, `pcre`, `PDO`, `pdo_mysql`, `session`, `tokenizer`, `xml`, `zip` and sufficient memory. Build frontend assets before upload; production does not require Node. Hosting-account access is still needed to verify these account-specific settings.

Official hosting references checked for this audit:

- [Namecheap server software versions](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/)
- [Namecheap cron-job limits](https://www.namecheap.com/support/knowledgebase/article.aspx/1212/22/do-you-allow-cron-jobs/)
- [Composer on Namecheap shared servers](https://www.namecheap.com/support/knowledgebase/article.aspx/9977/29/how-to-install-composer-on-shared-servers/)
- [Changing PHP and extensions in cPanel](https://www.namecheap.com/support/knowledgebase/article.aspx/9417/2219/how-to-change-php-version-and-update-php-extensions-on-shared-servers/)

## Safe staging sequence

1. Create `staging-app.shiftrix.io` in Namecheap with a separate database and document root pointing to `public/`. Do not change `shiftrix.io` DNS or Shopify.
2. Deploy the reviewed commit, configure `APP_ENV=staging`, `APP_DEBUG=false`, staging SMTP, a unique `APP_KEY`, `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true`, and a strong `SHIFTRIX_EDGE_SECRET`.
3. Run migrations, caches, the dry-run inventory validation, and then a staging-only import. Never upload the XLSX beneath a public document root.
4. Smoke-test the origin using the edge header from a private test client. Confirm direct origin requests without that header return 403.
5. Deploy the Worker to a temporary Cloudflare test hostname with `SHIFTRIX_ORIGIN=https://staging-app.shiftrix.io` and the matching secret. Run the route tests and full browser acceptance there.
6. Obtain sign-off and a rollback window. Only then plan the Cloudflare zone/DNS cutover and four scoped Worker routes described in `infrastructure/cloudflare-worker/wrangler.example.jsonc`.

The production edge design follows [Cloudflare Worker route matching](https://developers.cloudflare.com/workers/configuration/routing/routes/). Shopify's documented [app-proxy constraints](https://shopify.dev/docs/apps/build/online-store/app-proxies) are why an app proxy is not used for the exact root-level `/configuration` URL.
