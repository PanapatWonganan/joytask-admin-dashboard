<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyLoginClaim extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'claim_date',
        'day_in_cycle',
        'points_earned',
        'bonus_reward_given',
        'bonus_costume_id',
        'claimed_at',
    ];

    protected $casts = [
        'claim_date' => 'date',
        'day_in_cycle' => 'integer',
        'points_earned' => 'integer',
        'bonus_reward_given' => 'boolean',
        'claimed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the claim.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this is a jackpot day (day 7).
     */
    public function getIsJackpotDayAttribute(): bool
    {
        return $this->day_in_cycle === 7;
    }
}
