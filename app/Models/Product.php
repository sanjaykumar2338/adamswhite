<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    public const VARIANTS = ['CARD', 'PLATE', 'STAND'];

    protected $fillable = [
        'batch_id', 'inventory_import_id', 'customer_id', 'location_id', 'code_id', 'variant', 'display_name', 'code_sequence',
        'unit_type', 'position_in_batch', 'source_line', 'status', 'google_review_url',
        'claimed_at', 'disabled_at', 'last_scanned_at',
    ];

    protected function casts(): array
    {
        return ['claimed_at' => 'datetime', 'disabled_at' => 'datetime', 'last_scanned_at' => 'datetime'];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function inventoryImport(): BelongsTo
    {
        return $this->belongsTo(InventoryImport::class);
    }

    public function activations(): HasMany
    {
        return $this->hasMany(Activation::class);
    }

    public function scanEvents(): HasMany
    {
        return $this->hasMany(ScanEvent::class);
    }

    public function reviewLinkHistory(): HasMany
    {
        return $this->hasMany(ReviewLinkHistory::class);
    }

    public function getImageUrlAttribute(): string
    {
        return asset('images/products/'.strtolower($this->variant).'.jpg');
    }

    public function getNfcUrlAttribute(): string
    {
        return 'https://shiftrix.io/configuration?id='.rawurlencode($this->code_id);
    }
}
