<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->timestamps();
            $table->unique(['customer_id', 'name']);
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->foreignId('location_id')->nullable()->after('customer_id')->constrained()->nullOnDelete();
            $table->index(['customer_id', 'location_id', 'status'], 'products_customer_location_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex('products_customer_location_status_idx');
            $table->dropConstrainedForeignId('location_id');
        });
        Schema::dropIfExists('locations');
    }
};
