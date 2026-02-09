<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTaskController extends Controller
{
    /**
     * Display a listing of ALL tasks (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with('user:id,name,email')->latest();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->ofCategory($request->category);
        }

        // Filter by priority
        if ($request->has('priority') && $request->priority !== 'all') {
            $query->ofPriority($request->priority);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by due date range
        if ($request->has('due_from') && $request->has('due_to')) {
            $query->whereBetween('due_date', [$request->due_from, $request->due_to]);
        }

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $tasks = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $tasks->items(),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'last_page' => $tasks->lastPage(),
                'per_page' => $tasks->perPage(),
                'total' => $tasks->total(),
            ],
        ]);
    }

    /**
     * Display the specified task (admin view).
     */
    public function show(Task $task): JsonResponse
    {
        $task->load('user:id,name,email');

        return response()->json([
            'success' => true,
            'data' => $task,
        ]);
    }

    /**
     * Remove the specified task (admin only).
     */
    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Get task statistics for admin dashboard.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $allTasks = Task::all();
        $recentTasks = Task::where('created_at', '>=', $startDate)->get();

        // Overall statistics
        $totalTasks = $allTasks->count();
        $completedTasks = $allTasks->where('status', 'completed')->count();
        $pendingTasks = $allTasks->where('status', 'pending')->count();
        $inProgressTasks = $allTasks->where('status', 'in_progress')->count();
        $cancelledTasks = $allTasks->where('status', 'cancelled')->count();
        $overdueTasks = $allTasks->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->filter(fn($task) => $task->due_date < now()->toDateString())
            ->count();

        // Completion rate
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        // Tasks by category
        $tasksByCategory = $allTasks->groupBy('category')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Tasks by priority
        $tasksByPriority = $allTasks->groupBy('priority')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Recent activity (tasks created/completed per day)
        $dailyCreated = $recentTasks->groupBy(fn($task) => $task->created_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        $dailyCompleted = $recentTasks->where('status', 'completed')
            ->filter(fn($task) => $task->completed_at !== null)
            ->groupBy(fn($task) => $task->completed_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        // Active users with tasks
        $activeUsers = Task::where('created_at', '>=', $startDate)
            ->distinct('user_id')
            ->count('user_id');

        return response()->json([
            'success' => true,
            'data' => [
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks' => $pendingTasks,
                'in_progress_tasks' => $inProgressTasks,
                'cancelled_tasks' => $cancelledTasks,
                'overdue_tasks' => $overdueTasks,
                'completion_rate' => $completionRate,
                'tasks_by_category' => $tasksByCategory,
                'tasks_by_priority' => $tasksByPriority,
                'daily_created' => $dailyCreated,
                'daily_completed' => $dailyCompleted,
                'active_users' => $activeUsers,
                'period_days' => $days,
            ],
        ]);
    }
}
