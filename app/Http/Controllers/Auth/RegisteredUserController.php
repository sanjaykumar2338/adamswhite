<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Support\DashboardRedirector;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'business_name' => [
                Rule::requiredIf(fn (): bool => $request->input('account_type') !== Customer::ACCOUNT_TYPE_INDIVIDUAL),
                'nullable',
                'string',
                'max:255',
            ],
            'account_type' => ['required', Rule::in(Customer::ACCOUNT_TYPES)],
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($validated): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'preferred_locale' => app()->getLocale(),
                'password' => Hash::make($validated['password']),
            ]);

            $customer = Customer::create([
                'business_name' => filled($validated['business_name'] ?? null) ? $validated['business_name'] : $validated['name'],
                'account_type' => $validated['account_type'],
                'max_products' => 10,
            ]);

            $customer->users()->attach($user->id, ['role' => 'owner', 'status' => 'active']);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return DashboardRedirector::redirect($request);
    }
}
