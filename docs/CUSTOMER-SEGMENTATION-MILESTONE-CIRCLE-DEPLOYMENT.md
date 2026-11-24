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

## Milestone policy status

The client-proposed question, “Loving how it looks at your counter?”, was not used because it presupposes a positive experience and could bias the request. The application instead uses neutral wording that asks for an honest short video, says the feedback can reflect any experience, and includes no reward, discount, affiliate link, order link, sentiment filter, or SHIFTRIX Circle reference.

The feature remains disabled by default. Before setting `SHIFTRIX_SCAN_MILESTONE_ENABLED=true`, the client must identify the marketplace or store where the request will appear and obtain written confirmation that the exact English and French wording, video request, timing, and destination comply with that marketplace's current review and user-generated-content policies. No production activation is included in this release.

## External SHIFTRIX Circle setup

The Track application is provider-independent. It does not include UpPromote, Tapfiliate, FirstPromoter, another affiliate SDK, commission calculations, tracking cookies, webhooks, or provider credentials.

The application destination is exactly `https://circle.shiftrix.io`, without an email address, customer identifier, or other query parameter. As checked on 24 November 2026, public DNS returns `NXDOMAIN` for both CNAME and A lookups, so the external integration and HTTPS are not complete.

[UpPromote's current custom-domain documentation](https://docs.uppromote.com/management/home/custom-domain) says the feature is available on its Professional plan or above. It currently instructs merchants to create a CNAME for the chosen subdomain pointing to `af-partners.uppromote.com`, then submit the custom domain in the UpPromote Home > Custom domain workflow. Treat the provider's authenticated setup screen as authoritative and re-confirm its displayed target before making any DNS change.

Before opening enrollment, the client must provide:

1. Authorized access to the correct UpPromote merchant account on a plan that includes Custom domain, or a screen share with an authorized merchant administrator.
2. The approved Circle program, registration form, terms, commission rules, eligibility, payout, privacy, tax, and support information configured in that account.
3. Authorized Namecheap DNS access limited to the `shiftrix.io` zone, or an operator who can create the provider-verified `circle` CNAME after confirming the target in UpPromote.
4. Approval for the DNS change and a maintenance/test window. This repository work does not authorize or perform that change.

Completion sequence:

1. Re-confirm the custom-domain target shown in the authorized UpPromote account.
2. Create only the verified `circle` CNAME with the provider-approved TTL; do not alter apex, mail, Shopify, application, or other DNS records.
3. Add `circle.shiftrix.io` in UpPromote's Custom domain workflow and wait for provider validation and certificate issuance.
4. Verify public CNAME resolution, open `https://circle.shiftrix.io`, confirm a valid certificate and successful HTTPS response, then test registration, login, referral attribution, and logout.
5. Confirm the destination does not require email addresses or other customer data in query parameters. The Track application sends no customer email or identifier.
6. Test enrollment and attribution directly on the Circle service. Track does not claim or guarantee commission rates or earnings.

The Circle page and link remain completely separate from the genuine-scan feedback milestone. Enabling one does not enable, link to, or configure the other.

## Manual release checks

1. Register one Business / Team account and one Individual / Creator account in both English and French.
2. Confirm an existing account with a null account type can still sign in and select a type in Profile settings.
3. Keep the milestone disabled and confirm no feedback notification appears at or above 10 genuine scans.
4. In a compliance-approved non-production environment, enable the milestone, confirm bot and blocked scans do not count, then dismiss it and verify it remains hidden in another session.
5. Open the Circle page on desktop and mobile, verify the sidebar item, and confirm the Join button opens exactly the configured HTTPS URL without customer data.
