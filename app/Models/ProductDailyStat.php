<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductDailyStat extends Model
{
    protected $primaryKey = null;

    public $incrementing = false;

    protected $fillable = ['product_id', 'stat_date', 'scan_count', 'redirect_count', 'blocked_count', 'probable_bot_count'];

    protected function casts(): array
    {
        return ['stat_date' => 'date'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
