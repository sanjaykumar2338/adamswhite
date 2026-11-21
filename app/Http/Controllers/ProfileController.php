<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $customer = $request->user()->currentCustomer();
        $sessions = $this->sessions($request);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'activeTab' => in_array($request->query('tab'), ['profile', 'security', 'team', 'privacy'], true) ? $request->query('tab') : 'profile',
            'customer' => $customer,
            'role' => $customer ? $request->user()->roleFor($customer) : null,
            'members' => $customer?->users()->orderBy('name')->get() ?? [],
            'invitations' => $customer?->invitations()->latest()->get()->each->append('state') ?? [],
            'sessions' => $sessions,
            'deletionRequest' => $request->user()->deletionRequests()->where('status', 'pending')->latest()->first(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        if (array_key_exists('first_name', $validated) || array_key_exists('last_name', $validated)) {
            $validated['name'] = trim(($validated['first_name'] ?? '').' '.($validated['last_name'] ?? ''));
        } elseif (array_key_exists('name', $validated)) {
            $parts = preg_split('/\s+/', trim($validated['name']), 2);
            $validated['first_name'] = $parts[0] ?? null;
            $validated['last_name'] = $parts[1] ?? null;
        }
        $request->user()->fill($validated);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', __('ui.flash.profile_updated'));
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $this->createDeletionRequest($request);

        return Redirect::route('profile.edit', ['tab' => 'privacy'])->with('success', __('ui.flash.deletion_requested'));
    }

    public function requestDeletion(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password'], 'reason' => ['nullable', 'string', 'max:2000']]);
        $this->createDeletionRequest($request);

        return Redirect::route('profile.edit', ['tab' => 'privacy'])->with('success', __('ui.flash.deletion_requested'));
    }

    private function createDeletionRequest(Request $request): void
    {
        $request->user()->deletionRequests()->firstOrCreate(['status' => 'pending'], [
            'customer_id' => $request->user()->currentCustomer()?->id,
            'reason' => $request->input('reason'),
            'requested_at' => now(),
        ]);
    }

    private function sessions(Request $request): array
    {
        $currentId = $request->session()->getId();
        $current = [[
            'key' => 'current', 'current' => true, 'device' => $this->deviceLabel((string) $request->userAgent()),
            'ip' => $this->maskIp($request->ip()), 'last_active_at' => now()->toIso8601String(),
        ]];

        if (config('session.driver') !== 'database') {
            return ['persistent' => false, 'items' => $current];
        }

        $others = DB::table(config('session.table', 'sessions'))->where('user_id', $request->user()->id)
            ->where('id', '!=', $currentId)->orderByDesc('last_activity')->get()
            ->map(fn ($session): array => [
                'key' => hash_hmac('sha256', $session->id, (string) config('app.key')),
                'current' => false,
                'device' => $this->deviceLabel((string) $session->user_agent),
                'ip' => $this->maskIp($session->ip_address),
                'last_active_at' => now()->setTimestamp($session->last_activity)->toIso8601String(),
            ])->all();

        return ['persistent' => true, 'items' => [...$current, ...$others]];
    }

    private function deviceLabel(string $userAgent): string
    {
        $browser = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Safari/') => 'Safari',
            default => __('ui.sessions.unknown_browser'),
        };
        $platform = match (true) {
            preg_match('/iPhone|iPad|iPod/', $userAgent) === 1 => 'iOS',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Mac OS') => 'macOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => __('ui.sessions.unknown_device'),
        };

        return $browser.' · '.$platform;
    }

    private function maskIp(?string $ip): string
    {
        if (! $ip) {
            return __('ui.sessions.unavailable');
        }

        if (str_contains($ip, ':')) {
            return implode(':', array_slice(explode(':', $ip), 0, 3)).':…';
        }

        $parts = explode('.', $ip);

        return count($parts) === 4 ? "{$parts[0]}.{$parts[1]}.x.x" : __('ui.sessions.unavailable');
    }
}
