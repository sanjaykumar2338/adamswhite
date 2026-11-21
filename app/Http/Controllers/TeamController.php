<?php

namespace App\Http\Controllers;

use App\Http\Requests\InviteManagerRequest;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class TeamController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        return to_route('profile.edit', ['tab' => 'team']);
    }

    public function store(InviteManagerRequest $request): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $request->user()->roleFor($customer) === 'owner', 403);
        $email = strtolower($request->validated('email'));
        if ($customer->users()->where('email', $email)->wherePivot('status', 'active')->exists()) {
            return back()->withErrors(['email' => __('ui.validation.already_member')]);
        }
        if ($customer->invitations()->where('email', $email)->whereNull('accepted_at')->whereNull('revoked_at')->where('expires_at', '>', now())->exists()) {
            return back()->withErrors(['email' => __('ui.validation.invitation_pending')]);
        }
        $token = Str::random(64);
        $invitation = TeamInvitation::create(['customer_id' => $customer->id, 'invited_by' => $request->user()->id, 'email' => $email, 'role' => 'manager', 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addDays(7)]);
        Notification::route('mail', $invitation->email)->notify(new TeamInvitationNotification($token, $customer->business_name));

        return back()->with('success', __('ui.flash.invitation_sent'));
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $request->user()->roleFor($customer) === 'owner' && $user->id !== $request->user()->id, 403);
        abort_unless($customer->users()->whereKey($user->id)->wherePivot('role', 'manager')->exists(), 404);
        $customer->users()->updateExistingPivot($user->id, ['status' => 'revoked']);

        return back()->with('success', __('ui.flash.member_removed'));
    }

    public function revokeInvitation(Request $request, TeamInvitation $invitation): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $invitation->customer_id === $customer->id && $request->user()->roleFor($customer) === 'owner', 403);
        abort_if($invitation->accepted_at || $invitation->revoked_at, 422);
        $invitation->update(['revoked_at' => now(), 'revoked_by' => $request->user()->id]);

        return back()->with('success', __('ui.flash.invitation_revoked'));
    }
}
