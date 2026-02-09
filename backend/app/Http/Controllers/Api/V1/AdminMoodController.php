<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Mood;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMoodController extends Controller
{
    /**
     * Display a listing of ALL moods (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Mood::with('user:id,name,email')->latest('recorded_at');

        // Filter by mood type
        if ($request->has('mood_type') && $request->mood_type !== 'all') {
            $query->ofType($request->mood_type);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by score range
        if ($request->has('min_score')) {
            $query->where('mood_score', '>=', $request->min_score);
        }
        if ($request->has('max_score')) {
            $query->where('mood_score', '<=', $request->max_score);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Search by note or user
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('note', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
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
     * Display the specified mood (admin view).
     */
    public function show(Mood $mood): JsonResponse
    {
        $mood->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'data' => $mood,
        ]);
    }

    /**
     * Remove the specified mood (admin only).
     */
    public function destroy(Mood $mood): JsonResponse
    {
        $mood->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mood record deleted successfully',
        ]);
    }

    /**
     * Get mood statistics for admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $allMoods = Mood::all();
        $recentMoods = Mood::where('recorded_at', '>=', $startDate)->get();

        // Overall statistics
        $totalMoods = $allMoods->count();
        $averageScore = round($allMoods->avg('mood_score') ?? 0, 1);
        $recentAverageScore = round($recentMoods->avg('mood_score') ?? 0, 1);

        // Mood type distribution
        $moodDistribution = $allMoods->groupBy('mood_type')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Daily averages for chart
        $dailyAverages = $recentMoods->groupBy(fn($mood) => $mood->recorded_at->format('Y-m-d'))
            ->map(fn($group) => round($group->avg('mood_score'), 1))
            ->toArray();

        // Daily mood counts
        $dailyCounts = $recentMoods->groupBy(fn($mood) => $mood->recorded_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        // Score distribution (1-10)
        $scoreDistribution = $allMoods->groupBy('mood_score')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Active users with moods
        $activeUsers = Mood::where('recorded_at', '>=', $startDate)
            ->distinct('user_id')
            ->count('user_id');

        // Positive vs negative moods
        $positiveMoods = $allMoods->filter(fn($m) => in_array($m->mood_type, ['very_happy', 'happy', 'excited', 'calm']))->count();
        $negativeMoods = $allMoods->filter(fn($m) => in_array($m->mood_type, ['very_sad', 'sad', 'angry', 'anxious']))->count();
        $neutralMoods = $allMoods->filter(fn($m) => in_array($m->mood_type, ['neutral', 'tired']))->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_moods' => $totalMoods,
                'average_score' => $averageScore,
                'recent_average_score' => $recentAverageScore,
                'mood_distribution' => $moodDistribution,
                'daily_averages' => $dailyAverages,
                'daily_counts' => $dailyCounts,
                'score_distribution' => $scoreDistribution,
                'active_users' => $activeUsers,
                'positive_moods' => $positiveMoods,
                'negative_moods' => $negativeMoods,
                'neutral_moods' => $neutralMoods,
                'period_days' => $days,
            ],
        ]);
    }
}
