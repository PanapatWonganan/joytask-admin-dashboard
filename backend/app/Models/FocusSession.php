<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FocusSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'task_uuid',
        'started_at',
        'ended_at',
        'duration_minutes',
        'was_completed',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration_minutes' => 'integer',
        'was_completed' => 'boolean',
    ];

    /**
     * Get the user that owns the focus session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for completed sessions.
     */
    public function scopeCompleted($query)
    {
        return $query->where('was_completed', true);
    }

    /**
     * Scope for incomplete sessions.
     */
    public function scopeIncomplete($query)
    {
        return $query->where('was_completed', false);
    }

    /**
     * Get actual duration in minutes.
     */
    public function getActualDurationMinutesAttribute(): int
    {
        if (!$this->ended_at) {
            return 0;
        }
        return $this->ended_at->diffInMinutes($this->started_at);
    }
}
