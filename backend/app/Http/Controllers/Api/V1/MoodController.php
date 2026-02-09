<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Mood;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MoodController extends Controller
{
    /**
     * Display a listing of the user's moods.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->moods()->latest('recorded_at');

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Filter by mood type
        if ($request->has('mood_type')) {
            $query->ofType($request->mood_type);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $moods = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $moods->items(),
            'meta' => [
                'current_page' => $moods->currentPage(),
                'last_page' => $moods->lastPage(),
                'per_page' => $moods->perPage(),
                'total' => $moods->total(),
            ],
        ]);
    }

    /**
     * Store a newly created mood.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mood_type' => ['required', Rule::in([
                'very_happy', 'happy', 'neutral', 'sad', 'very_sad',
                'anxious', 'calm', 'angry', 'excited', 'tired'
            ])],
            'mood_score' => ['required', 'integer', 'min:1', 'max:10'],
            'note' => ['nullable', 'string', 'max:1000'],
            'recorded_at' => ['nullable', 'date'],
        ]);

        $mood = $request->user()->moods()->create([
            'mood_type' => $validated['mood_type'],
            'mood_score' => $validated['mood_score'],
            'note' => $validated['note'] ?? null,
            'recorded_at' => $validated['recorded_at'] ?? now(),
        ]);

        // Log activity
        ActivityLog::log(
            $request->user(),
            'record_mood',
            ['mood_type' => $mood->mood_type, 'mood_score' => $mood->mood_score],
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'data' => $mood,
            'message' => 'Mood recorded successfully',
        ], 201);
    }

    /**
     * Display the specified mood.
     */
    public function show(Request $request, Mood $mood): JsonResponse
    {
        // Ensure user can only view their own moods
        if ($mood->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $mood,
        ]);
    }

    /**
     * Update the specified mood.
     */
    public function update(Request $request, Mood $mood): JsonResponse
    {
        // Ensure user can only update their own moods
        if ($mood->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'mood_type' => ['sometimes', Rule::in([
                'very_happy', 'happy', 'neutral', 'sad', 'very_sad',
                'anxious', 'calm', 'angry', 'excited', 'tired'
            ])],
            'mood_score' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'note' => ['nullable', 'string', 'max:1000'],
            'recorded_at' => ['sometimes', 'date'],
        ]);

        $mood->update($validated);

        return response()->json([
            'success' => true,
            'data' => $mood->fresh(),
            'message' => 'Mood updated successfully',
        ]);
    }

    /**
     * Remove the specified mood.
     */
    public function destroy(Request $request, Mood $mood): JsonResponse
    {
        // Ensure user can only delete their own moods
        if ($mood->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $mood->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mood deleted successfully',
        ]);
    }

    /**
     * Get mood statistics for the authenticated user.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $moods = $user->moods()
            ->where('recorded_at', '>=', $startDate)
            ->get();

        // Calculate statistics
        $totalMoods = $moods->count();
        $averageScore = $moods->avg('mood_score') ?? 0;

        // Mood type distribution
        $moodDistribution = $moods->groupBy('mood_type')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Daily average scores
        $dailyAverages = $moods->groupBy(fn($mood) => $mood->recorded_at->format('Y-m-d'))
            ->map(fn($group) => round($group->avg('mood_score'), 1))
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_moods' => $totalMoods,
                'average_score' => round($averageScore, 1),
                'mood_distribution' => $moodDistribution,
                'daily_averages' => $dailyAverages,
                'period_days' => $days,
            ],
        ]);
    }
}
