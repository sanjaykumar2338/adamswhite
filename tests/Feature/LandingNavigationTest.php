<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_landing_navigation_receives_no_authenticated_user(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn ($page) => $page
                ->component('Track/Index')
                ->where('auth.user', null));
    }

    public function test_authenticated_customer_landing_navigation_receives_customer_auth_state(): void
    {
        $customer = Customer::create(['business_name' => 'Customer Workspace']);
        $user = User::factory()->create(['is_admin' => false]);
        $customer->users()->attach($user, ['role' => 'owner', 'status' => 'active']);

        $this->actingAs($user)->get(route('home'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn ($page) => $page
                ->component('Track/Index')
                ->where('auth.user.id', $user->id)
                ->where('auth.user.is_admin', false));
    }

    public function test_authenticated_admin_landing_navigation_receives_admin_auth_state(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get(route('home'))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn ($page) => $page
                ->component('Track/Index')
                ->where('auth.user.id', $admin->id)
                ->where('auth.user.is_admin', true));
    }

    public function test_logout_returns_to_guest_landing_navigation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('logout'))->assertRedirect(route('home', absolute: false));

        $this->get(route('home'))->assertInertia(fn ($page) => $page->where('auth.user', null));
    }
}
