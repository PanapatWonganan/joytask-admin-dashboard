<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mood extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'mood_type',
        'mood_score',
        'note',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'mood_score' => 'integer',
            'recorded_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the mood.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('recorded_at', [$startDate, $endDate]);
    }

    /**
     * Scope a query to filter by mood type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('mood_type', $type);
    }
}
