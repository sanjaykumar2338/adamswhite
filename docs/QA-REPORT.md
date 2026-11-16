# SHIFTRIX local QA and production-readiness report

Audit date: 16 November 2026. Production, Shopify, DNS and Namecheap files were not changed.

## Results

| Area | Result | Evidence |
|---|---|---|
| PHP tests | PASS | 42 tests / 166 assertions after QA fixes |
| Production frontend | PASS | Vite optimized build completed; browser console contained no errors |
| Registration/auth/recovery | PASS | Browser registration/login/verification screens plus feature tests for registration, login, logout, verification, reset and password confirmation |
| NFC activation | PASS | Browser activated an unclaimed inventory product; subsequent request returned exact 302 and incremented redirected scans once |
| Statistics | PASS | Browser showed 13 seven-day and 19 thirty-day scans; test verifies bots are excluded and chart series matches |
| Multiple products | PASS | Browser rendered CARD, PLATE and STAND for one customer with product imagery |
| Owner/manager security | PASS | Direct request tests prove manager link editing and deny team administration, admin access, reset, and cross-customer updates |
| Admin operations | PASS | Tests cover authorization, blocking behavior, product limits and reset history; inventory supports search, variant, status and batch filters |
| CSV | PASS | Streamed customer-scoped CSV verified with correct grouped count |
| Responsive UI | PASS with observation | Tailwind mobile breakpoints and responsive navigation are present; desktop browser and narrow-layout controls were inspected. Final physical iOS/Android acceptance remains a staging task |
| Branding/assets | PASS with observation | Official navy/gold direction and SHIFTRIX mark are reflected. Supplied FR/EN files are product-marketing mockups, not dashboard specifications |
| Security | PASS | CSRF web middleware, hashed passwords/invites/IPs, row-lock activation, policy authorization, strict Google HTTPS allowlist, no committed secrets, dependency audits clean |
| Namecheap platform | COMPATIBLE, account verification pending | Public documentation lists PHP 8.0–8.5, MariaDB 11.4, SSH/Composer, mod_rewrite, SSL and cron |
| Apex routing | DESIGN TEST PASS, live integration pending | Worker unit tests preserve query/body/302 and reject Shopify paths; live Cloudflare/Shopify staging cannot be completed without access/change approval |

## Defects fixed during QA

1. Product destination updates threw HTTP 500 because the base controller did not include Laravel's authorization trait. Fixed and regression-tested for own/cross-customer products.
2. A guest scanning an unclaimed product lost that product after login or registration. The intended configuration URL is now retained and tested.
3. The initial edge concept could have intercepted Shopify `/products/*`. All SaaS routes now live under `/saas`; the Worker has four narrowly scoped route families.
4. The previous deployment runbook used a one-minute cron interval, which Namecheap Shared Hosting disallows. It now specifies five minutes.
5. The Namecheap origin lacked optional edge-only enforcement. A shared-secret middleware now fails closed when configured.

## Remaining blockers

- Namecheap account access is required to confirm the purchased plan, enabled extensions, PHP CLI path, document-root control, SMTP and resource limits.
- Cloudflare zone access and an approved DNS migration window are required for the exact apex route. No live edge or Shopify change has been made.
- Legal entity/contact/retention text must be supplied before publishing legal pages.
- The SaaS interface is currently English. The FR/EN supplied assets are product mockups; client confirmation is required before adding full French dashboard localization.
- Final acceptance should include physical NFC devices and representative iPhone/Android browsers on the staging hostname.
