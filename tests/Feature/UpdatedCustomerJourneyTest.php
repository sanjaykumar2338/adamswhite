<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class UpdatedCustomerJourneyTest extends TestCase
{
    use RefreshDatabase;

    private InventoryImport $import;

    private Batch $batch;

    protected function setUp(): void
    {
        parent::setUp();
        $this->import = InventoryImport::create(['original_filename' => 'journey.xlsx', 'file_sha256' => str_repeat('c', 64), 'total_rows' => 3, 'commercial_rows' => 3, 'backup_rows' => 0, 'status' => 'imported']);
        $this->batch = Batch::create(['lot_number' => 1, 'code' => 'LOT-01', 'commercial_count' => 3, 'backup_count' => 0, 'total_count' => 3, 'inventory_import_id' => $this->import->id]);
    }

    private function product(string $variant, int $sequence): Product
    {
        return Product::create([
            'batch_id' => $this->batch->id,
            'inventory_import_id' => $this->import->id,
            'code_id' => sprintf('%s-%05d', $variant, $sequence),
            'variant' => $variant,
            'code_sequence' => $sequence,
            'unit_type' => 'commercial',
            'position_in_batch' => $sequence,
            'source_line' => $sequence,
            'status' => 'unclaimed',
        ]);
    }

    public function test_track_recognizes_all_inventory_variants_and_shows_the_tutorial(): void
    {
        foreach (['CARD', 'PLATE', 'STAND'] as $index => $variant) {
            $product = $this->product($variant, $index + 1);
            $this->get('/?id='.$product->code_id)->assertOk()->assertInertia(fn ($page) => $page
                ->component('Track/Tutorial')
                ->where('product.code_id', $product->code_id)
                ->where('product.variant', $variant)
                ->where('continueUrl', '/activate?id='.$product->code_id));
        }

        $this->assertDatabaseCount('scan_events', 3);
    }

    public function test_manual_unknown_product_is_rejected_by_inventory_lookup(): void
    {
        $this->get('/?id=CARD-99999')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Track/Index')->where('invalid', true)->where('product', null));
    }

    public function test_product_id_survives_login_and_email_verification(): void
    {
        $product = $this->product('CARD', 1);
        $user = User::factory()->unverified()->create();
        $customer = Customer::create(['business_name' => 'Journey Cafe', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);

        $this->get('/?id='.$product->code_id);
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect('/activate?id='.$product->code_id);

        $this->get('/activate?id='.$product->code_id)->assertInertia(fn ($page) => $page->where('needsVerification', true));
        $verificationUrl = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($verificationUrl)->assertRedirect('/activate?id='.$product->code_id);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_language_switch_persists_for_guests_and_users(): void
    {
        $this->post('/locale/fr')->assertRedirect();
        $this->get('/')->assertInertia(fn ($page) => $page->where('locale', 'fr'));

        $user = User::factory()->create(['preferred_locale' => 'en']);
        $this->actingAs($user)->post('/locale/fr')->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'preferred_locale' => 'fr']);
        $this->actingAs($user)->get('/')->assertInertia(fn ($page) => $page->where('locale', 'fr'));
    }

    public function test_french_validation_message_is_returned(): void
    {
        $this->withSession(['locale' => 'fr'])->post('/register', [])->assertSessionHasErrors([
            'name' => 'Le champ nom est obligatoire.',
            'business_name' => "Le champ nom de l'entreprise est obligatoire.",
        ]);
    }
}
