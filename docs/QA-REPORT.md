# SHIFTRIX updated journey QA report

Audit date: 17 November 2026. Production, Shopify, Namecheap, Cloudflare and DNS were not changed.

## Results

| Area | Result | Evidence |
|---|---|---|
| PHP regression suite | PASS | 47 tests / 272 assertions |
| Production frontend | PASS | Vite optimized build completed |
| PHP formatting | PASS | Laravel Pint check completed with no changes required |
| Dependencies | PASS | Composer audit and production npm audit report no known advisories |
| Edge Worker | PASS | 2 Node tests; only `/configuration` is proxied and Shopify/app paths are rejected |
| Unactivated scan | PASS | Exact 302 to `https://shiftrix.io/pages/how-to-configure?id=CODE_ID`; one scan event per request |
| Activated scan | PASS | Exact direct 302 to the validated Google Review URL; one scan event per request |
| Product recognition | PASS | CARD, PLATE and STAND are resolved only from validated inventory records and render the matching supplied image |
| ID continuity | PASS | Query ID is retained across login, registration and email verification and returned to Shiftrix Track |
| Activation | PASS | Verified customers can save business name and an allowlisted Google Review URL; activation is transactionally locked |
| Localization | PASS | EN/FR switch persists in session and user preference; auth, activation, customer/admin screens, navigation, validation and framework emails are translated |
| Customer/team/admin regression | PASS | Existing role boundaries, blocking, product limits, resets, charts and CSV behavior remain covered |
| Responsive rendering | PASS with observation | Headless Chrome at a true 390 x 844 CSS viewport reported `scrollWidth=390`; CARD page and FR switch were rendered. Physical iPhone/Android acceptance remains a staging task |
| Shopify section | PASS locally | Liquid section contains bilingual tutorial copy, video placeholder and an ID-preserving Track button; no live upload occurred |
| Staging package | PASS | Reproducible package builder excludes secrets, workbook, local databases, logs, `vendor` and `node_modules` |

## Browser checks

The rendered local Laravel/Inertia application was exercised in Chrome, not only through PHPUnit. The browser resolved `CARD-00001`, populated its identifier automatically, displayed the CARD asset, switched from English to French without losing the identifier, and rendered at a 390px mobile viewport without horizontal overflow. Chrome's visible-control bridge failed to bind a tab during this run, so the fallback used Chrome headless plus DevTools Protocol; physical-device and visible-browser acceptance is deliberately left for staging.

## Security and routing checks

- `/configuration` is the only apex path intended for the edge origin. Root, login, assets and Shopify paths are not accepted by the Worker.
- Optional `SHIFTRIX_EDGE_SECRET` enforcement applies only to `/configuration`; it cannot lock users out of `app.shiftrix.io`.
- Google destinations remain restricted to approved HTTPS Google hosts and unsafe redirect targets fail validation.
- CSRF protection, verified-email activation, policy authorization, customer scoping, hashed passwords/invitation tokens and hashed scan IPs remain intact.
- No `.env`, credential, workbook, private source asset or local database is included in Git or the staging archive.

## Remaining acceptance items

- The additional email materials have not been received. Final tutorial video, captions/transcript, exact Shopify theme/template target and approved final EN/FR tutorial copy are still required.
- Business name and account/contact email are supported. Address, phone, logo or other business-profile fields require the missing client specification before schema expansion.
- Legal entity, contact and retention text must be supplied before publishing the legal pages.
- Namecheap account access is required to confirm the purchased plan, PHP CLI/extensions, document-root control, SMTP, SSL and resource limits.
- Final staging acceptance must use real NFC/QR devices, working email delivery and representative iPhone/Android browsers.
