# SHIFTRIX validation and architecture report

Validation date: 16 November 2026. The original XLSX was read only and was not modified.

## Workbook structure

| Worksheet | Data rows | Columns |
|---|---:|---|
| `1_LES_31500_LIENS_COMPLETS` | 31,500 | N°_Ligne, Lot_Vague, Compteur_Lot_400_Pieces, Compteur_Global_30000_Pieces, Variante, Code_ID_Imprime, Lien_NFC_et_QR_Complet, Type_Unite |
| `2_TABLEAU_DES_75_LOTS` | 75 | Lot, Lignes_dans_Fichier, Pieces_Vente_du_Lot, Liens_Secours_du_Lot, Total_Liens_du_Lot, Cumul_Pieces_Vente, Cumul_Total_Liens, Card/Plate/Stand stock and backup totals |
| `3_CARTES_10500_LIENS` | 10,500 | Same eight identifier columns as the master sheet |
| `4_PLAQUES_10500_LIENS` | 10,500 | Same eight identifier columns as the master sheet |
| `5_CHEVALETS_10500_LIENS` | 10,500 | Same eight identifier columns as the master sheet |

## Validation result

| Check | Expected | Verified |
|---|---:|---:|
| Unique product IDs | 31,500 | 31,500 |
| Unique activation URLs | 31,500 | 31,500 |
| Manufacturing batches | 75 | 75 |
| Units per batch | 420 | 420 in every batch |
| Commercial units | 30,000 | 30,000 |
| Backup units | 1,500 | 1,500 |
| CARD | 10,500 | 10,050 commercial + 450 backup |
| PLATE | 10,500 | 9,975 commercial + 525 backup |
| STAND | 10,500 | 9,975 commercial + 525 backup |

Every approved replacement URL is exactly `https://app.shiftrix.io/?id=CODE_ID`. No duplicate IDs, duplicate URLs, missing values, malformed codes, invalid unit allocations, incorrect batch assignments or count discrepancies were detected. Each batch contains 134+6 CARD, 133+7 PLATE and 133+7 STAND units.

## Database design

- `users`: authentication, verification, administrator flag and last login.
- `customers`: business account, account status, block metadata and product limit.
- `customer_memberships`: many-to-many user/customer ownership with owner or manager role.
- `inventory_imports`: source checksum, counts, validation report and import audit fields.
- `batches`: unique LOT 01–75 metadata linked to its import.
- `products`: immutable unique code, variant, sequence, unit type, batch position, customer, state and review destination.
- `activations`: append-only claim/reset ownership history.
- `review_link_histories`: append-only review destination changes.
- `scan_events`: append-only UUID event, result, product/customer, HMAC IP hash, user-agent hash, bot flag and timestamp.
- `product_daily_stats`: optional pre-aggregated statistics for long-term scale.
- `team_invitations`: hashed, expiring invitation tokens.
- `audit_logs`: administrator/security audit subjects and metadata.
- `system_settings`: controlled operational configuration.

Unique indexes enforce code IDs, variant sequences, source lines, batch positions, import checksums and invitation tokens. Scan indexes support product, customer, date and result queries. Activation uses a database transaction with a row lock, preventing concurrent double claims.

## Application flow

1. The unchanged `/configuration?id=CODE_ID` scan URL validates the format and retrieves one indexed product.
2. An active product with an active customer records one scan and returns a 302 to the validated HTTPS Google destination.
3. An unclaimed product records one scan and returns a 302 to `https://shiftrix.io/pages/how-to-configure?id=CODE_ID`.
4. The bilingual application tutorial preserves the identifier and original query parameters in its `/activate?id=CODE_ID` button.
5. Shiftrix Track validates the ID against inventory without recording another scan and preserves it through registration, login and email verification.
6. Claiming locks the row, verifies ownership limits, creates history and activates exactly once.
7. Explicitly disabled products fail closed without exposing the destination. Disabling a customer account restricts dashboard authentication only; already activated physical products continue to redirect and record eligible scans.

Raw IP addresses are not stored. Probable bots are retained for auditability but excluded from customer counts.

## Development and delivery plan

1. Foundation: schema, importer, constraints, roles and authentication.
2. Activation: public scan endpoint, URL validation, atomic claim and direct redirect.
3. Customer experience: products, link history, dashboard metrics and CSV.
4. Administration: inventory/customer search, blocks, limits and resets.
5. Collaboration/security: team invitations, authorization, audit data and rate limits.
6. Release: automated tests, production build, staging acceptance, routing integration, deployment, monitoring and handover.

## Routing and deployment dependency

The approved NFC URL now points directly at the Laravel application: `https://app.shiftrix.io/?id=CODE_ID`. Root routing owns the complete flow, so no Shopify app proxy, Shopify redirect, Cloudflare Worker route, apex-domain DNS change, or edge shared secret is required for NFC routing. The old `/configuration` endpoint remains only as a 301 compatibility redirect to the canonical root URL and does not count a scan itself.

Production hosting access remains required to verify PHP 8.2+, MySQL, Composer/SSH, cron, mail transport, SSL, document-root controls and queue strategy. No production settings were changed.

Routing references: [Shopify app proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies) and [Cloudflare Worker routes](https://developers.cloudflare.com/workers/configuration/routing/routes/).
