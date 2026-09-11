<?php

namespace App\Http\Controllers\Api;

use App\Enums\ApprovalStatus;
use App\Enums\ReimbursementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectRequest;
use App\Models\Reimbursement;
use Illuminate\Http\Request;
use App\Services\TelegramService;


class ApprovalController extends Controller
{

    public function __construct(protected TelegramService $telegram)
    {
    }

    /**
     * FR-05: PM/PIC memeriksa detail & bukti transaksi lalu menyetujui pengajuan.
     */
    public function approve(Request $request, Reimbursement $reimbursement)
    {
        $this->guardMenungguApproval($reimbursement);

        $approver = $request->user();
        $note = $request->input('note');

        $reimbursement->approvals()->create([
            'approver_id' => $approver->id,
            'status' => ApprovalStatus::APPROVED->value,
            'note' => $note,
            'decided_at' => now(),
        ]);

        $reimbursement->update(['status' => ReimbursementStatus::DISETUJUI->value]);
        $logMessage = 'Disetujui oleh Project Manager/PIC.' . ($note ? " Catatan: {$note}" : '');
        $reimbursement->logStatus(ReimbursementStatus::DISETUJUI, 'Disetujui oleh Project Manager/PIC.', $approver->id);

        $detailUrl = config('services.app.frontend_url') . "/riwayat/{$reimbursement->id}";

        $this->telegram->notifyRole(
            'finance',
            "✅ <b>Pengajuan Disetujui PM/PIC</b>\n" .
            "Karyawan: {$reimbursement->user->name}\n" .
            "Total: Rp " . number_format($reimbursement->total_amount, 0, ',', '.') . "\n" .
            "Menunggu verifikasi Finance.",
            $detailUrl
        );

        return response()->json([
            'message' => 'Pengajuan disetujui dan diteruskan ke Finance.',
            'data' => $reimbursement->fresh(['approvals', 'statusLogs']),
        ]);
    }

    /**
     * FR-05 & FR-06: PM/PIC menolak pengajuan, wajib disertai alasan.
     */
    public function reject(RejectRequest $request, Reimbursement $reimbursement)
    {
        $this->guardMenungguApproval($reimbursement);

        $approver = $request->user();
        $reason = $request->validated('reason');

        $reimbursement->approvals()->create([
            'approver_id' => $approver->id,
            'status' => ApprovalStatus::REJECTED->value,
            'note' => $reason,
            'decided_at' => now(),
        ]);

        $reimbursement->update([
            'status' => ReimbursementStatus::DITOLAK->value,
            'rejected_by' => $approver->id,
            'rejection_reason' => $reason,
        ]);
        $reimbursement->logStatus(ReimbursementStatus::DITOLAK, "Ditolak oleh PM/PIC: {$reason}", $approver->id);

        $detailUrl = config('services.app.frontend_url') . "/riwayat/{$reimbursement->id}";

        $this->telegram->notifyUser(
            $reimbursement->user,
            "❌ <b>Pengajuan Ditolak</b>\nAlasan: {$reason}",
            $detailUrl
        );

        return response()->json([
            'message' => 'Pengajuan ditolak.',
            'data' => $reimbursement->fresh(['approvals', 'statusLogs']),
        ]);
    }

    protected function guardMenungguApproval(Reimbursement $reimbursement): void
    {
        abort_if(
            $reimbursement->status !== ReimbursementStatus::MENUNGGU_APPROVAL,
            422,
            'Pengajuan ini tidak sedang menunggu approval.'
        );
    }
}
