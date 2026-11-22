<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_sees_only_owned_products_and_exact_nfc_urls(): void
    {
        [$user, $customer, $batch, $import] = $this->workspace();
        $owned = $this->product($customer, $batch, $import, 'CARD-00001', 'CARD', 1);
        $other = Customer::create(['business_name' => 'Other', 'max_products' => 10]);
        $this->product($other, $batch, $import, 'PLATE-00002', 'PLATE', 2);

        $this->actingAs($user)->get(route('products.index'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->has('products', 1)
            ->where('products.0.id', $owned->id)
            ->where('products.0.code_id', 'CARD-00001')
            ->where('products.0.variant', 'CARD')
            ->where('products.0.nfc_url', 'https://shiftrix.io/configuration?id=CARD-00001')
        );
    }

    public function test_customer_can_rename_product_and_update_valid_google_url(): void
    {
        [$user, $customer, $batch, $import] = $this->workspace();
        $product = $this->product($customer, $batch, $import, 'STAND-00001', 'STAND', 1);

        $this->actingAs($user)->patch(route('products.update', $product), [
            'display_name' => 'Main Branch',
            'google_review_url' => 'https://maps.app.goo.gl/example',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'display_name' => 'Main Branch', 'google_review_url' => 'https://maps.app.goo.gl/example']);
        $this->assertDatabaseHas('review_link_histories', ['product_id' => $product->id, 'new_url' => 'https://maps.app.goo.gl/example']);
    }

    public function test_invalid_google_url_is_rejected(): void
    {
        [$user, $customer, $batch, $import] = $this->workspace();
        $product = $this->product($customer, $batch, $import, 'PLATE-00001', 'PLATE', 1);

        $this->actingAs($user)->from(route('products.index'))->patch(route('products.update', $product), [
            'display_name' => 'Room 12',
            'google_review_url' => 'https://evil.example/review',
        ])->assertSessionHasErrors('google_review_url');

        $this->assertDatabaseMissing('products', ['id' => $product->id, 'display_name' => 'Room 12']);
    }

    public function test_cross_customer_updates_are_forbidden(): void
    {
        [$user, $customer, $batch, $import] = $this->workspace();
        $other = Customer::create(['business_name' => 'Other', 'max_products' => 10]);
        $product = $this->product($other, $batch, $import, 'CARD-00002', 'CARD', 2);

        $this->actingAs($user)->patch(route('products.update', $product), [
            'display_name' => 'Stolen',
            'google_review_url' => 'https://g.page/r/other/review',
        ])->assertForbidden();

        $this->assertNull($product->fresh()->display_name);
    }

    public function test_search_and_type_filters_support_multiple_products(): void
    {
        [$user, $customer, $batch, $import] = $this->workspace();
        $card = $this->product($customer, $batch, $import, 'CARD-00001', 'CARD', 1);
        $card->update(['display_name' => 'Alice']);
        $this->product($customer, $batch, $import, 'PLATE-00002', 'PLATE', 2);
        $this->product($customer, $batch, $import, 'STAND-00003', 'STAND', 3);

        $this->actingAs($user)->get(route('products.index', ['search' => 'Alice', 'variant' => 'CARD']))->assertInertia(fn ($page) => $page
            ->has('products', 1)->where('products.0.id', $card->id)->where('counts.all', 3)
        );
    }

    public function test_owner_can_pause_and_reactivate_without_changing_identifier_or_nfc_url(): void
    {
        [$user, $customer, $batch, $import] = $this->workspace();
        $product = $this->product($customer, $batch, $import, 'CARD-00001', 'CARD', 1);
        $originalUrl = $product->nfc_url;

        $this->actingAs($user)->patch(route('products.status', $product), ['status' => 'paused'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'code_id' => 'CARD-00001', 'status' => 'paused', 'customer_id' => $customer->id]);
        $this->assertSame($originalUrl, $product->fresh()->nfc_url);
        $this->assertDatabaseHas('activations', ['product_id' => $product->id, 'action' => 'paused']);
        $this->get('/configuration?id=CARD-00001')->assertRedirect(route('configuration.unavailable', ['id' => 'CARD-00001']));

        $this->actingAs($user)->patch(route('products.status', $product), ['status' => 'active'])->assertSessionHasNoErrors();
        $this->assertSame($originalUrl, $product->fresh()->nfc_url);
        $this->get('/configuration?id=CARD-00001')->assertRedirect('https://g.page/r/example/review');
    }

    public function test_customer_cannot_pause_another_customers_product(): void
    {
        [$user, , $batch, $import] = $this->workspace();
        $other = Customer::create(['business_name' => 'Other', 'max_products' => 10]);
        $product = $this->product($other, $batch, $import, 'PLATE-00002', 'PLATE', 2);

        $this->actingAs($user)->patch(route('products.status', $product), ['status' => 'paused'])->assertForbidden();
        $this->assertSame('active', $product->fresh()->status);
    }

    private function workspace(): array
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Test', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $import = InventoryImport::create(['original_filename' => 'products.xlsx', 'file_sha256' => str_repeat('f', 64), 'total_rows' => 3, 'commercial_rows' => 3, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 3, 'backup_count' => 0, 'total_count' => 3, 'inventory_import_id' => $import->id]);

        return [$user, $customer, $batch, $import];
    }

    private function product(Customer $customer, Batch $batch, InventoryImport $import, string $code, string $variant, int $position): Product
    {
        return Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $customer->id, 'code_id' => $code, 'variant' => $variant, 'code_sequence' => $position, 'unit_type' => 'commercial', 'position_in_batch' => $position, 'source_line' => $position, 'status' => 'active', 'google_review_url' => 'https://g.page/r/example/review']);
    }
}
