# Customer segmentation, scan milestone, and SHIFTRIX Circle deployment

This release adds customer account segmentation, an optional genuine-scan feedback milestone, and the authenticated SHIFTRIX Circle information page. It does not change product identifiers, NFC or QR destinations, activation records, Google Reviews destinations, or scan eligibility rules.

## Production migration and cache commands

Run these commands from the deployed application release directory after the new code and committed `public/build` directory are present:

```bash
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

The additive migration makes `customers.account_type` nullable so existing accounts continue to work until an owner chooses a type in Profile settings. It also adds the nullable, customer-level milestone dismissal timestamp. No data backfill is required.

## Configuration variables

```dotenv
SHIFTRIX_SCAN_MILESTONE_ENABLED=false
SHIFTRIX_SCAN_MILESTONE_THRESHOLD=10
SHIFTRIX_CIRCLE_URL=https://circle.shiftrix.io
```

- Keep `SHIFTRIX_SCAN_MILESTONE_ENABLED=false` until marketplace compliance has explicitly approved the neutral feedback solicitation.
- `SHIFTRIX_SCAN_MILESTONE_THRESHOLD` must be a positive integer. The application safely clamps values below 1 to 1.
- `SHIFTRIX_CIRCLE_URL` must be an HTTPS URL. Invalid configuration falls back to `https://circle.shiftrix.io`.
- After changing environment values, run `php artisan config:cache` again.

## External SHIFTRIX Circle setup

The Track application is provider-independent. It does not include UpPromote, Tapfiliate, FirstPromoter, another affiliate SDK, commission calculations, tracking cookies, webhooks, or provider credentials.

Before opening enrollment, the team responsible for `circle.shiftrix.io` must:

1. Select and contract an affiliate or ambassador provider separately, if one is required.
2. Configure eligibility, application review, current commission terms, attribution, payout, privacy, tax, and program terms in that external system.
3. Publish the approved enrollment experience at `https://circle.shiftrix.io` and verify HTTPS.
4. Confirm the destination does not require email addresses or other customer data in query parameters. The Track application sends no customer email or identifier.
5. Test enrollment and attribution directly on the Circle service. Track does not claim or guarantee commission rates or earnings.

The Circle page and link remain completely separate from the genuine-scan feedback milestone. Enabling one does not enable, link to, or configure the other.

## Manual release checks

1. Register one Business / Team account and one Individual / Creator account in both English and French.
2. Confirm an existing account with a null account type can still sign in and select a type in Profile settings.
3. Keep the milestone disabled and confirm no feedback notification appears at or above 10 genuine scans.
4. In a compliance-approved non-production environment, enable the milestone, confirm bot and blocked scans do not count, then dismiss it and verify it remains hidden in another session.
5. Open the Circle page on desktop and mobile, verify the sidebar item, and confirm the Join button opens exactly the configured HTTPS URL without customer data.
