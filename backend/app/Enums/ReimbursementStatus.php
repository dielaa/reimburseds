<?php

namespace App\Enums;

enum ReimbursementStatus: string
{
    case DRAFT = 'draft';
    case DIAJUKAN = 'diajukan';
    case MENUNGGU_APPROVAL = 'menunggu_approval';
    case DISETUJUI = 'disetujui';
    case VERIFIKASI_FINANCE = 'verifikasi_finance';
    case DIPROSES = 'diproses';
    case DIBAYARKAN = 'dibayarkan';
    case SELESAI = 'selesai';
    case DITOLAK = 'ditolak';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::DIAJUKAN => 'Diajukan',
            self::MENUNGGU_APPROVAL => 'Menunggu Approval',
            self::DISETUJUI => 'Disetujui',
            self::VERIFIKASI_FINANCE => 'Verifikasi Finance',
            self::DIPROSES => 'Diproses',
            self::DIBAYARKAN => 'Dibayarkan',
            self::SELESAI => 'Selesai',
            self::DITOLAK => 'Ditolak',
        };
    }
}
