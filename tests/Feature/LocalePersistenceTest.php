<?php

namespace Tests\Feature;

use App\Http\Middleware\SetLocale;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalePersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_locale_survives_public_navigation_refreshes_and_auth_pages(): void
    {
        $this->post('/locale/fr')
            ->assertRedirect()
            ->assertCookie(SetLocale::COOKIE, 'fr');

        foreach (['/', '/activate', '/login', '/register', '/privacy'] as $path) {
            $this->get($path)->assertInertia(fn ($page) => $page->where('locale', 'fr'));
        }
    }

    public function test_authenticated_locale_is_shared_across_the_customer_application(): void
    {
        $user = User::factory()->create(['preferred_locale' => 'fr']);
        $customer = Customer::create(['business_name' => 'Équipe Locale', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);

        $this->actingAs($user);

        foreach (['/dashboard', '/products', '/team', '/statistics', '/profile', '/help'] as $path) {
            $this->followingRedirects()->get($path)
                ->assertInertia(fn ($page) => $page->where('locale', 'fr'));
        }
    }

    public function test_browser_selection_updates_the_user_and_survives_logout(): void
    {
        $user = User::factory()->create(['preferred_locale' => 'en']);
        $customer = Customer::create(['business_name' => 'Persistent Locale', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);

        $this->actingAs($user)->post('/locale/fr')
            ->assertCookie(SetLocale::COOKIE, 'fr');
        $this->assertSame('fr', $user->fresh()->preferred_locale);

        $this->post('/logout')
            ->assertRedirect('/')
            ->assertCookie(SetLocale::COOKIE, 'fr');

        $this->get('/login')->assertInertia(fn ($page) => $page->where('locale', 'fr'));
        $this->post('/login', ['email' => $user->email, 'password' => 'password']);
        $this->get('/dashboard')->assertInertia(fn ($page) => $page->where('locale', 'fr'));
    }

    public function test_saved_user_locale_wins_when_a_browser_has_no_selection(): void
    {
        $user = User::factory()->create(['preferred_locale' => 'fr']);
        $customer = Customer::create(['business_name' => 'French Login', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertCookie(SetLocale::COOKIE, 'fr');
        $this->get('/dashboard')->assertInertia(fn ($page) => $page->where('locale', 'fr'));
    }
}
