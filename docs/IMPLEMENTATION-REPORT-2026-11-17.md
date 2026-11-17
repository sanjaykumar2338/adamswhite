# SHIFTRIX implementation report — 17 November 2026

## Delivered journey

The original 31,500 identifiers and encoded NFC/QR URLs remain unchanged. `GET /configuration?id=CODE_ID` is still the scan entry point:

1. A valid unactivated item records one scan and returns a 302 to `https://shiftrix.io/pages/how-to-configure?id=CODE_ID`.
2. Shopify's future tutorial page explains configuration and links to `https://app.shiftrix.io/?id=CODE_ID`.
3. Shiftrix Track validates the identifier against inventory, recognizes CARD, PLATE or STAND, and displays the corresponding supplied product photo.
4. Authentication, registration and verification retain the pending identifier. A verified customer enters a business name and Google Review URL to activate the item.
5. Later scans record one scan and return a direct 302 to the configured Google Review URL.

The Track lookup itself never creates a scan event, preventing tutorial/app navigation from inflating scan statistics.

## Application changes

- Set `https://app.shiftrix.io` as the intended production application origin in the example configuration.
- Added automatic and manual product-ID lookup at the application root, plus compatibility redirects from the previous `/saas` URLs.
- Added inventory-backed variant recognition and optimized JPG copies of the supplied CARD, PLATE and STAND assets. Original source assets and workbook were not modified.
- Added business-name capture and retained the existing strict Google URL validation, row-lock activation and customer ownership controls.
- Added persistent English/French locale selection, a language switcher, localized validation/auth/password messages and localized Laravel verification/reset mail text.
- Translated customer, manager and admin navigation/pages, activation, authentication and legal placeholders.
- Narrowed the Cloudflare Worker example to the single `/configuration` route so Shopify owns every other `shiftrix.io` path.

## Shopify deliverable

`shopify/sections/shiftrix-how-to-configure.liquid` is an Online Store 2.0-compatible local section. It selects French or English from the Shopify request locale, provides a merchant-configurable video embed or placeholder, presents written steps, validates the query identifier and builds the ID-preserving Track link. It is not installed or published.

## Verification summary

- Laravel: 47 tests, 272 assertions.
- Worker: 2 tests passed.
- Vite production build: passed.
- Laravel Pint: passed.
- Composer validation/audit: passed with no known advisories.
- npm production dependency audit: passed with zero vulnerabilities.
- Browser: Chrome rendered inventory lookup, product image, automatic ID population, EN/FR switching and a 390px responsive viewport without horizontal overflow.

## Files for deployment preparation

- `docs/DEPLOYMENT.md`: architecture and safe release procedure.
- `docs/NAMECHEAP-STAGING-CHECKLIST.md`: cPanel actions and stop conditions.
- `deployment/staging/.env.staging.example`: non-secret staging template.
- `deployment/staging/check-hosting.php`: CLI compatibility preflight.
- `scripts/build-staging-package.sh`: reproducible archive/checksum builder.

## Blockers and client decisions

The additional materials mentioned by email were not available. Before final Shopify/staging acceptance, obtain the final tutorial video, accessible captions/transcript, approved EN/FR copy and exact theme/template placement. Confirm whether “business details” should grow beyond business name plus account/contact email; no unapproved address/phone/logo fields were invented. Legal text and production email/branding content also require client approval.

Namecheap staging remains gated on the hostname, dedicated Laravel `public` document root, PHP/extension preflight, database, SMTP and SSL confirmation. No live infrastructure was changed.
