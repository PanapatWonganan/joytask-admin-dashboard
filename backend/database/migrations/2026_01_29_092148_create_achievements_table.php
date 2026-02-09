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
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('achievement_id')->index(); // e.g., 'first_task', 'streak_7'
            $table->string('title');
            $table->text('description');
            $table->string('icon_emoji', 10);
            $table->enum('category', ['tasks', 'streak', 'focus', 'special'])->default('tasks');
            $table->integer('required_progress')->default(1);
            $table->integer('current_progress')->default(0);
            $table->integer('reward_points')->default(0);
            $table->string('reward_costume_id')->nullable();
            $table->boolean('is_unlocked')->default(false);
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamps();

            // Unique constraint: one achievement per user
            $table->unique(['user_id', 'achievement_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
