<?php

namespace App\Enums;

enum UserRole: string
{
    case KARYAWAN = 'karyawan';
    case PM_PIC = 'pm_pic';
    case FINANCE = 'finance';

    public function label(): string
    {
        return match ($this) {
            self::KARYAWAN => 'Karyawan',
            self::PM_PIC => 'Project Manager / PIC',
            self::FINANCE => 'Finance',
        };
    }
}
