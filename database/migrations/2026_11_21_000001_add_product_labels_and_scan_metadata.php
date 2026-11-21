<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('display_name', 120)->nullable()->after('variant');
        });

        Schema::table('scan_events', function (Blueprint $table) {
            $table->string('device_category', 20)->nullable()->after('user_agent_hash');
            $table->char('country_code', 2)->nullable()->after('device_category');
            $table->index(['customer_id', 'device_category']);
            $table->index(['customer_id', 'country_code']);
        });
    }

    public function down(): void
    {
        Schema::table('scan_events', function (Blueprint $table) {
            $table->dropIndex(['customer_id', 'device_category']);
            $table->dropIndex(['customer_id', 'country_code']);
            $table->dropColumn(['device_category', 'country_code']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('display_name');
        });
    }
};
