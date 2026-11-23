# SHIFTRIX SaaS

Laravel 12, React 18, Inertia and Tailwind application for activating SHIFTRIX NFC/QR products, redirecting scans to Google Reviews and reporting privacy-safe usage statistics.

## Included modules

- Secure registration, email verification, login and password recovery
- Complete English/French interface, validation and transactional-email localization
- Atomic one-time activation for CARD, PLATE and STAND products
- app-hosted tutorial for unactivated scans and immediate Google Reviews redirect after activation
- Product-aware Shiftrix Track activation at `app.shiftrix.io`, with manual ID entry and supplied product imagery
- Customer product dashboard, 7/30-day metrics, link editing and CSV export
- Owner/manager team roles with expiring email invitations
- Admin customer controls, inventory search, product reset and limits
- Idempotent, checksum-protected 31,500-row inventory importer

## Local setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

Validate the protected production workbook without changing the database:

```bash
php artisan shiftrix:inventory:import /secure/path/workbook.xlsx --dry-run
```

After reviewing the report, import once with the same command without `--dry-run`. The file checksum prevents accidental repeat imports.

## Quality checks

```bash
php artisan test
npm run build
./vendor/bin/pint --test
```

The approved NFC inventory source and generated factory workbook are deliberately ignored by Git because identifiers and factory data must not be published. The current canonical URL is `https://app.shiftrix.io/?id=CODE_ID`; the older Shopify/Cloudflare plan is retired. See [docs/NFC-CANONICAL-URL-MIGRATION.md](docs/NFC-CANONICAL-URL-MIGRATION.md), [docs/VALIDATION-AND-ARCHITECTURE.md](docs/VALIDATION-AND-ARCHITECTURE.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
