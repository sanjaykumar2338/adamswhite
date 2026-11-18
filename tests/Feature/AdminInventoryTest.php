<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminInventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private InventoryImport $import;

    private Batch $firstBatch;

    private Batch $secondBatch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['is_admin' => true]);
        $this->import = InventoryImport::create([
            'original_filename' => 'inventory-test.xlsx',
            'file_sha256' => str_repeat('d', 64),
            'total_rows' => 56,
            'commercial_rows' => 55,
            'backup_rows' => 1,
            'status' => 'imported',
        ]);
        $this->firstBatch = $this->batch(1);
        $this->secondBatch = $this->batch(2);

        foreach (range(1, 55) as $sequence) {
            $this->product($sequence);
        }

        $this->product(56, [
            'batch_id' => $this->secondBatch->id,
            'variant' => 'PLATE',
            'code_id' => 'PLATE-00056',
            'unit_type' => 'backup',
            'status' => 'disabled',
        ]);
    }

    public function test_inventory_is_paginated_and_page_links_preserve_filters(): void
    {
        $this->actingAs($this->admin)
            ->get(route('admin.products.index', ['variant' => 'CARD', 'page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('products.data', 5)
                ->where('products.current_page', 2)
                ->where('products.total', 55)
                ->where('totalProducts', 56)
                ->where('filters.variant', 'CARD')
                ->where('products.prev_page_url', fn ($url) => str_contains($url, 'variant=CARD'))
            );
    }

    public function test_inventory_search_and_all_filters_can_be_combined(): void
    {
        $this->actingAs($this->admin)
            ->get(route('admin.products.index', [
                'search' => 'PLATE-00056',
                'variant' => 'PLATE',
                'batch' => $this->secondBatch->id,
                'status' => 'disabled',
                'unit_type' => 'backup',
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.code_id', 'PLATE-00056')
                ->where('products.data.0.unit_type', 'backup')
                ->where('products.total', 1)
                ->where('totalProducts', 56)
                ->has('batches', 2)
            );
    }

    public function test_product_code_search_is_partial(): void
    {
        $this->actingAs($this->admin)
            ->get(route('admin.products.index', ['search' => '00055']))
            ->assertInertia(fn ($page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.code_id', 'CARD-00055')
            );
    }

    private function batch(int $lot): Batch
    {
        return Batch::create([
            'lot_number' => $lot,
            'code' => sprintf('LOT-%02d', $lot),
            'commercial_count' => 55,
            'backup_count' => 1,
            'total_count' => 56,
            'inventory_import_id' => $this->import->id,
        ]);
    }

    private function product(int $sequence, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'batch_id' => $this->firstBatch->id,
            'inventory_import_id' => $this->import->id,
            'code_id' => sprintf('CARD-%05d', $sequence),
            'variant' => 'CARD',
            'code_sequence' => $sequence,
            'unit_type' => 'commercial',
            'position_in_batch' => $sequence,
            'source_line' => $sequence,
            'status' => 'unclaimed',
        ], $overrides));
    }
}
