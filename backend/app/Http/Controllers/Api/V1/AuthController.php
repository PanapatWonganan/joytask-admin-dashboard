<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Traits\ApiResponse;
use Google_Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;
    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is inactive. Please contact support.'],
            ]);
        }

        // Revoke all previous tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Register new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        // Assign default role
        $user->assignRole('user');

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->created([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 'Registration successful');
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Get current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success($this->formatUser($request->user()));
    }

    /**
     * Refresh token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token
        $user->currentAccessToken()->delete();

        // Create new token
        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success(['token' => $token], 'Token refreshed');
    }

    /**
     * Login/Register with Google ID Token.
     * This endpoint is for Flutter app Google Sign-in.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'id_token' => ['required', 'string'],
        ]);

        try {
            // Verify Google ID Token
            $client = new Google_Client();

            // Collect all valid client IDs (web, iOS, Android)
            // The token's audience (aud) must match one of these
            $clientIds = array_values(array_filter([
                config('services.google.client_id'),
                config('services.google.ios_client_id'),
                config('services.google.android_client_id'),
            ]));

            // Try verifying against each client ID
            // Google ID tokens from iOS have aud=iOS_CLIENT_ID,
            // from Android have aud=WEB_CLIENT_ID (when using serverClientId)
            $payload = null;
            foreach ($clientIds as $clientId) {
                $client->setClientId($clientId);
                $payload = $client->verifyIdToken($request->id_token);
                if ($payload) {
                    break;
                }
            }

            if (!$payload) {
                return $this->unauthorized('Invalid Google ID token');
            }

            // Extract user info from Google payload
            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'] ?? $payload['email'];
            $avatarUrl = $payload['picture'] ?? null;
            $emailVerified = $payload['email_verified'] ?? false;

            if (!$emailVerified) {
                return $this->unauthorized('Google email is not verified');
            }

            // Find existing user by google_id or email
            $user = User::where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            $isNewUser = false;

            if ($user) {
                // Existing user - update Google info if needed
                $user->update([
                    'google_id' => $googleId,
                    'provider' => 'google',
                    'avatar_url' => $avatarUrl ?? $user->avatar_url,
                    'last_login_at' => now(),
                ]);
            } else {
                // New user - create account
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'provider' => 'google',
                    'avatar_url' => $avatarUrl,
                    'password' => Hash::make(Str::random(32)), // Random password for Google users
                    'status' => 'active',
                    'last_login_at' => now(),
                ]);

                // Assign default role
                $user->assignRole('user');
                $isNewUser = true;
            }

            // Check if user is active
            if ($user->status !== 'active') {
                return $this->forbidden('Your account is inactive. Please contact support.');
            }

            // Revoke all previous tokens
            $user->tokens()->delete();

            // Create new token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Log activity
            ActivityLog::log(
                $user,
                $isNewUser ? 'google_register' : 'google_login',
                ['provider' => 'google', 'email' => $email],
                $request->ip(),
                $request->userAgent()
            );

            $data = [
                'user' => $this->formatUser($user),
                'token' => $token,
                'is_new_user' => $isNewUser,
            ];

            if ($isNewUser) {
                return $this->created($data, 'Registration successful');
            }

            return $this->success($data, 'Login successful');

        } catch (\Exception $e) {
            Log::error('Google login error: ' . $e->getMessage());

            return $this->error(
                'Failed to authenticate with Google',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Format user data for response.
     */
    private function formatUser(User $user): array
    {
        $user->load('roles');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar_url,
            'provider' => $user->provider,
            'status' => $user->status,
            'roles' => $user->roles->map(fn($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
            ]),
            'created_at' => $user->created_at->toISOString(),
            'updated_at' => $user->updated_at->toISOString(),
        ];
    }
}
