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
        Schema::create('scan_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('request_uuid')->unique();
            $table->string('result', 20)->index();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->string('referrer_host')->nullable();
            $table->boolean('is_probable_bot')->default(false);
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->timestamp('scanned_at')->useCurrent();
            $table->timestamps();

            $table->index(['product_id', 'scanned_at']);
            $table->index(['customer_id', 'scanned_at']);
            $table->index(['scanned_at', 'result']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scan_events');
    }
};
