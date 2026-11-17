# SHIFTRIX Namecheap staging checklist

Prepare the archive from the verified `main` commit and record its commit hash beside the uploaded file. This checklist does not authorize changes to Shopify, apex DNS, Cloudflare routes, or production files.

## 1. Compatibility gate — user actions in cPanel

Do not upload or deploy until every item below is confirmed.

- [ ] **cPanel → General Information:** record the hosting plan, cPanel username, server hostname and home-directory path. Do not send passwords.
- [ ] **cPanel → Domains:** identify an existing staging hostname, or confirm that a new staging subdomain may be created. Its document root must be a dedicated path ending in `/public`, for example `/home/CPANELUSER/shiftrix-staging/public`. Do not share the Shopify document root.
- [ ] **cPanel → Select PHP Version / PHP Tweaks:** select 64-bit PHP 8.2–8.4. PHP 8.2.4 is the locally tested version.
- [ ] Enable `ctype`, `curl`, `dom`, `fileinfo`, `filter`, `gd`, `hash`, `iconv`, `json`, `libxml`, `mbstring`, `openssl`, `pcre`, `pdo`, `pdo_mysql`, `phar`, `session`, `simplexml`, `tokenizer`, `xml`, `xmlreader`, `xmlwriter`, `zip`, and `zlib`.
- [ ] Set `memory_limit` to at least `256M`; `512M` is recommended for the 31,500-row XLSX import. Set `max_execution_time` to at least `300` for web diagnostics, although the import will run through CLI.
- [ ] **cPanel → Manage Shell:** enable SSH. Record the server hostname and confirm port `21098` for Namecheap Shared Hosting.
- [ ] In Terminal, record the CLI PHP command with `command -v php` and `php -v`; confirm it is the same PHP family selected for the staging domain.
- [ ] Confirm Composer 2 with `composer --version`. If absent, install it in the account using Namecheap's documented per-user procedure.
- [ ] **cPanel → MySQL Databases:** create a staging-only database and user, attach the user with all privileges, and record the cPanel-prefixed names. Use `127.0.0.1:3306`; remote MySQL is unnecessary.
- [ ] **cPanel → Namecheap SSL / SSL Status:** confirm a valid certificate and HTTPS redirect for the staging hostname. Secure session cookies mean browser testing must use HTTPS.
- [ ] Confirm SMTP host, port, encryption, username and a staging sender address. Registration verification, password recovery and team invitations require working email.
- [ ] Confirm the selected document root is configurable. If cPanel cannot point it at Laravel's `public` directory while keeping the rest of the application outside the public root, stop and contact Namecheap support.

Run the non-public preflight through SSH after extraction:

```bash
cd /home/CPANELUSER/shiftrix-staging
php deployment/staging/check-hosting.php
```

Expected result: `PASS`. A failure is a deployment blocker.

## 2. Package and destination

The prepared source package includes the production frontend build but excludes `.env`, `vendor`, `node_modules`, the XLSX workbook, local databases, credentials and logs. Verify its checksum locally before upload:

```bash
shasum -a 256 -c artifacts/shiftrix-staging-<COMMIT>.tar.gz.sha256
```

Upload and extract it into `/home/CPANELUSER/shiftrix-staging`, not directly into a shared `public_html` or Shopify directory. The staging domain document root must resolve to `/home/CPANELUSER/shiftrix-staging/public`.

## 3. Staging configuration

```bash
cd /home/CPANELUSER/shiftrix-staging
cp deployment/staging/.env.staging.example .env
chmod 600 .env
```

Edit `.env` and replace every placeholder. Use the HTTPS staging origin for `APP_URL`. Leave `SHIFTRIX_EDGE_SECRET` empty while testing directly on the Namecheap staging hostname; when configured, it protects the `/configuration` scan endpoint only. Use `QUEUE_CONNECTION=sync` for this release.

Then install production dependencies and generate a unique staging key:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
php artisan key:generate --force
php artisan optimize:clear
php artisan about
```

Never copy the local or production `APP_KEY`, database password, SMTP password or edge secret into chat, Git, the package, or a public directory.

## 4. Database and migration

Confirm `.env` points only to the new empty staging database, then run:

```bash
php artisan migrate:status
php artisan migrate --force
php artisan migrate:status
```

Do not run `php artisan db:seed`; the development seeder creates a test account. Register the staging owner normally through the browser after SMTP is working. If administrative access is required, elevate that registered address through an audited SSH/Tinker step after registration.

## 5. Inventory validation and import

Upload the approved workbook to a private location such as `/home/CPANELUSER/private/shiftrix-inventory.xlsx`. It must never be under the staging document root.

Validate without database writes:

```bash
php -d memory_limit=512M artisan shiftrix:inventory:import /home/CPANELUSER/private/shiftrix-inventory.xlsx --dry-run
```

Expected totals: 31,500 rows and unique IDs, 31,500 unique URLs, 75 batches, 30,000 commercial and 1,500 backup units. Only after reviewing that output, import once:

```bash
php -d memory_limit=512M artisan shiftrix:inventory:import /home/CPANELUSER/private/shiftrix-inventory.xlsx
```

The import is transactional and checksum-protected. Do not retry blindly after an error; inspect the database and application log first. Remove the server copy of the workbook after the import and an encrypted backup are confirmed.

## 6. Cache, permissions and staging smoke test

```bash
chmod -R u+rwX storage bootstrap/cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan about
```

No `storage:link` is required for the current release because there are no public uploads. Verify `/up`, `/?id=CODE_ID`, EN/FR switching, registration, email verification, login/logout, password recovery, one unclaimed tutorial redirect, activation, a subsequent Google Review `302`, scan charts, CSV export and admin authorization.

The application currently has no scheduled tasks and no queued jobs. Do not create a cron entry or persistent queue worker for this release. If scheduling is introduced later, Namecheap Shared Hosting permits no interval shorter than five minutes and no more than five simultaneous cron jobs.

## 7. Stop conditions

Stop before deployment if the staging hostname is not confirmed, SSL is not valid, PHP CLI is below 8.2, `pdo_mysql` or an XLSX extension is missing, memory is below 256 MB, Composer cannot install the lockfile, the document root cannot target `public`, SMTP is unavailable, or the database is not demonstrably staging-only.

No Shopify, apex DNS, Cloudflare route or production-file change belongs in this staging procedure.

## Official Namecheap references

- [Current shared-server software versions](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/)
- [PHP versions, extensions and limits](https://www.namecheap.com/support/knowledgebase/article.aspx/9697/2219/php-modules-limits-and-extensions-on-shared-hosting-servers/)
- [Changing PHP and extensions in cPanel](https://www.namecheap.com/support/knowledgebase/article.aspx/9417/2219/how-to-change-php-version-and-update-php-extensions-on-shared-servers/)
- [Enabling SSH in cPanel](https://www.namecheap.com/support/knowledgebase/article.aspx/10040/2210/how-to-enable-ssh-shell-in-cpanel/)
- [Installing Composer on shared hosting](https://www.namecheap.com/support/knowledgebase/article.aspx/9977/29/how-to-install-composer-on-shared-servers/)
- [Shared-hosting cron restrictions](https://www.namecheap.com/support/knowledgebase/article.aspx/9453/29/how-to-run-scripts-via-cron-jobs/)
- [Creating domains and selecting a document root](https://www.namecheap.com/support/knowledgebase/article.aspx/10125/29/how-to-manage-domains-in-cpanel/)
- [Namecheap SSL for domains and subdomains](https://www.namecheap.com/support/knowledgebase/article.aspx/9387/2218/what-is-namecheap-ssl-and-how-do-i-use-it/)
