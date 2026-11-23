# Production deployment runbook

## Requirements

64-bit PHP 8.2–8.4 with ctype, curl, DOM, fileinfo, filter, GD, hash, iconv, JSON, libxml, mbstring, OpenSSL, PCRE, PDO MySQL, Phar, session, SimpleXML, tokenizer, XML reader/writer, ZIP and zlib; a minimum 256 MB PHP memory limit (512 MB recommended for inventory import); MySQL 8/MariaDB 10.6+; Composer 2; HTTPS; and SMTP. Node is not required on the host because the package contains the production frontend build.

## Release

1. Back up the database and current release.
2. Upload or pull the reviewed commit into a directory outside `public_html` where supported.
3. Point the application document root at Laravel's `public` directory. Never expose `.env`, `vendor` internals, storage or the source workbook.
4. Create `.env` from `.env.example` with `APP_ENV=production`, `APP_DEBUG=false`, the final HTTPS URL, MySQL credentials, `DB_ENGINE=InnoDB`, SMTP settings and secure session settings.
5. Run `composer install --no-dev --optimize-autoloader` and deploy the already-built frontend or run `npm ci && npm run build`.
6. Run `php artisan migrate --force`, then `php artisan config:cache`, `route:cache`, `view:cache` and `storage:link` if public uploads are introduced.
7. Validate and import the workbook from a private server path. Remove it from the host after the controlled import and backup.
8. Do not add cron or a persistent queue worker for the current release. IPinfo country enrichment uses Laravel's post-response `deferred` connection and does not depend on a worker. If scheduling is added later, Namecheap Shared Hosting requires at least a five-minute interval. Confirm the account's PHP CLI path first.
9. Smoke-test registration, verification, password reset, one unclaimed scan, one active redirect, customer/admin authorization and CSV export.
10. Smoke-test the canonical `https://app.shiftrix.io/?id=CODE_ID` entry after staging acceptance. Do not change Cloudflare, Shopify, or DNS for NFC routing.

Use `QUEUE_CONNECTION=sync` for the current staging release; IPinfo enrichment explicitly selects the built-in `deferred` connection. Configure `IPINFO_LITE_TOKEN` and `IPINFO_LITE_ENABLED=true` as described in `docs/IPINFO-LITE-COUNTRY-GEOLOCATION.md`. Rotate application, database and mail credentials after handover.

## Namecheap compatibility

Namecheap currently documents PHP 8.0–8.5, MariaDB 11.4, MySQLi, Git, SSH (enabled from cPanel), Composer installation over SSH, mod_rewrite, SSL and cPanel cron. MariaDB includes InnoDB as its default transactional storage engine, and the application explicitly requests InnoDB for MySQL and MariaDB connections. This satisfies Laravel 12's PHP 8.2 baseline and this application's database requirements. Shared Hosting prohibits cron intervals shorter than five minutes and more than five simultaneous cron jobs, so Laravel's conventional one-minute scheduler entry must not be used there.

Before upload, run `php deployment/staging/check-hosting.php` through the selected CLI PHP binary. The 31,500-row import passes locally at 256 MB and fails at 128 MB, so 256 MB is a hard minimum and 512 MB is recommended. Hosting-account access is still needed to verify the account-specific settings.

Official hosting references checked for this audit:

- [Namecheap server software versions](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/)
- [Namecheap cron-job limits](https://www.namecheap.com/support/knowledgebase/article.aspx/1212/22/do-you-allow-cron-jobs/)
- [Composer on Namecheap shared servers](https://www.namecheap.com/support/knowledgebase/article.aspx/9977/29/how-to-install-composer-on-shared-servers/)
- [Changing PHP and extensions in cPanel](https://www.namecheap.com/support/knowledgebase/article.aspx/9417/2219/how-to-change-php-version-and-update-php-extensions-on-shared-servers/)

## Safe staging sequence

1. Create `staging-app.shiftrix.io` in Namecheap with a separate database and document root pointing to `public/`. Do not change `shiftrix.io` DNS or Shopify.
2. Deploy the reviewed commit, configure `APP_ENV=staging`, `APP_DEBUG=false`, the staging `APP_URL`, `SHIFTRIX_NFC_BASE_URL`, optional `SHIFTRIX_TUTORIAL_VIDEO_URL`, staging SMTP, a unique `APP_KEY`, `SESSION_SECURE_COOKIE=true`, and `SESSION_ENCRYPT=true`.
3. Run migrations, caches, the dry-run inventory validation, and then a staging-only import. Never upload the XLSX beneath a public document root.
4. Smoke-test Shiftrix Track directly at `/?id=CODE_ID` for unactivated, active, paused, unconfigured and unknown products.
5. Confirm the legacy `/configuration?id=CODE_ID` route returns a 301 to the canonical root URL without recording a duplicate scan.
6. Obtain sign-off and a rollback window before applying the NFC URL data migration. Do not modify Cloudflare, Shopify or DNS.

The complete cPanel action list and exact commands are in `docs/NAMECHEAP-STAGING-CHECKLIST.md`.

The canonical application-hosted NFC route is documented in `docs/NFC-CANONICAL-URL-MIGRATION.md`.
