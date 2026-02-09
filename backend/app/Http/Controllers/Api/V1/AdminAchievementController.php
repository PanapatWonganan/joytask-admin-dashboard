<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAchievementController extends Controller
{
    /**
     * Display a listing of ALL achievements (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Achievement::with('user:id,name,email')->latest('updated_at');

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->ofCategory($request->category);
        }

        // Filter by unlock status
        if ($request->has('is_unlocked')) {
            $query->where('is_unlocked', $request->boolean('is_unlocked'));
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Search by achievement ID or title
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('achievement_id', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $achievements = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $achievements->items(),
            'meta' => [
                'current_page' => $achievements->currentPage(),
                'last_page' => $achievements->lastPage(),
                'per_page' => $achievements->perPage(),
                'total' => $achievements->total(),
            ],
        ]);
    }

    /**
     * Display the specified achievement.
     */
    public function show(Achievement $achievement): JsonResponse
    {
        $achievement->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'data' => $achievement,
        ]);
    }

    /**
     * Remove the specified achievement.
     */
    public function destroy(Achievement $achievement): JsonResponse
    {
        $achievement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Achievement deleted successfully.',
        ]);
    }

    /**
     * Get achievement statistics for admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $allAchievements = Achievement::all();
        $recentUnlocked = Achievement::where('unlocked_at', '>=', $startDate)->get();

        // Overall statistics
        $totalAchievements = $allAchievements->count();
        $unlockedAchievements = $allAchievements->where('is_unlocked', true)->count();
        $lockedAchievements = $allAchievements->where('is_unlocked', false)->count();
        $recentUnlockedCount = $recentUnlocked->count();

        // Category distribution
        $categoryDistribution = $allAchievements->groupBy('category')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Unlock rate by category
        $unlockRateByCategory = [];
        foreach ($allAchievements->groupBy('category') as $category => $achievements) {
            $total = $achievements->count();
            $unlocked = $achievements->where('is_unlocked', true)->count();
            $unlockRateByCategory[$category] = $total > 0 ? round(($unlocked / $total) * 100, 2) : 0;
        }

        // Daily unlocks
        $dailyUnlocks = $recentUnlocked->groupBy(fn($a) => $a->unlocked_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        // Most popular achievements (most unlocked)
        $popularAchievements = Achievement::where('is_unlocked', true)
            ->select('achievement_id', 'title', 'icon_emoji')
            ->selectRaw('COUNT(*) as unlock_count')
            ->groupBy('achievement_id', 'title', 'icon_emoji')
            ->orderByDesc('unlock_count')
            ->limit(10)
            ->get()
            ->toArray();

        // Total reward points distributed
        $totalPointsDistributed = Achievement::where('is_unlocked', true)
            ->sum('reward_points');

        // Users with achievements
        $usersWithAchievements = Achievement::distinct('user_id')->count('user_id');

        return response()->json([
            'success' => true,
            'data' => [
                'total_achievements' => $totalAchievements,
                'unlocked_achievements' => $unlockedAchievements,
                'locked_achievements' => $lockedAchievements,
                'recent_unlocked' => $recentUnlockedCount,
                'category_distribution' => $categoryDistribution,
                'unlock_rate_by_category' => $unlockRateByCategory,
                'daily_unlocks' => $dailyUnlocks,
                'popular_achievements' => $popularAchievements,
                'total_points_distributed' => $totalPointsDistributed,
                'users_with_achievements' => $usersWithAchievements,
                'period_days' => $days,
            ],
        ]);
    }

    /**
     * Get list of achievement categories.
     */
    public function categories(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['tasks', 'streak', 'focus', 'special'],
        ]);
    }
}
