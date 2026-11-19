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

class AdminDashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_admin_dashboard_analytics_are_derived_from_real_inventory_and_scan_queries(): void
    {
        CarbonImmutable::setTestNow('2026-11-19 12:00:00');
        $admin = User::factory()->create(['is_admin' => true]);
        $member = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Analytics Customer', 'status' => 'active', 'max_products' => 10]);
        $customer->users()->attach($member->id, ['role' => 'owner', 'status' => 'active']);
        $import = InventoryImport::create(['original_filename' => 'analytics.xlsx', 'file_sha256' => str_repeat('f', 64), 'total_rows' => 3, 'commercial_rows' => 2, 'backup_rows' => 1, 'status' => 'imported']);
        $firstBatch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 2, 'backup_count' => 0, 'total_count' => 2, 'inventory_import_id' => $import->id]);
        $secondBatch = Batch::create(['lot_number' => 2, 'code' => 'LOT-02', 'commercial_count' => 0, 'backup_count' => 1, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $card = $this->product($import, $firstBatch, 1, 'CARD', ['customer_id' => $customer->id, 'status' => 'active']);
        $this->product($import, $firstBatch, 2, 'PLATE');
        $stand = $this->product($import, $secondBatch, 3, 'STAND', ['unit_type' => 'backup', 'status' => 'disabled', 'disabled_at' => now()]);

        $this->scan($card, $customer, '2026-11-19 09:00:00');
        $this->scan($card, $customer, '2026-11-09 09:00:00');
        $this->scan($card, $customer, '2026-11-19 10:00:00', true);
        $this->scan($stand, null, '2026-11-19 11:00:00', false, 'blocked');

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('metrics.totalProducts', 3)
            ->where('metrics.claimed', 1)
            ->where('metrics.available', 1)
            ->where('metrics.disabled', 1)
            ->where('metrics.scans7d', 1)
            ->where('metrics.scans30d', 2)
            ->where('metrics.claimRate', 33.3)
            ->has('scanSeries', 30)
            ->where('scanSeries.19', ['day' => '2026-11-09', 'total' => 1])
            ->where('scanSeries.29', ['day' => '2026-11-19', 'total' => 1])
            ->where('variantDistribution', [
                ['variant' => 'CARD', 'total' => 1],
                ['variant' => 'PLATE', 'total' => 1],
                ['variant' => 'STAND', 'total' => 1],
            ])
            ->where('batchActivity.0.code', 'LOT-01')
            ->where('batchActivity.0.claimed_count', 1)
            ->where('batchActivity.0.available_count', 1)
            ->where('batchActivity.0.scans_30d', 2)
            ->where('recentCustomers.0.business_name', 'Analytics Customer')
            ->where('recentCustomers.0.products_count', 1)
            ->where('recentCustomers.0.users_count', 1)
        );
    }

    public function test_customer_directory_summary_remains_global_when_search_is_applied(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $alpha = Customer::create(['business_name' => 'Alpha Studio', 'status' => 'active', 'max_products' => 5]);
        Customer::create(['business_name' => 'Beta Studio', 'status' => 'blocked', 'max_products' => 5]);
        $import = InventoryImport::create(['original_filename' => 'customer-summary.xlsx', 'file_sha256' => str_repeat('a', 64), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $this->product($import, $batch, 1, 'CARD', ['customer_id' => $alpha->id, 'status' => 'active']);

        $this->actingAs($admin)->get(route('admin.customers.index', ['search' => ' Alpha ']))->assertOk()->assertInertia(fn ($page) => $page
            ->has('customers.data', 1)
            ->where('customers.data.0.business_name', 'Alpha Studio')
            ->where('filters.search', 'Alpha')
            ->where('summary.total', 2)
            ->where('summary.active', 1)
            ->where('summary.blocked', 1)
            ->where('summary.products', 1)
        );
    }

    public function test_admin_dashboard_has_zero_filled_empty_state_data(): void
    {
        CarbonImmutable::setTestNow('2026-11-19 12:00:00');
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk()->assertInertia(fn ($page) => $page
            ->where('metrics.totalProducts', 0)
            ->where('metrics.claimed', 0)
            ->where('metrics.available', 0)
            ->where('metrics.scans7d', 0)
            ->where('metrics.scans30d', 0)
            ->where('metrics.claimRate', 0)
            ->has('scanSeries', 30)
            ->where('scanSeries.0', ['day' => '2026-10-21', 'total' => 0])
            ->where('scanSeries.29', ['day' => '2026-11-19', 'total' => 0])
            ->has('variantDistribution', 0)
            ->has('batchActivity', 0)
            ->has('recentCustomers', 0)
        );
    }

    public function test_admin_period_totals_use_seven_and_thirty_calendar_days(): void
    {
        CarbonImmutable::setTestNow('2026-11-19 12:00:00');
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = Customer::create(['business_name' => 'Boundary Customer', 'status' => 'active', 'max_products' => 10]);
        $import = InventoryImport::create(['original_filename' => 'boundaries.xlsx', 'file_sha256' => str_repeat('b', 64), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $product = $this->product($import, $batch, 1, 'CARD', ['customer_id' => $customer->id, 'status' => 'active']);

        foreach (['2026-10-20 23:59:59', '2026-10-21 00:00:00', '2026-11-12 23:59:59', '2026-11-13 00:00:00', '2026-11-19 11:59:59'] as $scannedAt) {
            $this->scan($product, $customer, $scannedAt);
        }

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk()->assertInertia(fn ($page) => $page
            ->where('metrics.scans7d', 2)
            ->where('metrics.scans30d', 4)
            ->where('batchActivity.0.scans_30d', 4)
            ->where('scanSeries.0', ['day' => '2026-10-21', 'total' => 1])
            ->where('scanSeries.29', ['day' => '2026-11-19', 'total' => 1])
        );
    }

    private function product(InventoryImport $import, Batch $batch, int $sequence, string $variant, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'batch_id' => $batch->id,
            'inventory_import_id' => $import->id,
            'code_id' => sprintf('%s-%05d', $variant, $sequence),
            'variant' => $variant,
            'code_sequence' => $sequence,
            'unit_type' => 'commercial',
            'position_in_batch' => $sequence,
            'source_line' => $sequence,
            'status' => 'unclaimed',
        ], $overrides));
    }

    private function scan(Product $product, ?Customer $customer, string $scannedAt, bool $bot = false, string $result = 'redirected'): void
    {
        ScanEvent::create([
            'product_id' => $product->id,
            'customer_id' => $customer?->id,
            'request_uuid' => (string) Str::uuid(),
            'result' => $result,
            'is_probable_bot' => $bot,
            'scanned_at' => $scannedAt,
        ]);
    }
}
