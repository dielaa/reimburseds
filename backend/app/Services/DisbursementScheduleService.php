<?php

namespace App\Services;

use Carbon\Carbon;

/**
 * BR-01: Pencairan dilakukan setiap tanggal 15 dan 30.
 *        Jika tanggal tersebut hari libur (di sini disederhanakan: akhir pekan),
 *        pencairan dimajukan ke hari kerja sebelumnya.
 * BR-02: Pengajuan reimbursement paling lambat H-3 hari kerja sebelum jadwal pencairan.
 */
class DisbursementScheduleService
{
    /**
     * Cari tanggal pencairan berikutnya dari tanggal acuan (inklusif hari ini).
     */
    public function nextDisbursementDate(?Carbon $from = null): Carbon
    {
        $from = ($from ?? Carbon::now())->copy()->startOfDay();

        $candidate = $this->candidateForMonth($from);

        while ($candidate->lt($from)) {
            $from = $from->addMonthNoOverflow()->startOfMonth();
            $candidate = $this->candidateForMonth($from);
        }

        return $candidate;
    }

    protected function candidateForMonth(Carbon $reference): Carbon
    {
        $day15 = $reference->copy()->startOfMonth()->addDays(14);
        $lastDay = $reference->copy()->endOfMonth();
        $day30 = $lastDay->day >= 30 ? $reference->copy()->startOfMonth()->addDays(29) : $lastDay->copy();

        $day15 = $this->adjustToPreviousWorkday($day15);
        $day30 = $this->adjustToPreviousWorkday($day30);

        if ($reference->lte($day15)) {
            return $day15;
        }

        return $day30;
    }

    protected function adjustToPreviousWorkday(Carbon $date): Carbon
    {
        while ($date->isWeekend()) {
            $date->subDay();
        }

        return $date;
    }

    /**
     * Hitung tanggal batas akhir pengajuan (H-3 hari kerja) untuk sebuah tanggal pencairan.
     */
    public function submissionDeadline(Carbon $disbursementDate): Carbon
    {
        $deadline = $disbursementDate->copy();
        $remaining = 3;

        while ($remaining > 0) {
            $deadline->subDay();
            if (! $deadline->isWeekend()) {
                $remaining--;
            }
        }

        return $deadline->endOfDay();
    }

    /**
     * Cek apakah pengajuan pada $submissionDate masih memenuhi BR-02
     * untuk pencairan berikutnya.
     */
    public function isWithinSubmissionDeadline(?Carbon $submissionDate = null): bool
    {
        $submissionDate = $submissionDate ?? Carbon::now();
        $disbursement = $this->nextDisbursementDate($submissionDate);
        $deadline = $this->submissionDeadline($disbursement);

        return $submissionDate->lte($deadline);
    }
}
