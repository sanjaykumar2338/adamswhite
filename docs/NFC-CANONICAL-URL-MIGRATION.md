# SHIFTRIX canonical NFC URL migration

Approved 23 November 2026. Canonical format:

```text
https://app.shiftrix.io/?id=EXISTING_PRODUCT_ID
```

This replaces the unencoded factory URLs. It does not authorize or require Namecheap DNS, Shopify, or Cloudflare changes.

## What changed

- `products.nfc_url` is an additive, nullable, unique column. The model falls back to the canonical URL until the data migration is applied.
- `shiftrix:nfc-urls` is dry-run only by default. `--apply` creates a CSV backup and SHA-256 checksum before writing. `--rollback` verifies both files and immutable product fields before restoring the prior URL values.
- QR downloads and factory CSV exports use `product.nfc_url`, so both now encode/export the canonical URL.
- `/?id=CODE_ID` handles the scan. Unactivated products see the bilingual tutorial and continue to `/activate` with the full query string. Active configured products redirect to Google Reviews and use the existing eligible-scan/bot filtering. Paused, disabled, unconfigured, malformed and unknown products fail safely.
- `/configuration` is retained only as a 301 compatibility redirect and does not record a scan.

## Production procedure

Do not apply production data changes without a confirmed maintenance window and explicit approval.

1. Record the release commit, application version, database host/schema, current product count, scan count and activation count.
2. Create a full database backup using the hosting provider's supported MySQL backup method. Store it outside the public web root. Verify that the file is non-empty, record its SHA-256 hash and perform a restore rehearsal into an isolated database where practical.
3. Deploy the reviewed application code without changing `.env`, DNS, Shopify or Cloudflare. Run the additive schema migration.
4. Run the non-mutating audit:

   ```bash
   php artisan shiftrix:nfc-urls --expected-count=31500
   ```

   Require: 31,500 products, 31,500 unique IDs, 31,500 unique canonical URLs, no validation errors. Record the integrity fingerprint, scan count and activation count.
5. Apply only after reviewing the dry-run and verified full backup:

   ```bash
   php artisan shiftrix:nfc-urls --apply --expected-count=31500 --backup-dir=/ABSOLUTE/PRIVATE/BACKUP/DIRECTORY
   ```

   Preserve the emitted CSV path and SHA-256. The command fails rather than writing when counts or identifiers are invalid.
6. Run the dry-run again. Require `urls_to_change = 0`; the product integrity fingerprint, scan count and activation count must equal the pre-change values.
7. Confirm directly in the database that `COUNT(*) = 31500`, `COUNT(DISTINCT code_id) = 31500`, `COUNT(DISTINCT nfc_url) = 31500`, and every URL is `https://app.shiftrix.io/?id=` plus its unchanged `code_id`.
8. Smoke-test controlled QA records for unactivated tutorial, activation handoff, authenticated login/registration preservation, active Google redirect, paused, active-unconfigured, malformed and unknown IDs. Confirm only eligible active GET scans enter customer statistics and HEAD probes do not count.

## Rollback

Application-level URL rollback uses the exact verified CSV created by `--apply`:

```bash
php artisan shiftrix:nfc-urls --rollback=/ABSOLUTE/PRIVATE/BACKUP/DIRECTORY/nfc-urls-before-TIMESTAMP.csv --expected-count=31500
```

The adjacent `.sha256` file is mandatory. Rollback aborts if the checksum, row count, product ID, type, batch, owner or status no longer matches. If any broader release validation fails, restore the verified full database backup under the hosting provider's standard recovery procedure. Do not use the schema migration's `down` method as an operational data rollback because it removes the URL column.

## Factory workbook validation

The generated workbook is `outputs/shiftrix-nfc-migration/SHIFTRIX_Factory_31500_Canonical_NFC_URLs.xlsx`. It contains 31,500 data rows, 31,500 unique product IDs and 31,500 unique canonical URLs. Product type, batch and unit type are included. Generation rejects malformed IDs, duplicate IDs, duplicate URLs or URL/code mismatches before export, then re-opens the final XLSX and verifies first, middle and last rows.

## Loom recording plan

No Loom video has been recorded or supplied.

1. Open an unactivated canonical QA URL and show the recognized product ID, English instructions, video area and Continue button.
2. Switch to French and show the translated tutorial at mobile width.
3. Continue to activation, register or log in, and demonstrate that the same product ID remains selected through email verification and activation.
4. Scan the activated product and show the direct Google Reviews redirect.
5. Show paused, unconfigured and unknown examples failing safely without exposing internal data.
6. In the dashboard, show that only eligible human-like active scans are counted and that QR download encodes the canonical URL.
7. Keep customer names, emails, IP-derived data, secrets and real production credentials out of the recording.

Once an approved HTTPS video URL is supplied, set `SHIFTRIX_TUTORIAL_VIDEO_URL`. Direct `.mp4`/`.webm` URLs use the native video player; other approved HTTPS embed URLs use the responsive embed area. Clear and rebuild Laravel configuration cache after changing the production value.

## Current status

Implementation and validation are local only. No production database migration, application deployment, DNS change, Shopify change or Cloudflare change has been performed. Production backup verification and live smoke tests remain manual approval-gated work.
