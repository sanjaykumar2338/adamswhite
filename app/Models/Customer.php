<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = ['business_name', 'status', 'max_products', 'admin_notes', 'blocked_at', 'blocked_by'];

    protected function casts(): array
    {
        return ['blocked_at' => 'datetime'];
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
