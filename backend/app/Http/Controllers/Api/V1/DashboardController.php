<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Mood;
use App\Models\Task;
use App\Models\User;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;
    /**
     * Get dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $thisWeekStart = Carbon::now()->startOfWeek();
        $thisMonthStart = Carbon::now()->startOfMonth();
        $days = $request->get('days', 30);
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        // =============================================
        // User Statistics
        // =============================================
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'inactive')->count();
        $newUsersToday = User::whereDate('created_at', $today)->count();
        $newUsersThisWeek = User::where('created_at', '>=', $thisWeekStart)->count();
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonthStart)->count();

        // Users by role
        $usersByRole = User::selectRaw('roles.name as role, COUNT(users.id) as count')
            ->join('role_user', 'users.id', '=', 'role_user.user_id')
            ->join('roles', 'role_user.role_id', '=', 'roles.id')
            ->groupBy('roles.name')
            ->get()
            ->map(fn($item) => [
                'role' => $item->role,
                'count' => $item->count,
            ]);

        // Users by provider (email vs google)
        $usersByProvider = User::selectRaw('provider, COUNT(*) as count')
            ->groupBy('provider')
            ->get()
            ->pluck('count', 'provider')
            ->toArray();

        // =============================================
        // Mood Statistics (JoyTask)
        // =============================================
        $totalMoods = Mood::count();
        $moodsToday = Mood::whereDate('recorded_at', $today)->count();
        $moodsThisWeek = Mood::where('recorded_at', '>=', $thisWeekStart)->count();
        $moodsThisMonth = Mood::where('recorded_at', '>=', $thisMonthStart)->count();

        // Average mood score (all time)
        $averageMoodScore = round(Mood::avg('mood_score') ?? 0, 1);

        // Mood distribution
        $moodDistribution = Mood::selectRaw('mood_type, COUNT(*) as count')
            ->groupBy('mood_type')
            ->get()
            ->pluck('count', 'mood_type')
            ->toArray();

        // Daily mood averages for chart (last N days)
        $dailyMoodAverages = Mood::selectRaw('DATE(recorded_at) as date, ROUND(AVG(mood_score), 1) as average')
            ->where('recorded_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('average', 'date')
            ->toArray();

        // =============================================
        // Task Statistics (JoyTask)
        // =============================================
        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'completed')->count();
        $pendingTasks = Task::where('status', 'pending')->count();
        $inProgressTasks = Task::where('status', 'in_progress')->count();
        $overdueTasks = Task::where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->where('due_date', '<', $today->toDateString())
            ->count();

        // Task completion rate
        $taskCompletionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        // Tasks by category
        $tasksByCategory = Task::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->pluck('count', 'category')
            ->toArray();

        // Tasks by priority
        $tasksByPriority = Task::selectRaw('priority, COUNT(*) as count')
            ->groupBy('priority')
            ->get()
            ->pluck('count', 'priority')
            ->toArray();

        // Daily tasks created/completed for chart (last N days)
        $dailyTasksCreated = Task::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date')
            ->toArray();

        $dailyTasksCompleted = Task::selectRaw('DATE(completed_at) as date, COUNT(*) as count')
            ->where('completed_at', '>=', $startDate)
            ->whereNotNull('completed_at')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date')
            ->toArray();

        // =============================================
        // Activity Statistics
        // =============================================
        $recentActivities = ActivityLog::with('user:id,name,email')
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(fn($log) => [
                'id' => $log->id,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : null,
                'action' => $log->action,
                'details' => $log->details,
                'created_at' => $log->created_at->toIso8601String(),
            ]);

        // Activity by type (last N days)
        $activityByType = ActivityLog::selectRaw('action, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('action')
            ->get()
            ->pluck('count', 'action')
            ->toArray();

        return $this->success([
            // User stats
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'inactive' => $inactiveUsers,
                'new_today' => $newUsersToday,
                'new_this_week' => $newUsersThisWeek,
                'new_this_month' => $newUsersThisMonth,
                'by_role' => $usersByRole,
                'by_provider' => $usersByProvider,
            ],
            // Mood stats (JoyTask)
            'moods' => [
                'total' => $totalMoods,
                'today' => $moodsToday,
                'this_week' => $moodsThisWeek,
                'this_month' => $moodsThisMonth,
                'average_score' => $averageMoodScore,
                'distribution' => $moodDistribution,
                'daily_averages' => $dailyMoodAverages,
            ],
            // Task stats (JoyTask)
            'tasks' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'pending' => $pendingTasks,
                'in_progress' => $inProgressTasks,
                'overdue' => $overdueTasks,
                'completion_rate' => $taskCompletionRate,
                'by_category' => $tasksByCategory,
                'by_priority' => $tasksByPriority,
                'daily_created' => $dailyTasksCreated,
                'daily_completed' => $dailyTasksCompleted,
            ],
            // Activity stats
            'activities' => [
                'recent' => $recentActivities,
                'by_type' => $activityByType,
            ],
            // Meta
            'period_days' => $days,
        ]);
    }
}
