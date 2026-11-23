<?php

namespace Tests\Feature;

use App\Models\Activation;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Services\NfcUrlMigrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NfcUrlMigrationTest extends TestCase
{
    use RefreshDatabase;

    private string $backupDirectory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->backupDirectory = storage_path('framework/testing/nfc-'.Str::uuid());
    }

    protected function tearDown(): void
    {
        if (is_dir($this->backupDirectory)) {
            foreach (glob($this->backupDirectory.'/*') ?: [] as $file) {
                unlink($file);
            }
            rmdir($this->backupDirectory);
        }

        parent::tearDown();
    }

    public function test_migration_is_backed_up_idempotent_and_reversible_without_touching_business_data(): void
    {
        $import = InventoryImport::create(['original_filename' => 'migration.xlsx', 'file_sha256' => str_repeat('d', 64), 'total_rows' => 2, 'commercial_rows' => 2, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 9, 'code' => 'LOT-09', 'commercial_count' => 2, 'backup_count' => 0, 'total_count' => 2, 'inventory_import_id' => $import->id]);
        $customer = Customer::create(['business_name' => 'Migration Cafe', 'status' => 'active']);
        $first = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $customer->id, 'code_id' => 'CARD-00001', 'variant' => 'CARD', 'code_sequence' => 1, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => 1, 'status' => 'active', 'nfc_url' => 'https://shiftrix.io/configuration?id=CARD-00001', 'google_review_url' => 'https://g.page/r/migration/review']);
        $second = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'code_id' => 'PLATE-00002', 'variant' => 'PLATE', 'code_sequence' => 2, 'unit_type' => 'commercial', 'position_in_batch' => 2, 'source_line' => 2, 'status' => 'unclaimed', 'nfc_url' => null]);
        ScanEvent::create(['product_id' => $first->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => false, 'scanned_at' => now()]);
        Activation::create(['product_id' => $first->id, 'customer_id' => $customer->id, 'action' => 'activated', 'activated_at' => now()]);

        $service = app(NfcUrlMigrationService::class);
        $dryRun = $service->audit(2);
        $this->assertSame(2, $dryRun['products']);
        $this->assertSame(2, $dryRun['unique_ids']);
        $this->assertSame(2, $dryRun['unique_canonical_urls']);
        $this->assertSame(2, $dryRun['urls_to_change']);
        $this->assertSame(1, $dryRun['scan_events']);
        $this->assertSame(1, $dryRun['activations']);
        $this->assertSame([], $dryRun['errors']);

        $applied = $service->apply($this->backupDirectory, 2);
        $this->assertFileExists($applied['backup']['path']);
        $this->assertFileExists($applied['backup']['checksum_path']);
        $this->assertSame(hash_file('sha256', $applied['backup']['path']), $applied['backup']['sha256']);
        $this->assertSame(0, $applied['after']['urls_to_change']);
        $this->assertSame('https://app.shiftrix.io/?id=CARD-00001', $first->fresh()->getRawOriginal('nfc_url'));
        $this->assertSame('https://app.shiftrix.io/?id=PLATE-00002', $second->fresh()->getRawOriginal('nfc_url'));

        $secondApply = $service->apply($this->backupDirectory, 2);
        $this->assertSame(0, $secondApply['before']['urls_to_change']);
        $this->assertSame(0, $secondApply['after']['urls_to_change']);

        $rollback = $service->rollback($applied['backup']['path'], 2);
        $this->assertSame(2, $rollback['restored_rows']);
        $this->assertSame('https://shiftrix.io/configuration?id=CARD-00001', $first->fresh()->getRawOriginal('nfc_url'));
        $this->assertNull($second->fresh()->getRawOriginal('nfc_url'));
        $this->assertDatabaseHas('products', ['id' => $first->id, 'batch_id' => $batch->id, 'customer_id' => $customer->id, 'status' => 'active']);
        $this->assertDatabaseHas('products', ['id' => $second->id, 'batch_id' => $batch->id, 'customer_id' => null, 'status' => 'unclaimed']);
        $this->assertDatabaseCount('scan_events', 1);
        $this->assertDatabaseCount('activations', 1);
    }

    public function test_command_is_a_non_mutating_dry_run_by_default(): void
    {
        $import = InventoryImport::create(['original_filename' => 'command.xlsx', 'file_sha256' => str_repeat('e', 64), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $product = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'code_id' => 'STAND-00001', 'variant' => 'STAND', 'code_sequence' => 1, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => 1, 'status' => 'unclaimed', 'nfc_url' => null]);

        $this->artisan('shiftrix:nfc-urls', ['--expected-count' => 1])
            ->expectsOutputToContain('Dry-run passed. No database changes were made.')
            ->assertSuccessful();

        $this->assertNull($product->fresh()->getRawOriginal('nfc_url'));
    }
}
