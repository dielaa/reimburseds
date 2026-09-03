<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Reimbursement;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Reimbursement::query();

        if ($user->role === UserRole::KARYAWAN) {
            $query->where('user_id', $user->id);
        }

        $base = clone $query;

        $summary = [
            'total' => (clone $base)->count(),
            'draft' => (clone $base)->where('status', ReimbursementStatus::DRAFT->value)->count(),
            'menunggu_approval' => (clone $base)->where('status', ReimbursementStatus::MENUNGGU_APPROVAL->value)->count(),
            'disetujui' => (clone $base)->where('status', ReimbursementStatus::DISETUJUI->value)->count(),
            'verifikasi_finance' => (clone $base)->where('status', ReimbursementStatus::VERIFIKASI_FINANCE->value)->count(),
            'diproses' => (clone $base)->where('status', ReimbursementStatus::DIPROSES->value)->count(),
            'dibayarkan' => (clone $base)->where('status', ReimbursementStatus::DIBAYARKAN->value)->count(),
            'selesai' => (clone $base)->where('status', ReimbursementStatus::SELESAI->value)->count(),
            'ditolak' => (clone $base)->where('status', ReimbursementStatus::DITOLAK->value)->count(),
        ];

        $recent = (clone $base)->with('project')->latest()->limit(5)->get();

        return response()->json([
            'role' => $user->role,
            'summary' => $summary,
            'recent' => $recent,
        ]);
    }
}
