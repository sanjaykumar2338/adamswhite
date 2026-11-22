<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scan_events', function (Blueprint $table): void {
            $table->index(['customer_id', 'result', 'is_probable_bot', 'scanned_at'], 'scan_customer_eligible_period_idx');
            $table->index(['result', 'is_probable_bot', 'scanned_at'], 'scan_eligible_period_idx');
        });
    }

    public function down(): void
    {
        Schema::table('scan_events', function (Blueprint $table): void {
            $table->dropIndex('scan_customer_eligible_period_idx');
            $table->dropIndex('scan_eligible_period_idx');
        });
    }
};
