<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Full access to all features',
            ],
            [
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Can manage users and view reports',
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Basic user access',
            ],
            [
                'name' => 'guest',
                'display_name' => 'Guest',
                'description' => 'Limited read-only access',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
