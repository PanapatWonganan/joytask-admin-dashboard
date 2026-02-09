<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DailyLoginClaim;
use App\Models\DailyLoginProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDailyLoginController extends Controller
{
    /**
     * Display a listing of ALL daily login claims (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = DailyLoginClaim::with('user:id,name,email')->latest('claimed_at');

        // Filter by day in cycle
        if ($request->has('day_in_cycle')) {
            $query->where('day_in_cycle', $request->day_in_cycle);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('claim_date', [$request->start_date, $request->end_date]);
        }

        // Filter by bonus reward
        if ($request->has('bonus_reward_given')) {
            $query->where('bonus_reward_given', $request->boolean('bonus_reward_given'));
        }

        // Search by user
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('user', function ($uq) use ($search) {
                $uq->where('name', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $claims = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $claims->items(),
            'meta' => [
                'current_page' => $claims->currentPage(),
                'last_page' => $claims->lastPage(),
                'per_page' => $claims->perPage(),
                'total' => $claims->total(),
            ],
        ]);
    }

    /**
     * Display user progress list.
     */
    public function progress(Request $request): JsonResponse
    {
        $query = DailyLoginProgress::with('user:id,name,email')->latest('updated_at');

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Search by user
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->whereHas('user', function ($uq) use ($search) {
                $uq->where('name', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $progress = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $progress->items(),
            'meta' => [
                'current_page' => $progress->currentPage(),
                'last_page' => $progress->lastPage(),
                'per_page' => $progress->perPage(),
                'total' => $progress->total(),
            ],
        ]);
    }

    /**
     * Remove the specified claim.
     */
    public function destroy(DailyLoginClaim $dailyLoginClaim): JsonResponse
    {
        $dailyLoginClaim->delete();

        return response()->json([
            'success' => true,
            'message' => 'Daily login claim deleted successfully.',
        ]);
    }

    /**
     * Get daily login statistics for admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $allClaims = DailyLoginClaim::all();
        $recentClaims = DailyLoginClaim::where('claim_date', '>=', $startDate)->get();
        $allProgress = DailyLoginProgress::all();

        // Overall statistics
        $totalClaims = $allClaims->count();
        $recentClaimsCount = $recentClaims->count();
        $totalPointsDistributed = $allClaims->sum('points_earned');
        $recentPointsDistributed = $recentClaims->sum('points_earned');

        // Users statistics
        $totalUsersWithProgress = $allProgress->count();
        $activeUsersRecent = DailyLoginClaim::where('claim_date', '>=', $startDate)
            ->distinct('user_id')
            ->count('user_id');

        // Streak statistics
        $avgCurrentStreak = round($allProgress->avg('current_streak'), 1);
        $maxStreak = $allProgress->max('longest_streak');
        $avgLongestStreak = round($allProgress->avg('longest_streak'), 1);

        // Day distribution
        $dayDistribution = $allClaims->groupBy('day_in_cycle')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Jackpot claims (day 7)
        $jackpotClaims = $allClaims->where('day_in_cycle', 7)->count();

        // Daily claims count
        $dailyClaimCounts = $recentClaims->groupBy(fn($c) => $c->claim_date->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        // Users who claimed today
        $claimedToday = DailyLoginClaim::whereDate('claim_date', today())->count();

        // Top streak holders
        $topStreakHolders = $allProgress
            ->sortByDesc('longest_streak')
            ->take(5)
            ->map(fn($p) => [
                'user_id' => $p->user_id,
                'current_streak' => $p->current_streak,
                'longest_streak' => $p->longest_streak,
                'total_days_claimed' => $p->total_days_claimed,
                'user' => $p->user,
            ])
            ->values()
            ->toArray();

        // Weeks completed distribution
        $weeksDistribution = $allProgress->groupBy('weeks_completed')
            ->map(fn($group) => $group->count())
            ->sortKeys()
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_claims' => $totalClaims,
                'recent_claims' => $recentClaimsCount,
                'total_points_distributed' => $totalPointsDistributed,
                'recent_points_distributed' => $recentPointsDistributed,
                'total_users_with_progress' => $totalUsersWithProgress,
                'active_users_recent' => $activeUsersRecent,
                'claimed_today' => $claimedToday,
                'avg_current_streak' => $avgCurrentStreak,
                'max_streak' => $maxStreak,
                'avg_longest_streak' => $avgLongestStreak,
                'day_distribution' => $dayDistribution,
                'jackpot_claims' => $jackpotClaims,
                'daily_claim_counts' => $dailyClaimCounts,
                'top_streak_holders' => $topStreakHolders,
                'weeks_distribution' => $weeksDistribution,
                'period_days' => $days,
            ],
        ]);
    }
}
