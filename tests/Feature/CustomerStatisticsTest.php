<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\User;
use App\Services\ScanRecorder;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Tests\TestCase;

class CustomerStatisticsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_date_filter_totals_exclude_bots_old_scans_and_other_customers(): void
    {
        CarbonImmutable::setTestNow('2026-11-21 12:00:00');
        [$user, $customer, $product] = $this->workspace();
        $this->scan($product, $customer, '2026-11-21 10:00:00');
        $this->scan($product, $customer, '2026-11-16 09:00:00');
        $this->scan($product, $customer, '2026-11-10 09:00:00');
        $this->scan($product, $customer, '2026-11-20 09:00:00', true);
        [, $otherCustomer, $otherProduct] = $this->workspace(2);
        $this->scan($otherProduct, $otherCustomer, '2026-11-21 11:00:00');

        $this->actingAs($user)->get(route('statistics.index', ['days' => 7]))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Statistics/Index')->where('days', 7)->where('total', 2)->has('series', 7)
            ->where('series.6.total', 1)->where('timezone', 'UTC')
        );
        $this->actingAs($user)->get(route('statistics.index', ['days' => 30]))->assertInertia(fn ($page) => $page->where('total', 3)->has('series', 30));
    }

    public function test_missing_metadata_is_reported_as_unknown_without_invention(): void
    {
        CarbonImmutable::setTestNow('2026-11-21 12:00:00');
        [$user, $customer, $product] = $this->workspace();
        $this->scan($product, $customer, '2026-11-21 10:00:00');

        $this->actingAs($user)->get(route('statistics.index', ['days' => 7]))->assertInertia(fn ($page) => $page
            ->where('devices.3', ['category' => 'unknown', 'total' => 1])
            ->where('countries.0', ['country' => 'unknown', 'total' => 1])
        );
    }

    public function test_csv_export_uses_selected_range_and_customer_scope(): void
    {
        CarbonImmutable::setTestNow('2026-11-21 12:00:00');
        [$user, $customer, $product] = $this->workspace();
        $this->scan($product, $customer, '2026-11-21 10:00:00');
        $this->scan($product, $customer, '2026-11-10 10:00:00');

        $content = $this->actingAs($user)->get(route('statistics.export', ['days' => 7]))
            ->assertOk()->assertDownload('shiftrix-statistics-7d-2026-11-21.csv')->streamedContent();

        $this->assertStringContainsString('CARD-01001', $content);
        $this->assertStringContainsString('2026-11-21', $content);
        $this->assertStringNotContainsString('2026-11-10', $content);
    }

    public function test_scan_recorder_collects_safe_future_device_and_edge_country_metadata(): void
    {
        config(['services.shiftrix.edge_secret' => 'metadata-secret']);
        [, , $product] = $this->workspace();
        $request = Request::create('/configuration?id='.$product->code_id, 'GET', [], [], [], [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            'HTTP_X_SHIFTRIX_COUNTRY' => 'fr',
            'HTTP_X_SHIFTRIX_EDGE' => 'metadata-secret',
        ]);

        $event = app(ScanRecorder::class)->record($product, $request, 'redirected');

        $this->assertSame('iphone', $event->device_category);
        $this->assertSame('FR', $event->country_code);
        $this->assertFalse($event->is_probable_bot);
    }

    private function workspace(int $suffix = 1): array
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Test '.$suffix, 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $import = InventoryImport::create(['original_filename' => "stats-{$suffix}.xlsx", 'file_sha256' => str_repeat((string) $suffix, 64), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => $suffix, 'code' => 'LOT-'.str_pad((string) $suffix, 2, '0', STR_PAD_LEFT), 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $product = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $customer->id, 'code_id' => 'CARD-'.str_pad((string) (1000 + $suffix), 5, '0', STR_PAD_LEFT), 'variant' => 'CARD', 'code_sequence' => 1000 + $suffix, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => 1000 + $suffix, 'status' => 'active', 'google_review_url' => 'https://g.page/r/example/review']);

        return [$user, $customer, $product];
    }

    private function scan(Product $product, Customer $customer, string $at, bool $bot = false): void
    {
        ScanEvent::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => $bot, 'scanned_at' => $at]);
    }
}
