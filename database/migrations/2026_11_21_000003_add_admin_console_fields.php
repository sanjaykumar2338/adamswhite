<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->text('admin_notes')->nullable()->after('max_products');
        });
        Schema::table('batches', function (Blueprint $table) {
            $table->boolean('is_future_inventory')->default(false)->index();
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropIndex(['is_future_inventory']);
            $table->dropColumn('is_future_inventory');
        });
        Schema::table('customers', fn (Blueprint $table) => $table->dropColumn('admin_notes'));
    }
};
