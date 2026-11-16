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
8. Add cron: `* * * * * cd /path/to/app && php artisan schedule:run >/dev/null 2>&1`.
9. Smoke-test registration, verification, password reset, one unclaimed scan, one active redirect, customer/admin authorization and CSV export.
10. Configure the apex `/configuration` route at Shopify/edge only after staging acceptance, then monitor HTTP failures and redirect latency.

Use a database-backed queue synchronously on restrictive shared hosting or configure a supervised worker where cPanel permits it. Rotate application, database and mail credentials after handover.
