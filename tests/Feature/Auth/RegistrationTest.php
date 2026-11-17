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
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_returns_to_scanned_product(): void
    {
        $this->withSession(['url.intended' => '/?id=CARD-00001', 'locale' => 'fr'])->post('/register', [
            'name' => 'Scan User',
            'business_name' => 'Scan Business',
            'email' => 'scan@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/?id=CARD-00001');

        $this->assertDatabaseHas('users', ['email' => 'scan@example.com', 'preferred_locale' => 'fr']);
    }
}
