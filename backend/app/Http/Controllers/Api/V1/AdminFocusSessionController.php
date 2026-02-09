<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FocusSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminFocusSessionController extends Controller
{
    /**
     * Display a listing of ALL focus sessions (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = FocusSession::with('user:id,name,email')->latest('started_at');

        // Filter by completion status
        if ($request->has('was_completed')) {
            $query->where('was_completed', $request->boolean('was_completed'));
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('started_at', [$request->start_date, $request->end_date . ' 23:59:59']);
        }

        // Filter by minimum duration
        if ($request->has('min_duration')) {
            $query->where('duration_minutes', '>=', $request->min_duration);
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
        $sessions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $sessions->items(),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ],
        ]);
    }

    /**
     * Display the specified focus session.
     */
    public function show(FocusSession $focusSession): JsonResponse
    {
        $focusSession->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'data' => $focusSession,
        ]);
    }

    /**
     * Remove the specified focus session.
     */
    public function destroy(FocusSession $focusSession): JsonResponse
    {
        $focusSession->delete();

        return response()->json([
            'success' => true,
            'message' => 'Focus session deleted successfully.',
        ]);
    }

    /**
     * Get focus session statistics for admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $allSessions = FocusSession::all();
        $recentSessions = FocusSession::where('started_at', '>=', $startDate)->get();

        // Overall statistics
        $totalSessions = $allSessions->count();
        $completedSessions = $allSessions->where('was_completed', true)->count();
        $incompleteSessions = $allSessions->where('was_completed', false)->count();
        $recentSessionsCount = $recentSessions->count();

        // Time statistics
        $totalMinutesPlanned = $allSessions->sum('duration_minutes');
        $totalMinutesCompleted = $allSessions->where('was_completed', true)->sum('duration_minutes');
        $avgSessionDuration = $allSessions->count() > 0 ? round($allSessions->avg('duration_minutes'), 1) : 0;

        // Completion rate
        $completionRate = $totalSessions > 0 ? round(($completedSessions / $totalSessions) * 100, 2) : 0;

        // Daily counts
        $dailyCounts = $recentSessions->groupBy(fn($s) => $s->started_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        // Daily minutes
        $dailyMinutes = $recentSessions->groupBy(fn($s) => $s->started_at->format('Y-m-d'))
            ->map(fn($group) => $group->sum('duration_minutes'))
            ->toArray();

        // Duration distribution
        $durationDistribution = [
            '0-15' => $allSessions->filter(fn($s) => $s->duration_minutes <= 15)->count(),
            '16-30' => $allSessions->filter(fn($s) => $s->duration_minutes > 15 && $s->duration_minutes <= 30)->count(),
            '31-60' => $allSessions->filter(fn($s) => $s->duration_minutes > 30 && $s->duration_minutes <= 60)->count(),
            '60+' => $allSessions->filter(fn($s) => $s->duration_minutes > 60)->count(),
        ];

        // Active users
        $activeUsers = FocusSession::where('started_at', '>=', $startDate)
            ->distinct('user_id')
            ->count('user_id');

        // Top users by focus time
        $topUsers = $recentSessions->groupBy('user_id')
            ->map(fn($group, $userId) => [
                'user_id' => $userId,
                'total_minutes' => $group->sum('duration_minutes'),
                'session_count' => $group->count(),
                'user' => $group->first()->user,
            ])
            ->sortByDesc('total_minutes')
            ->take(5)
            ->values()
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_sessions' => $totalSessions,
                'completed_sessions' => $completedSessions,
                'incomplete_sessions' => $incompleteSessions,
                'recent_sessions' => $recentSessionsCount,
                'total_minutes_planned' => $totalMinutesPlanned,
                'total_minutes_completed' => $totalMinutesCompleted,
                'avg_session_duration' => $avgSessionDuration,
                'completion_rate' => $completionRate,
                'daily_counts' => $dailyCounts,
                'daily_minutes' => $dailyMinutes,
                'duration_distribution' => $durationDistribution,
                'active_users' => $activeUsers,
                'top_users' => $topUsers,
                'period_days' => $days,
            ],
        ]);
    }
}
