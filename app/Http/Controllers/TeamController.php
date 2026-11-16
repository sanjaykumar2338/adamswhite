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
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);

        return Inertia::render('Team/Index', ['customer' => $customer, 'role' => $request->user()->roleFor($customer), 'members' => $customer->users()->get(), 'invitations' => $customer->invitations()->whereNull('accepted_at')->where('expires_at', '>', now())->get()]);
    }

    public function store(InviteManagerRequest $request): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $request->user()->roleFor($customer) === 'owner', 403);
        $token = Str::random(64);
        $invitation = TeamInvitation::create(['customer_id' => $customer->id, 'invited_by' => $request->user()->id, 'email' => strtolower($request->validated('email')), 'role' => 'manager', 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addDays(7)]);
        Notification::route('mail', $invitation->email)->notify(new TeamInvitationNotification($token, $customer->business_name));

        return back()->with('success', 'Manager invitation sent.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $request->user()->roleFor($customer) === 'owner' && $user->id !== $request->user()->id, 403);
        $customer->users()->detach($user->id);

        return back()->with('success', 'Team member removed.');
    }
}
