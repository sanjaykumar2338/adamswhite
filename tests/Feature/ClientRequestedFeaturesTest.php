<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ClientRequestedFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_owner_can_set_account_type_and_dashboard_receives_it(): void
    {
        [$user, $customer] = $this->customerUser();

        $this->actingAs($user)->patch(route('profile.account-type.update'), [
            'account_type' => Customer::ACCOUNT_TYPE_INDIVIDUAL,
        ])->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'account_type' => Customer::ACCOUNT_TYPE_INDIVIDUAL,
        ]);
        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('customer.account_type', Customer::ACCOUNT_TYPE_INDIVIDUAL));
    }

    public function test_manager_cannot_change_workspace_account_type(): void
    {
        [$owner, $customer] = $this->customerUser();
        $manager = User::factory()->create();
        $customer->users()->attach($manager, ['role' => 'manager', 'status' => 'active']);

        $this->actingAs($manager)->patch(route('profile.account-type.update'), [
            'account_type' => Customer::ACCOUNT_TYPE_BUSINESS,
        ])->assertForbidden();

        $this->assertNull($customer->fresh()->account_type);
    }

    public function test_scan_milestone_uses_only_genuine_scans_and_is_disabled_by_default(): void
    {
        [$user, $customer] = $this->customerUser();
        $product = $this->product($customer);
        $this->createScans($product, $customer, 10);

        $this->assertFalse((bool) config('services.shiftrix.scan_milestone_enabled'));
        $this->assertSame(10, config('services.shiftrix.scan_milestone_threshold'));
        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('scanMilestone', null));
    }

    public function test_reached_scan_milestone_is_shown_once_and_dismissal_persists(): void
    {
        config()->set('services.shiftrix.scan_milestone_enabled', true);
        config()->set('services.shiftrix.scan_milestone_threshold', 3);
        CarbonImmutable::setTestNow('2026-11-24 10:00:00');
        [$user, $customer] = $this->customerUser();
        $product = $this->product($customer);
        $this->createScans($product, $customer, 2);
        $this->createScans($product, $customer, 3, ['is_probable_bot' => true]);
        $this->createScans($product, $customer, 2, ['result' => 'blocked']);

        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('scanMilestone', null));

        $this->createScans($product, $customer, 1);
        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('scanMilestone.threshold', 3)
            ->where('scanMilestone.count', 3));

        $this->actingAs($user)->patch(route('scan-milestone.dismiss'))->assertRedirect(route('dashboard'));
        $dismissedAt = $customer->fresh()->genuine_scan_milestone_dismissed_at;
        $this->assertNotNull($dismissedAt);

        CarbonImmutable::setTestNow('2026-11-24 11:00:00');
        $this->actingAs($user)->patch(route('scan-milestone.dismiss'))->assertRedirect(route('dashboard'));
        $this->assertTrue($dismissedAt->equalTo($customer->fresh()->genuine_scan_milestone_dismissed_at));
        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('scanMilestone', null));
    }

    public function test_circle_is_customer_only_and_uses_a_clean_external_url(): void
    {
        [$user] = $this->customerUser();

        $this->get(route('circle.index'))->assertRedirect(route('login'));
        $this->actingAs($user)->get(route('circle.index'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Circle/Index')
            ->where('circleUrl', 'https://circle.shiftrix.io'));

        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin)->get(route('circle.index'))->assertForbidden();
    }

    private function customerUser(): array
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Client Workspace', 'max_products' => 10]);
        $customer->users()->attach($user, ['role' => 'owner', 'status' => 'active']);

        return [$user, $customer];
    }

    private function product(Customer $customer): Product
    {
        $import = InventoryImport::create([
            'original_filename' => 'client-features.xlsx',
            'file_sha256' => str_repeat('f', 64),
            'total_rows' => 1,
            'commercial_rows' => 1,
            'backup_rows' => 0,
            'status' => 'imported',
        ]);
        $batch = Batch::create([
            'lot_number' => 1,
            'code' => 'LOT-CLIENT',
            'commercial_count' => 1,
            'backup_count' => 0,
            'total_count' => 1,
            'inventory_import_id' => $import->id,
        ]);

        return Product::create([
            'batch_id' => $batch->id,
            'inventory_import_id' => $import->id,
            'customer_id' => $customer->id,
            'code_id' => 'CARD-00001',
            'variant' => 'CARD',
            'code_sequence' => 1,
            'unit_type' => 'commercial',
            'position_in_batch' => 1,
            'source_line' => 1,
            'status' => 'active',
            'google_review_url' => 'https://g.page/r/client/review',
        ]);
    }

    private function createScans(Product $product, Customer $customer, int $count, array $overrides = []): void
    {
        for ($index = 0; $index < $count; $index++) {
            ScanEvent::create(array_merge([
                'product_id' => $product->id,
                'customer_id' => $customer->id,
                'request_uuid' => (string) Str::uuid(),
                'result' => 'redirected',
                'is_probable_bot' => false,
                'scanned_at' => now(),
            ], $overrides));
        }
    }
}
