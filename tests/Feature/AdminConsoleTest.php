<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminConsoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_console_is_admin_only(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($user)->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
        $this->actingAs($admin)->get(route('admin.managers.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.statistics.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.activity.index'))->assertOk();
    }

    public function test_admin_help_route_uses_configured_support_actions(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();
        SystemSetting::create(['key' => 'support_email', 'value' => 'support@shiftrix.io']);
        config(['services.shiftrix.whatsapp_url' => 'https://wa.me/33612345678']);

        $this->actingAs($customer)->get(route('admin.help'))->assertForbidden();
        $this->actingAs($admin)->get(route('admin.help'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Help/Index')
            ->where('supportEmail', 'support@shiftrix.io')
            ->where('whatsappUrl', fn ($value) => str_starts_with($value, 'https://wa.me/33612345678?text=Hello%20SHIFTRIX%20Support'))
            ->where('support.email', 'support@shiftrix.io')
        );
    }

    public function test_disabling_dashboard_preserves_activated_nfc_redirect_but_denies_customer_access(): void
    {
        [$owner, $customer] = $this->customerWithOwner(['status' => 'blocked']);
        $product = $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/working/review']);

        $this->get('/configuration?id=CARD-00001')->assertRedirect('https://g.page/r/working/review');
        $this->assertDatabaseHas('scan_events', ['product_id' => $product->id, 'result' => 'redirected']);
        $this->actingAs($owner)->get(route('dashboard'))->assertForbidden();
        $this->actingAs($owner)->patch(route('products.update', $product), ['display_name' => 'Blocked write', 'google_review_url' => $product->google_review_url])->assertForbidden();
    }

    public function test_safe_range_assignment_enforces_availability_and_allocation_limit_and_is_audited(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        [, $customer] = $this->customerWithOwner(['max_products' => 2]);
        $first = $this->product('CARD', 1);
        $second = $this->product('CARD', 2);
        $third = $this->product('CARD', 3);

        $this->actingAs($admin)->post(route('admin.products.assign-range'), ['customer_id' => $customer->id, 'start_code' => 'CARD-00001', 'end_code' => 'CARD-00002'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', ['id' => $first->id, 'customer_id' => $customer->id, 'status' => 'active']);
        $this->assertDatabaseHas('products', ['id' => $second->id, 'customer_id' => $customer->id, 'status' => 'active']);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $admin->id, 'action' => 'products.range_assigned', 'subject_id' => $customer->id]);

        $this->actingAs($admin)->post(route('admin.products.assign-range'), ['customer_id' => $customer->id, 'start_code' => 'CARD-00002', 'end_code' => 'CARD-00003'])->assertStatus(422);
        $this->assertNull($third->fresh()->customer_id);
    }

    public function test_private_notes_limit_status_and_password_reset_are_audited(): void
    {
        Notification::fake();
        $admin = User::factory()->create(['is_admin' => true]);
        [$owner, $customer] = $this->customerWithOwner();

        $this->actingAs($admin)->patch(route('admin.customers.update', $customer), ['status' => 'blocked', 'max_products' => 25, 'admin_notes' => 'Internal follow-up only'])->assertRedirect();
        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'status' => 'blocked', 'max_products' => 25, 'admin_notes' => 'Internal follow-up only']);
        $log = AuditLog::where('action', 'customer.updated')->firstOrFail();
        $this->assertStringNotContainsString('Internal follow-up only', json_encode($log->metadata));
        $this->assertDatabaseHas('audit_logs', ['action' => 'customer.status_changed', 'subject_id' => $customer->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'customer.limit_changed', 'subject_id' => $customer->id]);

        $this->actingAs($admin)->post(route('admin.customers.password-reset', $customer))->assertRedirect();
        Notification::assertSentTo($owner, ResetPassword::class);
        $this->assertDatabaseHas('audit_logs', ['action' => 'customer.password_reset_requested', 'subject_id' => $customer->id]);
    }

    public function test_factory_export_preserves_original_product_id_and_nfc_url(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->product('PLATE', 42);

        $response = $this->actingAs($admin)->get(route('admin.inventory.export'))->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $csv = $response->streamedContent();
        $this->assertStringContainsString('PLATE-00042,PLATE,https://shiftrix.io/configuration?id=PLATE-00042', $csv);
        $this->assertDatabaseHas('audit_logs', ['action' => 'inventory.exported']);
    }

    public function test_statistics_use_eligible_scans_and_report_unknown_metadata(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        [, $customer] = $this->customerWithOwner();
        $card = $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'active']);
        $plate = $this->product('PLATE', 2, ['customer_id' => $customer->id, 'status' => 'active']);
        $this->scan($card, $customer, false);
        $this->scan($card, $customer, false);
        $this->scan($plate, $customer, true);

        $this->actingAs($admin)->get(route('admin.statistics.index', ['days' => 7]))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Admin/Statistics')->where('days', 7)->where('total', 2)->where('timezone', config('app.timezone'))
            ->where('variants.0.variant', 'CARD')->where('variants.0.total', 2)
            ->where('devices.0.label', 'unknown')->where('devices.0.total', 2)
            ->where('countries.0.label', 'unknown')->where('topProducts.0.code', 'CARD-00001')->where('topProducts.0.total', 2)
        );
    }

    public function test_future_inventory_requires_confirmation_and_rejects_identifier_collisions(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->product('STAND', 900);

        $this->actingAs($admin)->post(route('admin.inventory.future-range'), ['variant' => 'STAND', 'start_sequence' => 900, 'count' => 2, 'confirmation' => 'CREATE FUTURE INVENTORY'])->assertStatus(422);
        $this->actingAs($admin)->post(route('admin.inventory.future-range'), ['variant' => 'STAND', 'start_sequence' => 901, 'count' => 2, 'confirmation' => 'CREATE FUTURE INVENTORY'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', ['code_id' => 'STAND-00901', 'status' => 'unclaimed']);
        $this->assertDatabaseHas('batches', ['is_future_inventory' => true, 'total_count' => 2]);
    }

    public function test_whatsapp_setting_is_validated_normalized_and_optional(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->patch(route('admin.settings.update'), ['support_email' => 'support@shiftrix.io', 'whatsapp_url' => 'not-a-number', 'default_product_limit' => 100])->assertSessionHasErrors('whatsapp_url');
        $this->actingAs($admin)->patch(route('admin.settings.update'), ['support_email' => 'support@shiftrix.io', 'whatsapp_url' => '+33 6 12 34 56 78', 'default_product_limit' => 100])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('system_settings', ['key' => 'whatsapp_url', 'value' => 'https://wa.me/33612345678']);
    }

    public function test_batches_are_paginated_at_twenty_five_with_global_totals(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        for ($sequence = 1; $sequence <= 26; $sequence++) {
            $this->product('CARD', $sequence)->update(['batch_id' => Batch::create([
                'lot_number' => $sequence + 10,
                'code' => sprintf('LOT-%02d', $sequence + 10),
                'commercial_count' => 1,
                'backup_count' => 0,
                'total_count' => 1,
                'inventory_import_id' => InventoryImport::first()->id,
            ])->id]);
        }

        $this->actingAs($admin)->get(route('admin.batches.index'))->assertInertia(fn ($page) => $page
            ->has('batches.data', 25)->where('batches.total', 27)->where('summary.total', 26)
        );
        $this->actingAs($admin)->get(route('admin.batches.index', ['page' => 2]))->assertInertia(fn ($page) => $page->has('batches.data', 2));
    }

    private function customerWithOwner(array $customerOverrides = []): array
    {
        $owner = User::factory()->create();
        $customer = Customer::create(array_merge(['business_name' => 'Test Workspace', 'status' => 'active', 'max_products' => 10], $customerOverrides));
        $customer->users()->attach($owner->id, ['role' => 'owner', 'status' => 'active']);

        return [$owner, $customer];
    }

    private function product(string $variant, int $sequence, array $overrides = []): Product
    {
        $import = InventoryImport::firstOrCreate(['file_sha256' => str_repeat('c', 64)], ['original_filename' => 'admin-console.xlsx', 'total_rows' => 10, 'commercial_rows' => 10, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::firstOrCreate(['code' => 'LOT-ADMIN'], ['lot_number' => 1, 'commercial_count' => 10, 'backup_count' => 0, 'total_count' => 10, 'inventory_import_id' => $import->id]);

        return Product::create(array_merge(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'code_id' => sprintf('%s-%05d', $variant, $sequence), 'variant' => $variant, 'code_sequence' => $sequence, 'unit_type' => 'commercial', 'position_in_batch' => $sequence, 'source_line' => $sequence, 'status' => 'unclaimed'], $overrides));
    }

    private function scan(Product $product, Customer $customer, bool $bot): void
    {
        ScanEvent::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => $bot, 'scanned_at' => now()]);
    }
}
