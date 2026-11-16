<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('lot_number')->unique();
            $table->string('code', 10)->unique();
            $table->unsignedSmallInteger('commercial_count')->default(400);
            $table->unsignedSmallInteger('backup_count')->default(20);
            $table->unsignedSmallInteger('total_count')->default(420);
            $table->foreignId('inventory_import_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
