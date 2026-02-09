<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Achievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'achievement_id',
        'title',
        'description',
        'icon_emoji',
        'category',
        'required_progress',
        'current_progress',
        'reward_points',
        'reward_costume_id',
        'is_unlocked',
        'unlocked_at',
    ];

    protected $casts = [
        'required_progress' => 'integer',
        'current_progress' => 'integer',
        'reward_points' => 'integer',
        'is_unlocked' => 'boolean',
        'unlocked_at' => 'datetime',
    ];

    /**
     * Get the user that owns the achievement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for filtering by category.
     */
    public function scopeOfCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope for filtering unlocked achievements.
     */
    public function scopeUnlocked($query)
    {
        return $query->where('is_unlocked', true);
    }

    /**
     * Scope for filtering locked achievements.
     */
    public function scopeLocked($query)
    {
        return $query->where('is_unlocked', false);
    }

    /**
     * Calculate progress percentage.
     */
    public function getProgressPercentAttribute(): float
    {
        if ($this->required_progress == 0) {
            return 0;
        }
        return min(100, ($this->current_progress / $this->required_progress) * 100);
    }
}
