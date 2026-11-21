<?php

namespace App\Http\Middleware;

use App\Support\SupportContact;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'workspaces' => fn () => $request->user() && ! $request->user()->is_admin
                    ? $request->user()->customers()->wherePivot('status', 'active')->get(['customers.id', 'business_name'])
                    : [],
                'currentWorkspaceId' => fn () => $request->user()?->currentCustomer()?->id,
            ],
            'locale' => app()->getLocale(),
            'support' => fn () => [
                'email' => $request->user()
                    ? SupportContact::email()
                    : config('services.shiftrix.support_email'),
                'whatsappUrl' => SupportContact::whatsappUrl(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
