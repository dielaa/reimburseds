<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectRequest;
use App\Models\Reimbursement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FinanceController extends Controller
{
    /**
     * FR-07: Finance memverifikasi data, bukti transaksi, nominal, project/PID, dan approval.
     * Disetujui -> Verifikasi Finance
     */
    public function verify(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::DISETUJUI);

        $note = $request->input('note');
        $reimbursement->update(['status' => ReimbursementStatus::VERIFIKASI_FINANCE->value]);
        $reimbursement->logStatus(
            ReimbursementStatus::VERIFIKASI_FINANCE,
            'Sedang diverifikasi oleh Finance.' . ($note ? " Catatan: {$note}" : ''),
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

        $note = $request->input('note');
        $reimbursement->update(['status' => ReimbursementStatus::DIPROSES->value]);
        $reimbursement->logStatus(
            ReimbursementStatus::DIPROSES,
            'Pengajuan masuk proses pembayaran.' . ($note ? " Catatan: {$note}" : ''),
            $request->user()->id
        );

        return response()->json(['message' => 'Pengajuan diproses.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    /**
     * BR-01: pencairan dilakukan sesuai jadwal tanggal 15/30.
     * Diproses -> Dibayarkan
     */
    public function pay(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::DIPROSES);

        $request->validate([
            'proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ], [
            'proof.mimes' => 'Format bukti pembayaran harus jpg, jpeg, png, atau pdf.',
            'proof.max' => 'Ukuran bukti pembayaran maksimal 5MB.',
        ]);

        $note = $request->input('note');

        $update = [
            'status' => ReimbursementStatus::DIBAYARKAN->value,
            'paid_at' => now(),
        ];

        if ($request->hasFile('proof')) {
            // Hapus bukti pembayaran lama jika ada (mis. Finance mengunggah ulang).
            if ($reimbursement->payment_proof_path) {
                Storage::disk('local')->delete($reimbursement->payment_proof_path);
            }

            $file = $request->file('proof');
            $update['payment_proof_path'] = $file->store('payment-proofs/' . $reimbursement->id, 'local');
            $update['payment_proof_original_name'] = $file->getClientOriginalName();
        }

        $reimbursement->update($update);
        $reimbursement->logStatus(
            ReimbursementStatus::DIBAYARKAN,
            'Reimbursement telah dibayarkan.' . ($note ? " Catatan: {$note}" : ''),
            $request->user()->id
        );

        return response()->json(['message' => 'Pembayaran reimbursement dicatat.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    /**
     * Dibayarkan -> Selesai
     */
    public function complete(Request $request, Reimbursement $reimbursement)
    {
        $this->guardStatus($reimbursement, ReimbursementStatus::DIBAYARKAN);

        $note = $request->input('note');
        $reimbursement->update(['status' => ReimbursementStatus::SELESAI->value]);
        $reimbursement->logStatus(
            ReimbursementStatus::SELESAI,
            'Proses reimbursement selesai.' . ($note ? " Catatan: {$note}" : ''),
            $request->user()->id
        );

        return response()->json(['message' => 'Reimbursement selesai.', 'data' => $reimbursement->fresh('statusLogs')]);
    }

    /**
     * Unduh/lihat bukti pembayaran (dibatasi hanya untuk pihak berwenang:
     * pemilik pengajuan, PM/PIC, atau Finance).
     */
    public function downloadProof(Request $request, Reimbursement $reimbursement)
    {
        $user = $request->user();
        $isOwner = $reimbursement->user_id === $user->id;
        $isAuthorizedRole = in_array($user->role->value ?? $user->role, ['pm_pic', 'finance'], true);

        abort_unless($isOwner || $isAuthorizedRole, 403, 'Anda tidak berhak mengakses dokumen ini.');
        abort_if(! $reimbursement->payment_proof_path, 404, 'Bukti pembayaran belum diunggah.');

        return Storage::disk('local')->download(
            $reimbursement->payment_proof_path,
            $reimbursement->payment_proof_original_name
        );
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
