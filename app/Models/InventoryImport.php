<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryImport extends Model
{
    protected $fillable = [
        'original_filename', 'file_sha256', 'total_rows', 'commercial_rows', 'backup_rows',
        'status', 'validation_report', 'imported_by', 'validated_at', 'imported_at',
    ];

    protected function casts(): array
    {
        return ['validation_report' => 'array', 'validated_at' => 'datetime', 'imported_at' => 'datetime'];
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }
}
