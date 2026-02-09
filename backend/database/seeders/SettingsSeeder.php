<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General settings
            [
                'key' => 'app_name',
                'value' => 'Admin Dashboard',
                'type' => 'string',
                'group' => 'general',
            ],
            [
                'key' => 'app_description',
                'value' => 'Admin Dashboard for managing users and settings',
                'type' => 'string',
                'group' => 'general',
            ],
            [
                'key' => 'app_timezone',
                'value' => 'Asia/Bangkok',
                'type' => 'string',
                'group' => 'general',
            ],
            [
                'key' => 'date_format',
                'value' => 'Y-m-d',
                'type' => 'string',
                'group' => 'general',
            ],
            [
                'key' => 'time_format',
                'value' => 'H:i:s',
                'type' => 'string',
                'group' => 'general',
            ],

            // Email settings
            [
                'key' => 'mail_from_name',
                'value' => 'Admin Dashboard',
                'type' => 'string',
                'group' => 'email',
            ],
            [
                'key' => 'mail_from_address',
                'value' => 'noreply@example.com',
                'type' => 'string',
                'group' => 'email',
            ],

            // Appearance settings
            [
                'key' => 'primary_color',
                'value' => '#3b82f6',
                'type' => 'string',
                'group' => 'appearance',
            ],
            [
                'key' => 'default_theme',
                'value' => 'system',
                'type' => 'string',
                'group' => 'appearance',
            ],

            // Feature flags
            [
                'key' => 'registration_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'features',
            ],
            [
                'key' => 'google_login_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'features',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
