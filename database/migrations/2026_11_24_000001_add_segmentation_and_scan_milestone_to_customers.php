<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('account_type', 20)->nullable()->after('business_name')->index();
            $table->timestamp('genuine_scan_milestone_dismissed_at')->nullable()->after('max_products');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['account_type']);
            $table->dropColumn(['account_type', 'genuine_scan_milestone_dismissed_at']);
        });
    }
};
