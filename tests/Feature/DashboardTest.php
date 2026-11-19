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

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_verified_customer_can_view_dashboard(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Test', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $this->actingAs($user)->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('customer.business_name', 'Test')
            ->where('summary', ['products' => 0, 'scans7d' => 0, 'scans30d' => 0])
            ->has('series', 30)
            ->where('series.0.total', 0)
            ->where('series.29.total', 0)
        );
    }

    public function test_dashboard_series_contains_all_thirty_calendar_days_with_zeroes(): void
    {
        CarbonImmutable::setTestNow('2026-11-18 12:00:00');
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Chart Test', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $import = InventoryImport::create(['original_filename' => 'chart.xlsx', 'file_sha256' => str_repeat('e', 64), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $product = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $customer->id, 'code_id' => 'CARD-00001', 'variant' => 'CARD', 'code_sequence' => 1, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => 1, 'status' => 'active', 'google_review_url' => 'https://g.page/r/chart/review']);

        foreach (['2026-10-20 08:00:00', '2026-11-10 08:00:00', '2026-11-10 09:00:00', '2026-11-18 10:00:00'] as $scannedAt) {
            ScanEvent::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => false, 'scanned_at' => $scannedAt]);
        }

        ScanEvent::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => true, 'scanned_at' => '2026-11-10 10:00:00']);

        $otherCustomer = Customer::create(['business_name' => 'Other Customer', 'max_products' => 10]);
        $otherProduct = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $otherCustomer->id, 'code_id' => 'CARD-00002', 'variant' => 'CARD', 'code_sequence' => 2, 'unit_type' => 'commercial', 'position_in_batch' => 2, 'source_line' => 2, 'status' => 'active', 'google_review_url' => 'https://g.page/r/other/review']);
        ScanEvent::create(['product_id' => $otherProduct->id, 'customer_id' => $otherCustomer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => false, 'scanned_at' => '2026-11-18 11:00:00']);

        $this->actingAs($user)->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page
            ->has('series', 30)
            ->where('series.0', ['day' => '2026-10-20', 'total' => 1])
            ->where('series.1', ['day' => '2026-10-21', 'total' => 0])
            ->where('series.21', ['day' => '2026-11-10', 'total' => 2])
            ->where('series.29', ['day' => '2026-11-18', 'total' => 1])
            ->where('summary', ['products' => 1, 'scans7d' => 1, 'scans30d' => 4])
            ->where('products.0.scans_7d', 1)
            ->where('products.0.scans_30d', 4)
        );
    }
}
