# SHIFTRIX Track final QA and release runbook

Date reviewed: 2026-11-21

## Release decision

The application is prepared for a reviewed commit and a staging deployment after the automated checks in this document pass. This is not authorization for production deployment, Shopify publication, DNS changes, or Cloudflare route activation.

The Cloudflare NFC route remains a prepared local change. It must not be described as operational until the Worker has been deployed with the required secret and the production route has passed the post-deployment tests below.

## Final verification results

- Laravel: 96 tests passed, 879 assertions.
- Cloudflare Worker: 6 tests passed.
- Shopify tutorial CTA: 3 tests passed.
- Product QR generation: 1 test passed.
- Frontend production build: passed (Vite transformed 1,098 modules).
- Pint: passed.
- EN/FR audit: 383 statically referenced UI keys present in both locales; 435 entries in each locale; no locale-only keys.
- React named-route audit: all 51 referenced route names exist.
- Migration cycle: isolated fresh migration, rollback of all three new migrations, and reapplication passed.
- `git diff --check`: passed.

The Vite build reports a non-blocking large-chunk warning for the ApexCharts-based chart bundle. This is a performance optimization opportunity, not a build or functional failure.

## Visual QA findings

- Desktop uses the fixed navy sidebar, official SHIFTRIX Track branding, gold active states, consistent cards, charts, forms, tables, and empty states.
- Mobile uses the compact header and slide-out navigation. Header spacing was tightened to prevent narrow-screen clipping.
- Settings tabs use a two-column mobile grid so Profile, Security, Team/Managers, and Privacy remain discoverable without hidden horizontal overflow.
- Existing desktop/mobile captures are retained in `artifacts/`, including admin overview, dashboard, My Products, Statistics, Settings, Help, activation, and homepage views.

## Data-safety findings

- The three release migrations are additive. They do not update product identifiers, NFC URLs, ownership, inventory rows, or historical scans.
- Product ownership is enforced by the existing customer relationship and authorization policy on every product read/write path.
- Blocking a customer prevents dashboard access but does not disable an otherwise active product's public NFC redirect.
- Bot exclusion and duplicate-scan eligibility remain in the existing scan recorder. Optional device/country metadata collection does not change those decisions.
- Historical device, country, and NFC/QR source data are not fabricated. Missing metadata is reported as unknown/unavailable.
- Privacy deletion creates an administrative review request; it does not hard-delete users, products, NFC identifiers, inventory, or scan history.

## Migration order

Run exactly in filename order:

1. `2026_11_21_000001_add_product_labels_and_scan_metadata.php`
2. `2026_11_21_000002_add_customer_account_management.php`
3. `2026_11_21_000003_add_admin_console_fields.php`

Never run `migrate:fresh`, `migrate:refresh`, seeders, inventory imports, or a production migration rollback during this release.

## Namecheap shared-hosting deployment

1. Obtain the client's approval for the reviewed commit and staging release.
2. Put the application in maintenance mode and record the currently deployed release identifier.
3. Create and verify a complete MySQL backup. Also archive the current application files, `.env`, public entry point, and `storage` contents.
4. Upload the release archive to a new versioned directory; do not overwrite the live directory in place.
5. Preserve the production `.env`, storage, inventory assets, `.well-known`, and hosting-specific files. Do not copy local credentials.
6. Point `storage` to persistent storage and confirm writable `storage` and `bootstrap/cache` directories.
7. Install production PHP dependencies with the hosting-supported PHP binary: `composer install --no-dev --optimize-autoloader`.
8. Confirm `php artisan migrate:status`, run `php artisan migrate --force`, then confirm `php artisan migrate:status` again.
9. Build frontend assets before packaging, or install/build on the host only if the hosting plan reliably supports the required Node version. Confirm `public/build/manifest.json` exists.
10. Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache`.
11. Switch the live symlink/directory atomically where supported, bring the application up, and immediately execute the smoke tests.

The concrete host command sequence and Cloudflare variables are documented in `docs/SHOPIFY-CLOUDFLARE-PRODUCTION.md`.

## Post-deployment smoke tests

- Public homepage renders at desktop and mobile widths and the footer remains at the viewport bottom on short pages.
- Customer and admin login work; a disabled customer cannot enter the dashboard.
- Customer dashboard KPIs load and use the correct workspace.
- My Products lists only owned products; rename and Google Review URL validation work; copied NFC URL remains byte-for-byte unchanged; downloaded QR resolves to that same URL.
- Statistics totals, 7/30/90-day filters, timezone, empty states, and CSV export agree for a known test customer.
- Profile update and password change work; session details reveal no token; revoking other sessions requires the current password.
- Manager invitation, acceptance, workspace switching, revocation, and cross-customer denial work.
- Privacy export requires confirmation; deletion creates a review request without deleting records.
- Admin customer, inventory, range assignment, CSV export, activity, settings, and account-disable controls work.
- Existing activated NFC redirects still reach the configured Google Review destination and an eligible real scan is recorded once.
- Invalid product IDs fail safely.
- Shopify home, product, cart, and unrelated `/configuration-*` URLs remain unchanged.

## Cloudflare/Shopify activation gate

Do this only under separate client approval:

1. Configure the same strong `SHIFTRIX_EDGE_SECRET` value in the Worker secret store and the Laravel production environment.
2. Configure `SAAS_ORIGIN=https://app.shiftrix.io` and an optional non-sensitive `ORIGIN_HOST` only as documented.
3. Grant the deployer Worker Scripts edit and route edit access limited to the relevant zone; zone read is also required for route management. Do not grant account-wide DNS editing.
4. Deploy the Worker and bind only `shiftrix.io/configuration*`. The Worker itself permits only GET/HEAD and exact `/configuration` or `/configuration/`; every other path is fetched from Shopify unchanged.
5. Publish only the reviewed tutorial CTA change. Preserve the original tutorial video, typography, and all other sections.
6. Test unactivated, activated, invalid, missing-ID, trailing-slash, query-string, and unrelated Shopify paths using non-customer test records.
7. Confirm the tutorial CTA returns to `https://app.shiftrix.io/?id=<original-id>` with the original ID preserved.

## Rollback

### Application rollback

1. Put the application in maintenance mode.
2. Switch the live directory/symlink back to the recorded prior release.
3. Restore its production dependencies/build artifacts if releases do not contain them.
4. Clear and rebuild the Laravel caches using the prior release.
5. Bring the application up and rerun the core smoke tests.

Leave the three additive migrations applied during a normal code rollback. Their nullable/defaulted schema is compatible with the prior application. Do not run `php artisan migrate:rollback` in production. Restore the verified database backup only when a database-level rollback is explicitly approved and necessary.

### Cloudflare rollback

Remove or disable only the `shiftrix.io/configuration*` Worker route, leaving the Worker code available for diagnosis. Shopify then resumes handling that path as it did before activation. Do not alter DNS. Verify unrelated storefront pages and document the rollback time.

### Shopify rollback

Restore the prior reviewed theme version/section from Shopify theme history. Do not replace the original tutorial video or unrelated sections. Verify that the storefront and checkout are unaffected.

## Known release limitations

- Production NFC routing cannot be confirmed until the separately approved Cloudflare activation and live tests occur.
- Historical analytics lacking trustworthy device/country metadata remains unknown/unavailable; scan source is not inferred.
- WhatsApp support remains a configurable destination and shows a safe fallback until the client supplies a number.
- A production database backup, hosting credentials, and a maintenance window are operator prerequisites, not repository artifacts.
