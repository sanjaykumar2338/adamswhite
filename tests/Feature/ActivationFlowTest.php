<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivationFlowTest extends TestCase
{
    use RefreshDatabase;

    private function product(array $overrides = []): Product
    {
        $import = InventoryImport::create(['original_filename' => 'test.xlsx', 'file_sha256' => str_repeat('a', 64), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);

        return Product::create(array_merge(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'code_id' => 'CARD-00001', 'variant' => 'CARD', 'code_sequence' => 1, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => 1, 'status' => 'unclaimed'], $overrides));
    }

    public function test_unclaimed_product_shows_the_local_tutorial_and_records_one_scan(): void
    {
        $product = $this->product();
        $this->get('/?id=CARD-00001')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Track/Tutorial')
            ->where('product.code_id', 'CARD-00001')
            ->where('continueUrl', '/activate?id=CARD-00001'));
        $this->assertDatabaseHas('scan_events', ['product_id' => $product->id, 'result' => 'unclaimed']);
        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_owner_can_claim_product_and_active_scan_redirects(): void
    {
        $product = $this->product();
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Cafe Test', 'status' => 'active', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $url = 'https://g.page/r/example/review';
        $this->actingAs($user)->post('/activations', ['code_id' => $product->code_id, 'business_name' => 'Cafe Updated', 'google_review_url' => $url])->assertSessionHasNoErrors();
        $this->get('/?id=CARD-00001')->assertRedirect($url);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'customer_id' => $customer->id, 'status' => 'active']);
        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'business_name' => 'Cafe Updated']);
        $this->assertDatabaseCount('scan_events', 1);
    }

    public function test_product_cannot_be_claimed_twice(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'One', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $this->product(['customer_id' => $customer->id, 'status' => 'active', 'google_review_url' => 'https://g.page/r/first/review']);
        $this->actingAs($user)->post('/activations', ['code_id' => 'CARD-00001', 'business_name' => 'One', 'google_review_url' => 'https://g.page/r/second/review'])->assertSessionHasErrors('code_id');
    }

    public function test_invalid_google_redirect_is_rejected(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'One', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $this->product();

        $this->actingAs($user)->post('/activations', ['code_id' => 'CARD-00001', 'business_name' => 'One', 'google_review_url' => 'https://google.com.evil.example/review'])->assertSessionHasErrors('google_review_url');
        $this->assertDatabaseHas('products', ['code_id' => 'CARD-00001', 'status' => 'unclaimed']);
    }
}
