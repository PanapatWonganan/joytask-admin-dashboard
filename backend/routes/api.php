<?php

use App\Http\Controllers\Api\V1\AdminAchievementController;
use App\Http\Controllers\Api\V1\AdminActivityLogController;
use App\Http\Controllers\Api\V1\AdminDailyLoginController;
use App\Http\Controllers\Api\V1\AdminFocusSessionController;
use App\Http\Controllers\Api\V1\AdminMoodController;
use App\Http\Controllers\Api\V1\AdminTaskController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\MoodController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\SoundController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/google', [AuthController::class, 'googleLogin']);

    // Sound routes (public - read only)
    Route::get('/sounds', [SoundController::class, 'index']);
    Route::get('/sounds/{key}', [SoundController::class, 'show']);
    Route::get('/sounds/{key}/download', [SoundController::class, 'download']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Auth routes
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        // Dashboard routes
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // User routes
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::post('/users/{user}/assign-role', [UserController::class, 'assignRole']);
        Route::post('/users/{user}/remove-role', [UserController::class, 'removeRole']);

        // Roles routes
        Route::get('/roles', [UserController::class, 'roles']);

        // Profile routes
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'changePassword']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);

        // Settings routes (admin only)
        Route::middleware('role:admin,super-admin')->group(function () {
            Route::get('/settings', [SettingsController::class, 'index']);
            Route::get('/settings/{group}', [SettingsController::class, 'show']);
            Route::put('/settings', [SettingsController::class, 'update']);
            Route::put('/settings/{key}', [SettingsController::class, 'updateSingle']);

            // Sound management (admin only)
            Route::post('/sounds', [SoundController::class, 'store']);
            Route::put('/sounds/{key}', [SoundController::class, 'update']);
            Route::post('/sounds/{key}/upload', [SoundController::class, 'upload']);

            // Admin Task Management (view all users' tasks)
            Route::get('/admin/tasks', [AdminTaskController::class, 'index']);
            Route::get('/admin/tasks/stats', [AdminTaskController::class, 'stats']);
            Route::get('/admin/tasks/{task}', [AdminTaskController::class, 'show']);
            Route::delete('/admin/tasks/{task}', [AdminTaskController::class, 'destroy']);

            // Admin Mood Management (view all users' moods)
            Route::get('/admin/moods', [AdminMoodController::class, 'index']);
            Route::get('/admin/moods/stats', [AdminMoodController::class, 'stats']);
            Route::get('/admin/moods/{mood}', [AdminMoodController::class, 'show']);
            Route::delete('/admin/moods/{mood}', [AdminMoodController::class, 'destroy']);

            // Admin Activity Logs (view all activity)
            Route::get('/admin/activity-logs', [AdminActivityLogController::class, 'index']);
            Route::get('/admin/activity-logs/stats', [AdminActivityLogController::class, 'stats']);
            Route::get('/admin/activity-logs/actions', [AdminActivityLogController::class, 'actions']);

            // Admin Achievement Management (view all users' achievements)
            Route::get('/admin/achievements', [AdminAchievementController::class, 'index']);
            Route::get('/admin/achievements/stats', [AdminAchievementController::class, 'stats']);
            Route::get('/admin/achievements/categories', [AdminAchievementController::class, 'categories']);
            Route::get('/admin/achievements/{achievement}', [AdminAchievementController::class, 'show']);
            Route::delete('/admin/achievements/{achievement}', [AdminAchievementController::class, 'destroy']);

            // Admin Focus Session Management (view all users' focus sessions)
            Route::get('/admin/focus-sessions', [AdminFocusSessionController::class, 'index']);
            Route::get('/admin/focus-sessions/stats', [AdminFocusSessionController::class, 'stats']);
            Route::get('/admin/focus-sessions/{focusSession}', [AdminFocusSessionController::class, 'show']);
            Route::delete('/admin/focus-sessions/{focusSession}', [AdminFocusSessionController::class, 'destroy']);

            // Admin Daily Login Management (view all users' daily login rewards)
            Route::get('/admin/daily-logins', [AdminDailyLoginController::class, 'index']);
            Route::get('/admin/daily-logins/progress', [AdminDailyLoginController::class, 'progress']);
            Route::get('/admin/daily-logins/stats', [AdminDailyLoginController::class, 'stats']);
            Route::delete('/admin/daily-logins/{dailyLoginClaim}', [AdminDailyLoginController::class, 'destroy']);
        });

        // =============================================
        // JoyTask App Routes
        // =============================================

        // Mood routes
        Route::get('/moods', [MoodController::class, 'index']);
        Route::post('/moods', [MoodController::class, 'store']);
        Route::get('/moods/stats', [MoodController::class, 'stats']);
        Route::get('/moods/{mood}', [MoodController::class, 'show']);
        Route::put('/moods/{mood}', [MoodController::class, 'update']);
        Route::delete('/moods/{mood}', [MoodController::class, 'destroy']);

        // Task routes
        Route::get('/tasks', [TaskController::class, 'index']);
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::get('/tasks/stats', [TaskController::class, 'stats']);
        Route::get('/tasks/{task}', [TaskController::class, 'show']);
        Route::put('/tasks/{task}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
        Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
    });
});
