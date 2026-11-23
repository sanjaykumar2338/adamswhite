<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    use RefreshDatabase;

    private InventoryImport $import;

    private Batch $batch;

    protected function setUp(): void
    {
        parent::setUp();
        $this->import = InventoryImport::create(['original_filename' => 'qa.xlsx', 'file_sha256' => str_repeat('b', 64), 'total_rows' => 3, 'commercial_rows' => 3, 'backup_rows' => 0, 'status' => 'imported']);
        $this->batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 3, 'backup_count' => 0, 'total_count' => 3, 'inventory_import_id' => $this->import->id]);
    }

    private function customerWithUser(string $role = 'owner', array $user = [], array $customer = []): array
    {
        $account = User::factory()->create($user);
        $business = Customer::create(array_merge(['business_name' => Str::random(10), 'status' => 'active', 'max_products' => 10], $customer));
        $business->users()->attach($account->id, ['role' => $role, 'status' => 'active']);

        return [$account, $business];
    }

    private function product(string $variant, int $sequence, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'batch_id' => $this->batch->id,
            'inventory_import_id' => $this->import->id,
            'code_id' => sprintf('%s-%05d', $variant, $sequence),
            'variant' => $variant,
            'code_sequence' => $sequence,
            'unit_type' => 'commercial',
            'position_in_batch' => $sequence,
            'source_line' => $sequence,
            'status' => 'unclaimed',
        ], $overrides));
    }

    public function test_manager_can_update_owned_product_but_cannot_manage_team_or_admin(): void
    {
        [$manager, $customer] = $this->customerWithUser('manager');
        $product = $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/old/review']);

        $this->actingAs($manager)->patch(route('products.update', $product), ['google_review_url' => 'https://maps.app.goo.gl/example'])->assertSessionHasNoErrors();
        $this->actingAs($manager)->post(route('team.store'), ['email' => 'other@example.com'])->assertForbidden();
        $this->actingAs($manager)->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs($manager)->post(route('admin.products.reset', $product))->assertForbidden();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'google_review_url' => 'https://maps.app.goo.gl/example']);
    }

    public function test_customer_cannot_update_another_customers_product(): void
    {
        [$owner] = $this->customerWithUser();
        [, $otherCustomer] = $this->customerWithUser();
        $product = $this->product('PLATE', 1, ['customer_id' => $otherCustomer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/old/review']);

        $this->actingAs($owner)->patch(route('products.update', $product), ['google_review_url' => 'https://g.page/r/stolen/review'])->assertForbidden();
    }

    public function test_product_limit_is_enforced(): void
    {
        [$owner, $customer] = $this->customerWithUser(customer: ['max_products' => 1]);
        $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/first/review']);
        $this->product('PLATE', 2);

        $this->actingAs($owner)->post(route('activations.store'), ['code_id' => 'PLATE-00002', 'business_name' => $customer->business_name, 'google_review_url' => 'https://g.page/r/second/review'])->assertSessionHasErrors('code_id');
        $this->assertDatabaseHas('products', ['code_id' => 'PLATE-00002', 'status' => 'unclaimed', 'customer_id' => null]);
    }

    public function test_blocked_customer_dashboard_does_not_stop_activated_product_and_admin_can_reset_it(): void
    {
        [$admin] = $this->customerWithUser(user: ['is_admin' => true]);
        [, $customer] = $this->customerWithUser(customer: ['status' => 'blocked', 'blocked_at' => now()]);
        $product = $this->product('STAND', 1, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/private/review']);

        $this->get('/?id=STAND-00001')->assertRedirect('https://g.page/r/private/review');
        $this->assertDatabaseHas('scan_events', ['product_id' => $product->id, 'result' => 'redirected']);

        $this->actingAs($admin)->post(route('admin.products.reset', $product))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'status' => 'unclaimed', 'customer_id' => null, 'google_review_url' => null]);
        $this->assertDatabaseHas('activations', ['product_id' => $product->id, 'action' => 'reset', 'previous_customer_id' => $customer->id]);
    }

    public function test_statistics_exclude_bots_and_csv_is_customer_scoped(): void
    {
        [$owner, $customer] = $this->customerWithUser();
        $product = $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/one/review']);
        foreach ([false, false, true] as $bot) {
            ScanEvent::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => $bot, 'scanned_at' => now()]);
        }

        $this->actingAs($owner)->get(route('dashboard'))->assertInertia(fn ($page) => $page->where('summary.scans7d', 2)->where('summary.scans30d', 2)->has('series', 30));
        $response = $this->actingAs($owner)->get(route('statistics.export'))->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('CARD-00001,CARD,,2', $response->streamedContent());
    }

    public function test_canonical_entry_does_not_depend_on_the_retired_edge_secret(): void
    {
        config(['services.shiftrix.edge_secret' => 'edge-test-secret']);

        $product = $this->product('CARD', 1);

        $this->get('/?id=CARD-00001')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Track/Tutorial')
            ->where('product.code_id', $product->code_id));
        $this->get('/configuration?id=CARD-00001')
            ->assertRedirect(route('home', ['id' => 'CARD-00001']))
            ->assertStatus(301);
    }

    public function test_admin_inventory_filters_and_customer_block_controls(): void
    {
        [$admin] = $this->customerWithUser(user: ['is_admin' => true]);
        [, $customer] = $this->customerWithUser();
        $this->product('CARD', 1);
        $this->product('PLATE', 2, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/plate/review']);

        $this->actingAs($admin)->get(route('admin.products.index', ['variant' => 'CARD', 'status' => 'unclaimed', 'batch' => 1]))
            ->assertOk()->assertInertia(fn ($page) => $page->has('products.data', 1)->where('products.data.0.code_id', 'CARD-00001'));
        $this->actingAs($admin)->patch(route('admin.customers.update', $customer), ['status' => 'blocked', 'max_products' => 3])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'status' => 'blocked', 'max_products' => 3, 'blocked_by' => $admin->id]);
    }

    public function test_security_headers_are_present(): void
    {
        $this->get('/')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }
}
