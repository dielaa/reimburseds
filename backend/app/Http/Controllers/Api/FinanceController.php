<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectRequest;
use App\Models\Reimbursement;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    /**
     * FR-07: Finance memverifikasi data, bukti transaksi, nominal, project/PID, dan approval.
     * Disetujui -> Verifikasi Finance
     */
    public function verify(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::DISETUJUI);

        $reimbursement->update(['status' => ReimbursementStatus::VERIFIKASI_FINANCE->value]);
        $reimbursement->logStatus(
            ReimbursementStatus::VERIFIKASI_FINANCE,
            'Sedang diverifikasi oleh Finance.',
            $request->user()->id
        );

        return response()->json([
            'message' => 'Pengajuan sedang diverifikasi.',
            'data' => $reimbursement->fresh('statusLogs'),
        ]);
    }

    /**
     * Finance menolak pengajuan (data/bukti tidak sesuai). Wajib alasan (FR-06 prinsip yg sama).
     */
    public function reject(RejectRequest $request, Reimbursement $reimbursement)
    {
        abort_if(
            ! in_array($reimbursement->status, [ReimbursementStatus::DISETUJUI, ReimbursementStatus::VERIFIKASI_FINANCE], true),
            422,
            'Pengajuan ini tidak dapat ditolak pada tahap saat ini.'
        );

        $finance = $request->user();
        $reason = $request->validated('reason');

        $reimbursement->update([
            'status' => ReimbursementStatus::DITOLAK->value,
            'rejected_by' => $finance->id,
            'rejection_reason' => $reason,
        ]);
        $reimbursement->logStatus(ReimbursementStatus::DITOLAK, "Ditolak oleh Finance: {$reason}", $finance->id);

        return response()->json(['message' => 'Pengajuan ditolak oleh Finance.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    /**
     * Verifikasi Finance -> Diproses
     */
    public function process(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::VERIFIKASI_FINANCE);

        $reimbursement->update(['status' => ReimbursementStatus::DIPROSES->value]);
        $reimbursement->logStatus(ReimbursementStatus::DIPROSES, 'Pengajuan masuk proses pembayaran.', $request->user()->id);

        return response()->json(['message' => 'Pengajuan diproses.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    /**
     * BR-01: pencairan dilakukan sesuai jadwal tanggal 15/30.
     * Diproses -> Dibayarkan
     */
    public function pay(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::DIPROSES);

        $reimbursement->update([
            'status' => ReimbursementStatus::DIBAYARKAN->value,
            'paid_at' => now(),
        ]);
        $reimbursement->logStatus(ReimbursementStatus::DIBAYARKAN, 'Reimbursement telah dibayarkan.', $request->user()->id);

        return response()->json(['message' => 'Pembayaran reimbursement dicatat.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    /**
     * Dibayarkan -> Selesai
     */
    public function complete(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::DIBAYARKAN);

        $reimbursement->update(['status' => ReimbursementStatus::SELESAI->value]);
        $reimbursement->logStatus(ReimbursementStatus::SELESAI, 'Proses reimbursement selesai.', $request->user()->id);

        return response()->json(['message' => 'Reimbursement selesai.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    protected function guardStatus(Reimbursement $reimbursement, ReimbursementStatus $expected): void
    {
        abort_if(
            $reimbursement->status !== $expected,
            422,
            "Pengajuan harus berstatus {$expected->label()} untuk aksi ini."
        );
    }
}
