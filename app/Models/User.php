<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements HasLocalePreference, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'preferred_locale',
        'password',
        'is_admin',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'customer_memberships')
            ->withPivot(['role', 'status'])
            ->withTimestamps();
    }

    public function currentCustomer(): ?Customer
    {
        $selectedCustomer = app()->bound('session') ? session('current_customer_id') : null;
        if ($selectedCustomer) {
            $customer = $this->customers()->whereKey($selectedCustomer)->wherePivot('status', 'active')->first();
            if ($customer) {
                return $customer;
            }
        }

        return $this->relationLoaded('customers')
            ? $this->customers->first(fn (Customer $customer): bool => $customer->pivot->status === 'active')
            : $this->customers()->wherePivot('status', 'active')->first();
    }

    public function roleFor(Customer $customer): ?string
    {
        return $this->customers()->whereKey($customer->id)->wherePivot('status', 'active')->first()?->pivot?->role;
    }

    public function deletionRequests(): HasMany
    {
        return $this->hasMany(AccountDeletionRequest::class);
    }

    public function preferredLocale(): string
    {
        return $this->preferred_locale ?: 'en';
    }
}
