<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        Project::updateOrCreate(
            ['pid_number' => 'PID-2026-001'],
            ['name' => 'Internal Tools Revamp']
        );

        Project::updateOrCreate(
            ['pid_number' => 'PID-2026-002'],
            ['name' => 'Client Onboarding Platform']
        );
    }
}
