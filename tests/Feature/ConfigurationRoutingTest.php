<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfigurationRoutingTest extends TestCase
{
    use RefreshDatabase;

    private InventoryImport $import;

    private Batch $batch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->import = InventoryImport::create(['original_filename' => 'routing.xlsx', 'file_sha256' => str_repeat('f', 64), 'total_rows' => 10, 'commercial_rows' => 9, 'backup_rows' => 1, 'status' => 'imported']);
        $this->batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 9, 'backup_count' => 1, 'total_count' => 10, 'inventory_import_id' => $this->import->id]);
    }

    public function test_all_product_types_and_backup_inventory_follow_the_tutorial_with_query_parameters(): void
    {
        foreach ([['CARD', 1, 'commercial'], ['PLATE', 2, 'backup'], ['STAND', 3, 'commercial']] as [$variant, $sequence, $unitType]) {
            $product = $this->product($variant, $sequence, ['unit_type' => $unitType]);
            $query = http_build_query(['id' => $product->code_id, 'utm_source' => 'nfc', 'campaign' => 'launch']);

            $this->get("/?{$query}")
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->component('Track/Tutorial')
                    ->where('product.code_id', $product->code_id)
                    ->where('product.variant', $variant)
                    ->where('continueUrl', "/activate?{$query}"));

            $this->assertDatabaseHas('scan_events', ['product_id' => $product->id, 'result' => 'unclaimed']);
        }

        $this->assertDatabaseCount('scan_events', 3);
    }

    public function test_active_product_redirects_directly_and_records_one_eligible_scan(): void
    {
        $customer = Customer::create(['business_name' => 'Active Business', 'status' => 'active']);
        $product = $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/direct/review']);

        $this->get('/?id=CARD-00001&utm_source=nfc')
            ->assertRedirect('https://g.page/r/direct/review');

        $this->assertDatabaseHas('scan_events', ['product_id' => $product->id, 'customer_id' => $customer->id, 'result' => 'redirected']);
        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_invalid_unknown_products_fail_safely_while_blocked_customer_products_keep_working(): void
    {
        $this->get('/?id=NOT-A-CODE&utm_source=nfc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Track/Index')->where('invalid', true)->where('product', null));
        $this->get('/?id=CARD-99999')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Track/Index')->where('invalid', true)->where('product', null));

        $blockedCustomer = Customer::create(['business_name' => 'Blocked Business', 'status' => 'blocked']);
        $blocked = $this->product('STAND', 3, ['customer_id' => $blockedCustomer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/private/review']);
        $this->get('/?id=STAND-00003&source=qr')
            ->assertRedirect('https://g.page/r/private/review');

        $this->assertDatabaseHas('scan_events', ['product_id' => $blocked->id, 'result' => 'redirected']);
        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_retried_request_is_recorded_only_once(): void
    {
        $customer = Customer::create(['business_name' => 'Dedupe Business', 'status' => 'active']);
        $product = $this->product('PLATE', 2, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/dedupe/review']);
        $requestId = '36f1348a-6ba7-4e25-85c2-fc74604b95d7';

        foreach (range(1, 2) as $_) {
            $this->withHeader('X-Shiftrix-Request-Id', $requestId)
                ->get('/?id=PLATE-00002')
                ->assertRedirect('https://g.page/r/dedupe/review');
        }

        $this->assertDatabaseHas('scan_events', ['product_id' => $product->id, 'request_uuid' => $requestId, 'result' => 'redirected']);
        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_head_probe_does_not_increment_customer_scan_counts(): void
    {
        $customer = Customer::create(['business_name' => 'Probe Business', 'status' => 'active']);
        $this->product('STAND', 3, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/probe/review']);

        $this->head('/?id=STAND-00003')
            ->assertRedirect('https://g.page/r/probe/review');
        $this->assertDatabaseCount('scan_events', 0);

        $this->get('/?id=STAND-00003')
            ->assertRedirect('https://g.page/r/probe/review');
        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_track_handoff_preserves_the_full_query_string_without_recording_again(): void
    {
        $product = $this->product('CARD', 1);

        $this->get('/?id=card-00001&utm_source=nfc&campaign=launch')
            ->assertOk()
            ->assertSessionHas('url.intended', '/activate?id=CARD-00001&utm_source=nfc&campaign=launch')
            ->assertInertia(fn ($page) => $page
                ->component('Track/Tutorial')
                ->where('product.code_id', $product->code_id)
                ->where('continueUrl', '/activate?id=CARD-00001&utm_source=nfc&campaign=launch'));

        $this->get('/activate?id=CARD-00001&utm_source=nfc&campaign=launch')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Track/Index')->where('product.code_id', $product->code_id));

        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_legacy_configuration_url_redirects_to_the_canonical_entry_without_recording(): void
    {
        $this->product('CARD', 1);

        $this->get('/configuration?id=card-00001&utm_source=legacy')
            ->assertRedirect(route('home', ['id' => 'CARD-00001', 'utm_source' => 'legacy']))
            ->assertStatus(301);

        $this->assertDatabaseCount('scan_events', 0);
    }

    public function test_paused_and_unconfigured_products_fail_safely_and_are_not_eligible_scans(): void
    {
        $customer = Customer::create(['business_name' => 'Safe Business', 'status' => 'active']);
        $paused = $this->product('CARD', 1, ['customer_id' => $customer->id, 'status' => 'paused', 'google_review_url' => 'https://g.page/r/paused/review']);
        $unconfigured = $this->product('PLATE', 2, ['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => null]);

        $this->get('/?id='.$paused->code_id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Configuration/Unavailable')->where('reason', 'paused'));
        $this->get('/?id='.$unconfigured->code_id)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Configuration/Unavailable')->where('reason', 'unconfigured'));

        $this->assertDatabaseCount('scan_events', 2);
        $this->assertDatabaseMissing('scan_events', ['result' => 'redirected']);
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
}
