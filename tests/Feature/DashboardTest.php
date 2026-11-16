<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_customer_can_view_dashboard(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['business_name' => 'Test', 'max_products' => 10]);
        $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);
        $this->actingAs($user)->get('/saas/dashboard')->assertOk()->assertInertia(fn ($page) => $page->component('Dashboard')->where('customer.business_name', 'Test'));
    }
}
