<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    public const ACCOUNT_TYPE_BUSINESS = 'business';

    public const ACCOUNT_TYPE_INDIVIDUAL = 'individual';

    public const ACCOUNT_TYPES = [
        self::ACCOUNT_TYPE_BUSINESS,
        self::ACCOUNT_TYPE_INDIVIDUAL,
    ];

    protected $fillable = [
        'business_name', 'account_type', 'status', 'max_products', 'admin_notes', 'blocked_at', 'blocked_by',
        'genuine_scan_milestone_dismissed_at',
    ];

    protected function casts(): array
    {
        return [
            'blocked_at' => 'datetime',
            'genuine_scan_milestone_dismissed_at' => 'datetime',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'customer_memberships')
            ->withPivot(['role', 'status'])->withTimestamps();
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class);
    }
}
