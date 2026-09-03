<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'karyawan@daas.com'],
            [
                'name' => 'Dasa Karyawan',
                'password' => Hash::make('password'),
                'role' => UserRole::KARYAWAN->value,
                'department' => 'Engineering',
            ]
        );

        User::updateOrCreate(
            ['email' => 'pm@daas.com'],
            [
                'name' => 'Dasa PM',
                'password' => Hash::make('password'),
                'role' => UserRole::PM_PIC->value,
                'department' => 'Engineering',
            ]
        );

        User::updateOrCreate(
            ['email' => 'finance@daas.com'],
            [
                'name' => 'Dasa Finance',
                'password' => Hash::make('password'),
                'role' => UserRole::FINANCE->value,
                'department' => 'Finance',
            ]
        );
    }
}
