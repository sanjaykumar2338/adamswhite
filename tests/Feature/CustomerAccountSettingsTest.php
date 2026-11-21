<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Models\ScanEvent;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class CustomerAccountSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_supports_first_and_last_name_updates(): void
    {
        [$owner] = $this->workspace();

        $this->actingAs($owner)->patch(route('profile.update'), [
            'first_name' => 'Sophie', 'last_name' => 'Martin', 'email' => 'sophie@example.com',
        ])->assertSessionHasNoErrors();

        $owner->refresh();
        $this->assertSame('Sophie', $owner->first_name);
        $this->assertSame('Martin', $owner->last_name);
        $this->assertSame('Sophie Martin', $owner->name);
        $this->assertNull($owner->email_verified_at);
    }

    public function test_password_change_requires_the_current_password(): void
    {
        [$owner] = $this->workspace();

        $this->actingAs($owner)->put(route('password.update'), ['current_password' => 'wrong', 'password' => 'SaferPassword123!', 'password_confirmation' => 'SaferPassword123!'])->assertSessionHasErrors('current_password');
        $this->actingAs($owner)->put(route('password.update'), ['current_password' => 'password', 'password' => 'SaferPassword123!', 'password_confirmation' => 'SaferPassword123!'])->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('SaferPassword123!', $owner->fresh()->password));
    }

    public function test_database_sessions_are_listed_without_exposing_session_ids_and_can_be_revoked(): void
    {
        config(['session.driver' => 'database']);
        [$owner] = $this->workspace();
        DB::table('sessions')->insert(['id' => 'sensitive-session-token', 'user_id' => $owner->id, 'ip_address' => '203.0.113.42', 'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0', 'payload' => 'test', 'last_activity' => now()->timestamp]);

        $response = $this->actingAs($owner)->get(route('profile.edit', ['tab' => 'security']))->assertOk()->assertInertia(fn ($page) => $page
            ->where('sessions.persistent', true)->has('sessions.items', 2)->where('sessions.items.1.device', 'Chrome · macOS')->where('sessions.items.1.ip', '203.0.x.x')
        );
        $this->assertStringNotContainsString('sensitive-session-token', $response->getContent());

        $this->actingAs($owner)->post(route('sessions.destroy-others'), ['password' => 'wrong'])->assertSessionHasErrors('password');
        $this->assertDatabaseHas('sessions', ['id' => 'sensitive-session-token']);
        $this->actingAs($owner)->post(route('sessions.destroy-others'), ['password' => 'password'])->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('sessions', ['id' => 'sensitive-session-token']);
    }

    public function test_owner_can_invite_and_revoke_manager_invitations(): void
    {
        Notification::fake();
        [$owner, $customer] = $this->workspace();

        $this->actingAs($owner)->post(route('team.store'), ['email' => 'manager@example.com'])->assertSessionHasNoErrors();
        $invitation = TeamInvitation::firstOrFail();
        $this->assertSame('pending', $invitation->state);
        Notification::assertSentOnDemand(TeamInvitationNotification::class);

        $this->actingAs($owner)->patch(route('team.invitations.revoke', $invitation))->assertSessionHasNoErrors();
        $this->assertSame('revoked', $invitation->fresh()->state);
        $this->assertSame($customer->id, $invitation->customer_id);
    }

    public function test_matching_user_can_accept_an_active_invitation_and_state_becomes_accepted(): void
    {
        [$owner, $customer] = $this->workspace();
        $manager = User::factory()->create(['email' => 'accepted@example.com']);
        $token = Str::random(64);
        $invitation = TeamInvitation::create(['customer_id' => $customer->id, 'invited_by' => $owner->id, 'email' => $manager->email, 'role' => 'manager', 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addDay()]);

        $this->actingAs($manager)->get(route('invitations.accept', $token))->assertRedirect(route('dashboard'));

        $this->assertSame('accepted', $invitation->fresh()->state);
        $this->assertDatabaseHas('customer_memberships', ['customer_id' => $customer->id, 'user_id' => $manager->id, 'role' => 'manager', 'status' => 'active']);
    }

    public function test_manager_permissions_and_cross_customer_isolation_are_enforced(): void
    {
        [$owner, $customer] = $this->workspace();
        $manager = User::factory()->create();
        $customer->users()->attach($manager->id, ['role' => 'manager', 'status' => 'active']);
        [, $otherCustomer] = $this->workspace(2);
        $otherManager = User::factory()->create();
        $otherCustomer->users()->attach($otherManager->id, ['role' => 'manager', 'status' => 'active']);

        $this->actingAs($manager)->post(route('team.store'), ['email' => 'escalate@example.com'])->assertForbidden();
        $this->actingAs($manager)->delete(route('team.destroy', $owner))->assertForbidden();
        $this->actingAs($owner)->delete(route('team.destroy', $otherManager))->assertNotFound();

        $this->actingAs($owner)->delete(route('team.destroy', $manager))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('customer_memberships', ['customer_id' => $customer->id, 'user_id' => $manager->id, 'role' => 'manager', 'status' => 'revoked']);
        $this->actingAs($manager)->get(route('dashboard'))->assertForbidden();
    }

    public function test_multi_site_manager_can_switch_only_between_assigned_organizations(): void
    {
        [$owner, $first] = $this->workspace();
        [, $second] = $this->workspace(2);
        [, $unrelated] = $this->workspace(3);
        $second->users()->attach($owner->id, ['role' => 'manager', 'status' => 'active']);

        $this->actingAs($owner)->post(route('workspaces.update', $second))->assertRedirect(route('dashboard'));
        $this->assertSame($second->id, $owner->currentCustomer()->id);
        $this->actingAs($owner)->post(route('workspaces.update', $unrelated))->assertForbidden();
    }

    public function test_privacy_export_requires_recent_password_confirmation_and_is_customer_scoped(): void
    {
        [$owner, $customer] = $this->workspace();
        $this->productWithScan($customer, 'CARD-00001');
        [, $other] = $this->workspace(2);
        $this->productWithScan($other, 'PLATE-00002');

        $this->actingAs($owner)->get(route('privacy.export'))->assertRedirect(route('password.confirm'));
        $content = $this->withSession(['auth.password_confirmed_at' => time()])->actingAs($owner)->get(route('privacy.export'))->assertOk()->streamedContent();
        $this->assertStringContainsString('CARD-00001', $content);
        $this->assertStringNotContainsString('PLATE-00002', $content);
        $this->assertStringNotContainsString('password', $content);
        $this->assertStringNotContainsString('request_uuid', $content);
    }

    public function test_deletion_request_preserves_account_products_nfc_url_and_scans(): void
    {
        [$owner, $customer] = $this->workspace();
        $product = $this->productWithScan($customer, 'STAND-00003');

        $this->actingAs($owner)->post(route('privacy.deletion-request'), ['password' => 'password', 'reason' => 'Please review'])->assertSessionHasNoErrors();

        $this->assertNotNull($owner->fresh());
        $this->assertNotNull($product->fresh());
        $this->assertSame('https://shiftrix.io/configuration?id=STAND-00003', $product->fresh()->nfc_url);
        $this->assertDatabaseCount('scan_events', 1);
        $this->assertDatabaseHas('account_deletion_requests', ['user_id' => $owner->id, 'customer_id' => $customer->id, 'status' => 'pending']);
    }

    public function test_authenticated_customer_can_access_help_with_unconfigured_whatsapp_fallback(): void
    {
        [$owner] = $this->workspace();
        config(['services.shiftrix.whatsapp_url' => null]);

        $this->actingAs($owner)->get(route('help'))->assertOk()->assertInertia(fn ($page) => $page->component('Help/Index')->where('whatsappUrl', null));
    }

    public function test_admin_can_review_request_without_deleting_customer_data(): void
    {
        [$owner, $customer] = $this->workspace();
        $product = $this->productWithScan($customer, 'CARD-00009');
        $this->actingAs($owner)->post(route('privacy.deletion-request'), ['password' => 'password']);
        $request = $owner->deletionRequests()->firstOrFail();
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get(route('admin.deletion-requests.index'))->assertOk();
        $this->actingAs($admin)->patch(route('admin.deletion-requests.update', $request), ['status' => 'approved', 'admin_notes' => 'Identity verified'])->assertSessionHasNoErrors();

        $request->refresh();
        $this->assertSame('approved', $request->status);
        $this->assertSame($admin->id, $request->reviewed_by);
        $this->assertNotNull($owner->fresh());
        $this->assertNotNull($product->fresh());
        $this->assertDatabaseCount('scan_events', 1);
    }

    private function workspace(int $suffix = 1): array
    {
        $owner = User::factory()->create(['email' => "owner{$suffix}@example.com"]);
        $customer = Customer::create(['business_name' => "Organization {$suffix}", 'max_products' => 10]);
        $customer->users()->attach($owner->id, ['role' => 'owner', 'status' => 'active']);

        return [$owner, $customer];
    }

    private function productWithScan(Customer $customer, string $code): Product
    {
        $suffix = (int) filter_var($code, FILTER_SANITIZE_NUMBER_INT);
        $import = InventoryImport::create(['original_filename' => "privacy-{$suffix}.xlsx", 'file_sha256' => hash('sha256', $code), 'total_rows' => 1, 'commercial_rows' => 1, 'backup_rows' => 0, 'status' => 'imported']);
        $batch = Batch::create(['lot_number' => $suffix, 'code' => 'LOT-'.$suffix, 'commercial_count' => 1, 'backup_count' => 0, 'total_count' => 1, 'inventory_import_id' => $import->id]);
        $variant = explode('-', $code)[0];
        $product = Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'customer_id' => $customer->id, 'code_id' => $code, 'variant' => $variant, 'code_sequence' => $suffix, 'unit_type' => 'commercial', 'position_in_batch' => 1, 'source_line' => $suffix, 'status' => 'active', 'google_review_url' => 'https://g.page/r/example/review']);
        ScanEvent::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'request_uuid' => (string) Str::uuid(), 'result' => 'redirected', 'is_probable_bot' => false, 'scanned_at' => now()]);

        return $product;
    }
}
