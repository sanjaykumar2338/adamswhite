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

Every URL is exactly `https://shiftrix.io/configuration?id=CODE_ID`. No duplicate IDs, duplicate URLs, missing values, malformed codes, invalid unit allocations, incorrect batch assignments or count discrepancies were detected. Each batch contains 134+6 CARD, 133+7 PLATE and 133+7 STAND units.

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

1. `/configuration?id=CODE_ID` validates the format and retrieves one indexed product.
2. An active product with an active customer immediately records the scan and returns a 302 redirect to the validated HTTPS Google destination.
3. An unclaimed product records the scan and displays login/activation; the product ID is server-controlled.
4. Claiming locks the row, verifies ownership limits, creates history and activates exactly once.
5. Disabled products or blocked customers fail closed without exposing the destination.

Raw IP addresses are not stored. Probable bots are retained for auditability but excluded from customer counts.

## Development and delivery plan

1. Foundation: schema, importer, constraints, roles and authentication.
2. Activation: public scan endpoint, URL validation, atomic claim and direct redirect.
3. Customer experience: products, link history, dashboard metrics and CSV.
4. Administration: inventory/customer search, blocks, limits and resets.
5. Collaboration/security: team invitations, authorization, audit data and rate limits.
6. Release: automated tests, production build, staging acceptance, routing integration, deployment, monitoring and handover.

## Routing and deployment dependency

The exact scanned URL is on the Shopify apex domain while Laravel is intended for Namecheap. Namecheap cannot serve that path merely by pointing a subdomain at it. Before launch, select and test one of: Shopify/app-proxy forwarding for `/configuration`, an edge reverse proxy such as Cloudflare routing only that path to Laravel, or moving the complete apex origin behind a proxy. A SaaS subdomain alone would require re-encoding every physical NFC/QR product and is therefore unsuitable.

Production hosting access remains required to verify PHP 8.2+, MySQL, Composer/SSH, cron, mail transport, SSL, document-root controls, queue strategy and the selected Shopify/edge route. No production settings were changed.
