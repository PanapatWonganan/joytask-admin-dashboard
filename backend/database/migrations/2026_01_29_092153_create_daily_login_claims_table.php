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
        Schema::create('daily_login_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('claim_date')->index();
            $table->tinyInteger('day_in_cycle'); // 1-7
            $table->integer('points_earned');
            $table->boolean('bonus_reward_given')->default(false);
            $table->string('bonus_costume_id')->nullable();
            $table->timestamp('claimed_at');
            $table->timestamps();

            // Unique constraint: one claim per user per day
            $table->unique(['user_id', 'claim_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_login_claims');
    }
};
