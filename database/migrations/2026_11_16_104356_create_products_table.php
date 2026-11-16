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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->restrictOnDelete();
            $table->foreignId('inventory_import_id')->constrained()->restrictOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code_id', 32)->unique();
            $table->string('variant', 10)->index();
            $table->unsignedSmallInteger('code_sequence');
            $table->string('unit_type', 20)->index();
            $table->unsignedSmallInteger('position_in_batch');
            $table->unsignedInteger('source_line')->unique();
            $table->string('status', 20)->default('unclaimed')->index();
            $table->text('google_review_url')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('disabled_at')->nullable();
            $table->timestamp('last_scanned_at')->nullable();
            $table->timestamps();

            $table->unique(['variant', 'code_sequence']);
            $table->unique(['batch_id', 'position_in_batch']);
            $table->index(['batch_id', 'variant', 'unit_type']);
            $table->index(['customer_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
