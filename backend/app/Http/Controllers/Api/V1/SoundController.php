<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sound;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SoundController extends Controller
{
    use ApiResponse;

    /**
     * List all sounds, optionally filtered by type/category.
     *
     * GET /api/v1/sounds?type=ambient&category=nature
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sound::active()->orderBy('type')->orderBy('sort_order');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('category')) {
            $query->ofCategory($request->category);
        }

        if ($request->boolean('free_only')) {
            $query->free();
        }

        $sounds = $query->get()->map(fn(Sound $sound) => $this->formatSound($sound));

        return $this->success($sounds);
    }

    /**
     * Get a single sound by key.
     *
     * GET /api/v1/sounds/{key}
     */
    public function show(string $key): JsonResponse
    {
        $sound = Sound::active()->where('key', $key)->first();

        if (!$sound) {
            return $this->notFound('Sound not found');
        }

        return $this->success($this->formatSound($sound));
    }

    /**
     * Download a sound file.
     *
     * GET /api/v1/sounds/{key}/download
     */
    public function download(string $key)
    {
        $sound = Sound::active()->where('key', $key)->first();

        if (!$sound) {
            return $this->notFound('Sound not found');
        }

        // Check if file exists in local storage
        if (Storage::disk('public')->exists($sound->file_path)) {
            return Storage::disk('public')->download(
                $sound->file_path,
                $sound->key . '.' . $sound->format,
                [
                    'Content-Type' => 'audio/' . $sound->format,
                    'Cache-Control' => 'public, max-age=2592000', // 30 days cache
                ]
            );
        }

        // If file doesn't exist locally, return URL for client to download
        if ($sound->file_url) {
            return $this->success([
                'redirect_url' => $sound->file_url,
            ], 'File available at external URL');
        }

        return $this->notFound('Sound file not available');
    }

    /**
     * Upload a sound file (admin only).
     *
     * POST /api/v1/sounds/{key}/upload
     */
    public function upload(Request $request, string $key): JsonResponse
    {
        $sound = Sound::where('key', $key)->first();

        if (!$sound) {
            return $this->notFound('Sound not found');
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'mimetypes:audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/m4a,audio/x-m4a,video/mp4',
                'max:20480'
            ], // 20MB max
        ]);

        // Delete old file if exists
        if ($sound->file_path && Storage::disk('public')->exists($sound->file_path)) {
            Storage::disk('public')->delete($sound->file_path);
        }

        $directory = $sound->type === 'ambient' ? 'sounds/ambient' : 'sounds/effects';
        $path = $request->file('file')->storeAs(
            $directory,
            $sound->key . '.' . $request->file('file')->getClientOriginalExtension(),
            'public'
        );

        $sound->update([
            'file_path' => $path,
            'file_size' => $request->file('file')->getSize(),
            'format' => $request->file('file')->getClientOriginalExtension(),
        ]);

        return $this->success($this->formatSound($sound), 'Sound file uploaded');
    }

    /**
     * Admin: Create or update sound metadata.
     *
     * POST /api/v1/sounds
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'unique:sounds,key'],
            'name' => ['required', 'string'],
            'name_en' => ['nullable', 'string'],
            'type' => ['required', 'in:ambient,effect'],
            'category' => ['required', 'string'],
            'file_url' => ['nullable', 'url'],
            'duration_ms' => ['nullable', 'integer', 'min:0'],
            'is_premium' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $sound = Sound::create($validated);

        return $this->created($this->formatSound($sound), 'Sound created');
    }

    /**
     * Admin: Update sound metadata.
     *
     * PUT /api/v1/sounds/{key}
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $sound = Sound::where('key', $key)->first();

        if (!$sound) {
            return $this->notFound('Sound not found');
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string'],
            'name_en' => ['nullable', 'string'],
            'category' => ['sometimes', 'string'],
            'file_url' => ['nullable', 'url'],
            'duration_ms' => ['nullable', 'integer', 'min:0'],
            'is_premium' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $sound->update($validated);

        return $this->success($this->formatSound($sound), 'Sound updated');
    }

    /**
     * Format sound for API response.
     */
    private function formatSound(Sound $sound): array
    {
        return [
            'id' => $sound->id,
            'key' => $sound->key,
            'name' => $sound->name,
            'name_en' => $sound->name_en,
            'type' => $sound->type,
            'category' => $sound->category,
            'download_url' => $sound->download_url,
            'file_size' => $sound->file_size,
            'format' => $sound->format,
            'duration_ms' => $sound->duration_ms,
            'is_premium' => $sound->is_premium,
            'sort_order' => $sound->sort_order,
        ];
    }
}
