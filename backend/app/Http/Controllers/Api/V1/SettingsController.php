<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    use ApiResponse;

    /**
     * Get all settings.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group')->map(function ($group) {
            return $group->mapWithKeys(function ($setting) {
                return [
                    $setting->key => [
                        'value' => $this->castValue($setting->value, $setting->type),
                        'type' => $setting->type,
                    ]
                ];
            });
        });

        return $this->success($settings);
    }

    /**
     * Get settings by group.
     */
    public function show(string $group): JsonResponse
    {
        $settings = Setting::where('group', $group)
            ->get()
            ->mapWithKeys(function ($setting) {
                return [
                    $setting->key => [
                        'value' => $this->castValue($setting->value, $setting->type),
                        'type' => $setting->type,
                    ]
                ];
            });

        return $this->success($settings);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['present'],
            'settings.*.type' => ['sometimes', 'string', 'in:string,boolean,integer,float,array,json'],
            'settings.*.group' => ['sometimes', 'string'],
        ]);

        foreach ($validated['settings'] as $settingData) {
            $value = $settingData['value'];

            // Convert value to string for storage
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value);
            } elseif (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            } else {
                $value = (string) $value;
            }

            Setting::updateOrCreate(
                ['key' => $settingData['key']],
                [
                    'value' => $value,
                    'type' => $settingData['type'] ?? 'string',
                    'group' => $settingData['group'] ?? 'general',
                ]
            );
        }

        // Clear cache
        Setting::clearCache();

        return $this->success(null, 'Settings updated successfully');
    }

    /**
     * Update a single setting.
     */
    public function updateSingle(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => ['present'],
            'type' => ['sometimes', 'string', 'in:string,boolean,integer,float,array,json'],
            'group' => ['sometimes', 'string'],
        ]);

        $value = $validated['value'];

        // Convert value to string for storage
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        } elseif (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        } else {
            $value = (string) $value;
        }

        $setting = Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $validated['type'] ?? 'string',
                'group' => $validated['group'] ?? 'general',
            ]
        );

        // Clear cache
        Setting::clearCache();

        return $this->success([
            'key' => $setting->key,
            'value' => $this->castValue($setting->value, $setting->type),
            'type' => $setting->type,
            'group' => $setting->group,
        ], 'Setting updated successfully');
    }

    /**
     * Cast value based on type.
     */
    protected function castValue(string $value, string $type): mixed
    {
        return match ($type) {
            'boolean', 'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer', 'int' => (int) $value,
            'float', 'double' => (float) $value,
            'array', 'json' => json_decode($value, true) ?? [],
            default => $value,
        };
    }
}
