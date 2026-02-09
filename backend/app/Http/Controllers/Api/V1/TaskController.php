<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * Display a listing of the user's tasks.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->tasks()->latest();

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->ofCategory($request->category);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->ofPriority($request->priority);
        }

        // Filter by due date range
        if ($request->has('due_from') && $request->has('due_to')) {
            $query->whereBetween('due_date', [$request->due_from, $request->due_to]);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
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
     * Store a newly created task.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', Rule::in(['work', 'personal', 'health', 'learning', 'social', 'other'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'status' => ['nullable', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'due_date' => ['nullable', 'date'],
        ]);

        $task = $request->user()->tasks()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? 'personal',
            'priority' => $validated['priority'] ?? 'medium',
            'status' => $validated['status'] ?? 'pending',
            'due_date' => $validated['due_date'] ?? null,
        ]);

        // Log activity
        ActivityLog::log(
            $request->user(),
            'create_task',
            ['task_id' => $task->id, 'title' => $task->title],
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'data' => $task,
            'message' => 'Task created successfully',
        ], 201);
    }

    /**
     * Display the specified task.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        // Ensure user can only view their own tasks
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $task,
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        // Ensure user can only update their own tasks
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['sometimes', Rule::in(['work', 'personal', 'health', 'learning', 'social', 'other'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'status' => ['sometimes', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'due_date' => ['nullable', 'date'],
        ]);

        // Check if task is being completed
        $wasCompleted = $task->status === 'completed';
        $isBeingCompleted = isset($validated['status']) && $validated['status'] === 'completed' && !$wasCompleted;

        if ($isBeingCompleted) {
            $validated['completed_at'] = now();

            // Log completion activity
            ActivityLog::log(
                $request->user(),
                'complete_task',
                ['task_id' => $task->id, 'title' => $task->title],
                $request->ip(),
                $request->userAgent()
            );
        }

        $task->update($validated);

        return response()->json([
            'success' => true,
            'data' => $task->fresh(),
            'message' => 'Task updated successfully',
        ]);
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        // Ensure user can only delete their own tasks
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Mark task as completed.
     */
    public function complete(Request $request, Task $task): JsonResponse
    {
        // Ensure user can only complete their own tasks
        if ($task->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $task->markAsCompleted();

        // Log activity
        ActivityLog::log(
            $request->user(),
            'complete_task',
            ['task_id' => $task->id, 'title' => $task->title],
            $request->ip(),
            $request->userAgent()
        );

        return response()->json([
            'success' => true,
            'data' => $task->fresh(),
            'message' => 'Task marked as completed',
        ]);
    }

    /**
     * Get task statistics for the authenticated user.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        $tasks = $user->tasks()->get();
        $recentTasks = $user->tasks()->where('created_at', '>=', $startDate)->get();

        // Overall statistics
        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('status', 'completed')->count();
        $pendingTasks = $tasks->where('status', 'pending')->count();
        $inProgressTasks = $tasks->where('status', 'in_progress')->count();
        $overdueTasks = $tasks->where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->filter(fn($task) => $task->due_date < now()->toDateString())
            ->count();

        // Completion rate
        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        // Tasks by category
        $tasksByCategory = $tasks->groupBy('category')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Tasks by priority
        $tasksByPriority = $tasks->groupBy('priority')
            ->map(fn($group) => $group->count())
            ->toArray();

        // Recent activity (tasks created/completed per day)
        $dailyCreated = $recentTasks->groupBy(fn($task) => $task->created_at->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        $dailyCompleted = $recentTasks->where('status', 'completed')
            ->groupBy(fn($task) => $task->completed_at?->format('Y-m-d'))
            ->map(fn($group) => $group->count())
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks' => $pendingTasks,
                'in_progress_tasks' => $inProgressTasks,
                'overdue_tasks' => $overdueTasks,
                'completion_rate' => $completionRate,
                'tasks_by_category' => $tasksByCategory,
                'tasks_by_priority' => $tasksByPriority,
                'daily_created' => $dailyCreated,
                'daily_completed' => $dailyCompleted,
                'period_days' => $days,
            ],
        ]);
    }
}
