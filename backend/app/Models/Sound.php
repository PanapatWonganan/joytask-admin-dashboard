<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Sound extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'name_en',
        'type',
        'category',
        'file_path',
        'file_url',
        'file_size',
        'format',
        'duration_ms',
        'is_premium',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'duration_ms' => 'integer',
            'is_premium' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the full download URL for the sound file.
     */
    public function getDownloadUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        if (Storage::disk('public')->exists($this->file_path)) {
            return Storage::disk('public')->url($this->file_path);
        }

        return $this->file_url;
    }

    // Query scopes

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAmbient($query)
    {
        return $query->where('type', 'ambient');
    }

    public function scopeEffect($query)
    {
        return $query->where('type', 'effect');
    }

    public function scopeOfCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeFree($query)
    {
        return $query->where('is_premium', false);
    }
}
