<?php

namespace App\Enums;

// Catatan: PRD tidak merinci daftar kategori biaya secara eksplisit.
// Daftar berikut adalah asumsi kategori umum reimbursement DASA,
// silakan sesuaikan/tambah sesuai kebijakan Finance yang berlaku.
enum ItemCategory: string
{
    case TRANSPORTASI = 'transportasi';
    case AKOMODASI = 'akomodasi';
    case KONSUMSI = 'konsumsi';
    case KOMUNIKASI = 'komunikasi';
    case PERLENGKAPAN = 'perlengkapan';
    case LAINNYA = 'lainnya';
}
