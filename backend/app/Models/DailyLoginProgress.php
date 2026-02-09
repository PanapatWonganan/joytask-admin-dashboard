<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyLoginProgress extends Model
{
    use HasFactory;

    protected $table = 'daily_login_progress';

    protected $fillable = [
        'user_id',
        'current_day_in_cycle',
        'weeks_completed',
        'total_days_claimed',
        'current_streak',
        'longest_streak',
        'last_claim_date',
    ];

    protected $casts = [
        'current_day_in_cycle' => 'integer',
        'weeks_completed' => 'integer',
        'total_days_claimed' => 'integer',
        'current_streak' => 'integer',
        'longest_streak' => 'integer',
        'last_claim_date' => 'date',
    ];

    /**
     * Get the user that owns the progress.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if today's reward has been claimed.
     */
    public function getHasClaimedTodayAttribute(): bool
    {
        if (!$this->last_claim_date) {
            return false;
        }
        return $this->last_claim_date->isToday();
    }

    /**
     * Get today's potential reward points.
     */
    public function getTodayRewardAttribute(): int
    {
        $dailyPoints = [
            1 => 10,
            2 => 15,
            3 => 20,
            4 => 25,
            5 => 30,
            6 => 40,
            7 => 100,
        ];
        return $dailyPoints[$this->current_day_in_cycle] ?? 10;
    }

    /**
     * Check if today is jackpot day.
     */
    public function getIsJackpotDayAttribute(): bool
    {
        return $this->current_day_in_cycle === 7;
    }
}
