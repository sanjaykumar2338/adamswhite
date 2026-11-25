<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailBrandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_verification_email_uses_consistent_shiftrix_track_branding(): void
    {
        $user = User::factory()->unverified()->create();
        $message = (new VerifyEmail)->toMail($user);
        $html = $message->render();

        $this->assertSame('Verify Email Address', $message->subject);
        $this->assertSame('SHIFTRIX Track', config('mail.from.name'));
        $this->assertStringContainsString('SHIFTRIX Track', $html);
        $this->assertStringNotContainsString('Shiftrix Track', $html);
    }

    public function test_password_reset_email_uses_consistent_shiftrix_track_branding(): void
    {
        $user = User::factory()->create();
        $message = (new ResetPassword('test-token'))->toMail($user);
        $html = $message->render();

        $this->assertSame('Reset Password Notification', $message->subject);
        $this->assertSame('SHIFTRIX Track', config('mail.from.name'));
        $this->assertStringContainsString('SHIFTRIX Track', $html);
        $this->assertStringNotContainsString('Shiftrix Track', $html);
    }
}
