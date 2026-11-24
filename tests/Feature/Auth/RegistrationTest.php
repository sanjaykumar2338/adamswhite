<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'business_name' => 'Test Business',
            'account_type' => 'business',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('customers', ['business_name' => 'Test Business', 'account_type' => 'business']);
    }

    public function test_registration_returns_to_scanned_product(): void
    {
        $this->withSession(['url.intended' => '/?id=CARD-00001', 'locale' => 'fr'])->post('/register', [
            'name' => 'Scan User',
            'business_name' => '',
            'account_type' => 'individual',
            'email' => 'scan@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/?id=CARD-00001');

        $this->assertDatabaseHas('users', ['email' => 'scan@example.com', 'preferred_locale' => 'fr']);
        $this->assertDatabaseHas('customers', ['business_name' => 'Scan User', 'account_type' => 'individual']);
    }

    public function test_registration_requires_a_supported_account_type(): void
    {
        $payload = [
            'name' => 'Segmented User',
            'business_name' => 'Segmented Workspace',
            'email' => 'segment@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        $this->post('/register', $payload)->assertSessionHasErrors('account_type');
        $this->post('/register', [...$payload, 'account_type' => 'unsupported'])->assertSessionHasErrors('account_type');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'segment@example.com']);
    }

    public function test_business_registration_requires_a_business_name(): void
    {
        $this->post('/register', [
            'name' => 'Business Owner',
            'business_name' => '',
            'account_type' => 'business',
            'email' => 'owner@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertSessionHasErrors('business_name');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'owner@example.com']);
    }
}
