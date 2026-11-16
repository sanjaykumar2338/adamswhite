<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_is_forbidden(): void
    {
        $this->actingAs(User::factory()->create())->get('/admin')->assertForbidden();
    }

    public function test_admin_can_view_dashboard(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]))->get('/admin')->assertOk();
    }
}
