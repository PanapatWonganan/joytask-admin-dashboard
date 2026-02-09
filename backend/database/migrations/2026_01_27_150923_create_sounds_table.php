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
        Schema::create('sounds', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();           // e.g. 'rain', 'task_complete'
            $table->string('name');                     // Display name e.g. 'เสียงฝน'
            $table->string('name_en')->nullable();      // English name e.g. 'Rain'
            $table->enum('type', ['ambient', 'effect']); // ambient = background loops, effect = short SFX
            $table->enum('category', [
                'nature', 'weather', 'environment', 'music',  // ambient categories
                'task', 'achievement', 'timer', 'ui', 'mascot', 'wardrobe', 'notification' // effect categories
            ]);
            $table->string('file_path');                // Storage path e.g. 'sounds/ambient/rain.mp3'
            $table->string('file_url')->nullable();     // Full URL (auto-generated)
            $table->unsignedInteger('file_size')->default(0); // File size in bytes
            $table->string('format', 10)->default('mp3');
            $table->unsignedInteger('duration_ms')->default(0); // Duration in milliseconds
            $table->boolean('is_premium')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'category']);
            $table->index(['type', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sounds');
    }
};
