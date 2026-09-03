<?php

namespace App\Services;

use App\Models\Reimbursement;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class ReimbursementValidationService
{
    public function __construct(protected DisbursementScheduleService $schedule)
    {
    }

    /**
     * Validasi kelengkapan sebelum reimbursement disubmit (status Draft -> Diajukan).
     * Melempar ValidationException jika ada rule yang gagal.
     */
    public function validateForSubmission(Reimbursement $reimbursement): void
    {
        $errors = [];

        // BR-03: wajib ada bukti transaksi
        if ($reimbursement->documents()->count() === 0) {
            $errors['documents'] = ['Bukti transaksi wajib diunggah sebelum pengajuan (BR-03).'];
        }

        // Wajib ada minimal 1 rincian biaya
        if ($reimbursement->items()->count() === 0) {
            $errors['items'] = ['Rincian biaya wajib diisi minimal 1 item.'];
        }

        // BR-04: reimbursement project wajib mencantumkan PID/nama project
        if ($reimbursement->project_id) {
            $project = $reimbursement->project;
            if (! $project || (! $project->pid_number && ! $project->name)) {
                $errors['project_id'] = ['Reimbursement project wajib mencantumkan PID Number atau nama project (BR-04).'];
            }
        }

        // BR-08: bukti pembayaran berlaku maksimal 2 bulan berjalan dari tanggal transaksi
        if ($reimbursement->date && Carbon::parse($reimbursement->date)->lt(Carbon::now()->subMonthsNoOverflow(2)->startOfDay())) {
            $errors['date'] = ['Bukti transaksi sudah melewati masa berlaku 2 bulan (BR-08).'];
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * BR-02 bersifat informatif (tidak memblokir pengajuan): jika sudah lewat H-3
     * hari kerja dari jadwal pencairan terdekat, beri tahu bahwa pengajuan otomatis
     * masuk ke jadwal pencairan berikutnya.
     *
     * @return string[]
     */
    public function getSubmissionWarnings(Reimbursement $reimbursement): array
    {
        $warnings = [];

        if (! $this->schedule->isWithinSubmissionDeadline(Carbon::now())) {
            $next = $this->schedule->nextDisbursementDate(Carbon::now()->addDay());
            $warnings[] = "Pengajuan melewati batas H-3 hari kerja untuk jadwal pencairan terdekat (BR-02). "
                . "Pengajuan ini akan masuk ke jadwal pencairan pada {$next->translatedFormat('d F Y')}.";
        }

        return $warnings;
    }
}
