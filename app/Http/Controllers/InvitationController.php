<?php

namespace App\Http\Controllers;

use App\Models\TeamInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = TeamInvitation::where('token_hash', hash('sha256', $token))->whereNull('accepted_at')->whereNull('revoked_at')->where('expires_at', '>', now())->firstOrFail();
        abort_unless(strcasecmp($request->user()->email, $invitation->email) === 0, 403);
        $invitation->customer->users()->syncWithoutDetaching([$request->user()->id => ['role' => $invitation->role, 'status' => 'active']]);
        $invitation->update(['accepted_at' => now()]);

        return to_route('dashboard')->with('success', __('ui.flash.invitation_accepted'));
    }
}
