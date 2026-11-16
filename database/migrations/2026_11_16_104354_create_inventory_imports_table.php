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
        Schema::create('inventory_imports', function (Blueprint $table) {
            $table->id();
            $table->string('original_filename');
            $table->string('file_sha256', 64)->unique();
            $table->unsignedInteger('total_rows');
            $table->unsignedInteger('commercial_rows');
            $table->unsignedInteger('backup_rows');
            $table->string('status', 20)->default('validated');
            $table->json('validation_report')->nullable();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_imports');
    }
};
