# SHIFTRIX Track local release changed-file inventory

Generated from the local working tree on 2026-11-21. This inventory includes every tracked modification and every individual untracked file from Batches 1–4 and final QA. `M` means tracked and modified; `??` means untracked.

```text
 M .env.example
 M app/Http/Controllers/Admin/CustomerController.php
 M app/Http/Controllers/Admin/DashboardController.php
 M app/Http/Controllers/Admin/ProductController.php
 M app/Http/Controllers/Admin/SettingsController.php
 M app/Http/Controllers/Auth/PasswordController.php
 M app/Http/Controllers/ConfigurationController.php
 M app/Http/Controllers/DashboardController.php
 M app/Http/Controllers/InvitationController.php
 M app/Http/Controllers/ProductController.php
 M app/Http/Controllers/ProfileController.php
 M app/Http/Controllers/StatisticsExportController.php
 M app/Http/Controllers/TeamController.php
 M app/Http/Middleware/HandleInertiaRequests.php
 M app/Http/Requests/Auth/LoginRequest.php
 M app/Http/Requests/ProfileUpdateRequest.php
 M app/Models/Batch.php
 M app/Models/Customer.php
 M app/Models/Product.php
 M app/Models/ScanEvent.php
 M app/Models/TeamInvitation.php
 M app/Models/User.php
 M app/Services/ScanRecorder.php
 M bootstrap/app.php
 M config/services.php
 M docs/SHOPIFY-CLOUDFLARE-PRODUCTION.md
 M docs/VALIDATION-AND-ARCHITECTURE.md
 M infrastructure/cloudflare-worker/src/worker.mjs
 M infrastructure/cloudflare-worker/test/worker.test.mjs
 M lang/en/ui.php
 M lang/fr/ui.php
 M package-lock.json
 M package.json
 M resources/css/app.css
 M resources/js/Components/LanguageSwitcher.jsx
 M resources/js/Components/ScanActivityChart.jsx
 M resources/js/Layouts/AuthenticatedLayout.jsx
 M resources/js/Pages/Admin/Customers.jsx
 M resources/js/Pages/Admin/Dashboard.jsx
 M resources/js/Pages/Admin/Products.jsx
 M resources/js/Pages/Dashboard.jsx
 M resources/js/Pages/Profile/Edit.jsx
 M resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx
 M resources/js/i18n.js
 M routes/web.php
 M shopify/README.md
 M tests/Feature/ConfigurationRoutingTest.php
 M tests/Feature/DashboardTest.php
 M tests/Feature/ProductionReadinessTest.php
 M tests/Feature/ProfileTest.php
?? app/Http/Controllers/Admin/ActivityController.php
?? app/Http/Controllers/Admin/BatchController.php
?? app/Http/Controllers/Admin/DeletionRequestController.php
?? app/Http/Controllers/Admin/ManagerController.php
?? app/Http/Controllers/Admin/StatisticsController.php
?? app/Http/Controllers/CustomerStatisticsController.php
?? app/Http/Controllers/HelpController.php
?? app/Http/Controllers/PrivacyExportController.php
?? app/Http/Controllers/SessionController.php
?? app/Http/Controllers/WorkspaceController.php
?? app/Http/Middleware/EnsureCustomerAccess.php
?? app/Http/Requests/UpdateProductRequest.php
?? app/Models/AccountDeletionRequest.php
?? app/Services/AdminAudit.php
?? database/migrations/2026_11_21_000001_add_product_labels_and_scan_metadata.php
?? database/migrations/2026_11_21_000002_add_customer_account_management.php
?? database/migrations/2026_11_21_000003_add_admin_console_fields.php
?? docs/FINAL-QA-CHANGED-FILES.md
?? docs/FINAL-QA-RELEASE-RUNBOOK.md
?? resources/js/Pages/Admin/Activity.jsx
?? resources/js/Pages/Admin/Batches.jsx
?? resources/js/Pages/Admin/CustomerDetail.jsx
?? resources/js/Pages/Admin/DeletionRequests.jsx
?? resources/js/Pages/Admin/Managers.jsx
?? resources/js/Pages/Admin/Statistics.jsx
?? resources/js/Pages/Help/Index.jsx
?? resources/js/Pages/Products/Index.jsx
?? resources/js/Pages/Profile/Partials/PrivacySettings.jsx
?? resources/js/Pages/Profile/Partials/SecuritySettings.jsx
?? resources/js/Pages/Profile/Partials/TeamSettings.jsx
?? resources/js/Pages/Statistics/Index.jsx
?? resources/js/lib/productQr.js
?? shopify/assets/shiftrix-preserve-activation-query.js
?? shopify/snippets/shiftrix-preserve-activation-query.liquid
?? shopify/test/tutorial-cta.test.mjs
?? tests/Feature/AdminConsoleTest.php
?? tests/Feature/CustomerAccountSettingsTest.php
?? tests/Feature/CustomerStatisticsTest.php
?? tests/Feature/ProductManagementTest.php
?? tests/frontend/product-qr.test.mjs
```

Total working-tree file entries: 90.

No file in this inventory has been committed, pushed, or deployed by this QA pass.
