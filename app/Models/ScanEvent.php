<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScanEvent extends Model
{
    protected $fillable = [
        'product_id', 'customer_id', 'request_uuid', 'result', 'ip_hash', 'user_agent_hash',
        'device_category', 'country_code', 'referrer_host', 'is_probable_bot', 'response_time_ms', 'scanned_at',
    ];

    protected function casts(): array
    {
        return ['is_probable_bot' => 'boolean', 'scanned_at' => 'datetime'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function scopeGenuine(Builder $query): Builder
    {
        return $query->where('result', 'redirected')->where('is_probable_bot', false);
    }
}
