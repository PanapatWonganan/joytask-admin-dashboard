<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminActivityLogController extends Controller
{
    /**
     * Display a listing of ALL activity logs (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user:id,name,email')->latest('created_at');

        // Filter by action
        if ($request->has('action') && $request->action !== 'all') {
            $query->ofAction($request->action);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Search by user or IP
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Get list of unique actions for filtering.
     */
    public function actions(): JsonResponse
    {
        $actions = ActivityLog::distinct()->pluck('action')->sort()->values();

        return response()->json([
            'success' => true,
            'data' => $actions,
        ]);
    }

    /**
     * Get activity log statistics for admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $allLogs = ActivityLog::all();
        $recentLogs = ActivityLog::where('created_at', '>=', $startDate)->get();

        // Overall statistics
        $totalLogs = $allLogs->count();
        $recentLogsCount = $recentLogs->count();

        // Actions distribution
        $actionDistribution = $allLogs->groupBy('action')
            ->map(fn($group) => $group->count())
            ->sortDesc()
            ->toArray();

        // Daily activity counts
        $dailyCounts = $recentLogs->groupBy(fn($log) => $log->created_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        // Active users
        $activeUsers = ActivityLog::where('created_at', '>=', $startDate)
            ->distinct('user_id')
            ->count('user_id');

        // Most active users
        $mostActiveUsers = $recentLogs->groupBy('user_id')
            ->map(fn($group, $userId) => [
                'user_id' => $userId,
                'count' => $group->count(),
                'user' => $group->first()->user,
            ])
            ->sortByDesc('count')
            ->take(5)
            ->values()
            ->toArray();

        // Recent actions count
        $recentActionCounts = $recentLogs->groupBy('action')
            ->map(fn($group) => $group->count())
            ->sortDesc()
            ->take(10)
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_logs' => $totalLogs,
                'recent_logs' => $recentLogsCount,
                'action_distribution' => $actionDistribution,
                'daily_counts' => $dailyCounts,
                'active_users' => $activeUsers,
                'most_active_users' => $mostActiveUsers,
                'recent_action_counts' => $recentActionCounts,
                'period_days' => $days,
            ],
        ]);
    }
}
