<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReimbursementRequest;
use App\Http\Requests\UpdateReimbursementRequest;
use App\Models\Reimbursement;
use App\Services\ReimbursementValidationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReimbursementController extends Controller
{
    public function __construct(protected ReimbursementValidationService $validationService)
    {
    }

    /**
     * FR-03: daftar pengajuan. Difilter sesuai role (FR-10).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Reimbursement::with(['project', 'user'])->latest();

        if ($user->role === UserRole::KARYAWAN) {
            $query->where('user_id', $user->id);
        } elseif ($user->role === UserRole::PM_PIC) {
            if ($request->boolean('pending_only')) {
                $query->where('status', ReimbursementStatus::MENUNGGU_APPROVAL->value);
            }
        } elseif ($user->role === UserRole::FINANCE) {
            if ($request->boolean('pending_only')) {
                $query->whereIn('status', [
                    ReimbursementStatus::DISETUJUI->value,
                    ReimbursementStatus::VERIFIKASI_FINANCE->value,
                    ReimbursementStatus::DIPROSES->value,
                ]);
            }
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json(['data' => $query->paginate(15)]);
    }

    /**
     * FR-02: karyawan membuat pengajuan reimbursement beserta rincian biaya.
     */
    public function store(StoreReimbursementRequest $request)
    {
        $user = $request->user();

        if ($user->role !== UserRole::KARYAWAN) {
            return response()->json(['message' => 'Hanya karyawan yang dapat membuat pengajuan.'], 403);
        }

        $data = $request->validated();

        $reimbursement = Reimbursement::create([
            'user_id' => $user->id,
            'project_id' => $data['project_id'] ?? null,
            'date' => $data['date'],
            'purpose' => $data['purpose'],
            'status' => ReimbursementStatus::DRAFT->value,
        ]);

        foreach ($data['items'] as $item) {
            $reimbursement->items()->create($item);
        }

        $reimbursement->recalculateTotal();
        $reimbursement->logStatus(ReimbursementStatus::DRAFT, 'Pengajuan dibuat sebagai draft.', $user->id);

        return response()->json([
            'message' => 'Draft pengajuan berhasil dibuat.',
            'data' => $reimbursement->load('items', 'documents'),
        ], 201);
    }

    /**
     * FR-04: detail reimbursement + timeline status.
     */
    public function show(Request $request, Reimbursement $reimbursement)
    {
        $this->authorizeView($request, $reimbursement);

        return response()->json([
            'data' => $reimbursement->load([
                'items', 'documents', 'project', 'user',
                'approvals.approver', 'statusLogs.changedBy',
            ]),
        ]);
    }

    /**
     * Karyawan mengubah data pengajuan selama masih Draft.
     */
    public function update(UpdateReimbursementRequest $request, Reimbursement $reimbursement)
    {
        $user = $request->user();

        if ($reimbursement->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak berhak mengubah pengajuan ini.'], 403);
        }

        if ($reimbursement->status !== ReimbursementStatus::DRAFT) {
            return response()->json(['message' => 'Pengajuan hanya dapat diubah selama berstatus Draft.'], 422);
        }

        $reimbursement->update($request->validated());

        return response()->json(['message' => 'Pengajuan berhasil diperbarui.', 'data' => $reimbursement]);
    }

    public function destroy(Request $request, Reimbursement $reimbursement)
    {
        $user = $request->user();

        if ($reimbursement->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak berhak menghapus pengajuan ini.'], 403);
        }

        if ($reimbursement->status !== ReimbursementStatus::DRAFT) {
            return response()->json(['message' => 'Pengajuan hanya dapat dihapus selama berstatus Draft.'], 422);
        }

        $reimbursement->delete();

        return response()->json(['message' => 'Draft pengajuan berhasil dihapus.']);
    }

    /**
     * Submit pengajuan: Draft -> Diajukan -> Menunggu Approval.
     * Menjalankan validasi BR-03, BR-04, BR-08 (hard) dan BR-02 (soft warning).
     */
    public function submit(Request $request, Reimbursement $reimbursement)
    {
        $user = $request->user();

        if ($reimbursement->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak berhak mengajukan reimbursement ini.'], 403);
        }

        if ($reimbursement->status !== ReimbursementStatus::DRAFT) {
            return response()->json(['message' => 'Hanya pengajuan berstatus Draft yang dapat disubmit.'], 422);
        }

        try {
            $this->validationService->validateForSubmission($reimbursement);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Pengajuan belum lengkap.', 'errors' => $e->errors()], 422);
        }

        $warnings = $this->validationService->getSubmissionWarnings($reimbursement);

        $reimbursement->update([
            'status' => ReimbursementStatus::MENUNGGU_APPROVAL->value,
            'submitted_at' => now(),
        ]);

        $reimbursement->logStatus(ReimbursementStatus::DIAJUKAN, 'Pengajuan dikirim oleh karyawan.', $user->id);
        $reimbursement->logStatus(ReimbursementStatus::MENUNGGU_APPROVAL, 'Menunggu approval Project Manager/PIC.', $user->id);

        return response()->json([
            'message' => 'Pengajuan berhasil disubmit dan menunggu approval.',
            'warnings' => $warnings,
            'data' => $reimbursement->fresh(['items', 'documents', 'statusLogs']),
        ]);
    }

    protected function authorizeView(Request $request, Reimbursement $reimbursement): void
    {
        $user = $request->user();

        if ($user->role === UserRole::KARYAWAN && $reimbursement->user_id !== $user->id) {
            abort(403, 'Anda tidak berhak melihat pengajuan ini.');
        }
    }
}
