<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReimbursementDocumentRequest;
use App\Models\Reimbursement;
use App\Models\ReimbursementDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReimbursementDocumentController extends Controller
{
    /**
     * FR-09: validasi format & ukuran file sudah ditangani di StoreReimbursementDocumentRequest.
     * File disimpan di disk "local" (storage/app/private) agar hanya dapat diakses
     * pihak berwenang melalui aplikasi (bukan URL publik langsung) — lihat BR-... File Security.
     */
    public function store(StoreReimbursementDocumentRequest $request, Reimbursement $reimbursement)
    {
        $user = $request->user();

        abort_if($reimbursement->user_id !== $user->id, 403, 'Anda tidak berhak mengubah pengajuan ini.');
        abort_if(
            $reimbursement->status !== ReimbursementStatus::DRAFT,
            422,
            'Bukti transaksi hanya dapat diunggah selama status Draft.'
        );

        $file = $request->file('file');
        $path = $file->store('reimbursement-documents/' . $reimbursement->id, 'local');

        $document = $reimbursement->documents()->create([
            'file' => $path,
            'original_name' => $file->getClientOriginalName(),
            'document_type' => $request->validated('document_type'),
        ]);

        return response()->json(['message' => 'Bukti transaksi berhasil diunggah.', 'data' => $document], 201);
    }

    public function destroy(Request $request, Reimbursement $reimbursement, ReimbursementDocument $document)
    {
        $user = $request->user();

        abort_if($reimbursement->user_id !== $user->id, 403, 'Anda tidak berhak mengubah pengajuan ini.');
        abort_if($reimbursement->status !== ReimbursementStatus::DRAFT, 422, 'Bukti transaksi hanya dapat dihapus selama status Draft.');
        abort_if($document->reimbursement_id !== $reimbursement->id, 404, 'Dokumen tidak ditemukan pada pengajuan ini.');

        Storage::disk('local')->delete($document->file);
        $document->delete();

        return response()->json(['message' => 'Bukti transaksi dihapus.']);
    }

    /**
     * Unduh/lihat file (dibatasi hanya untuk pihak berwenang: pemilik, PM/PIC, Finance).
     */
    public function download(Request $request, Reimbursement $reimbursement, ReimbursementDocument $document)
    {
        $user = $request->user();
        $isOwner = $reimbursement->user_id === $user->id;
        $isAuthorizedRole = in_array($user->role->value ?? $user->role, ['pm_pic', 'finance'], true);

        abort_unless($isOwner || $isAuthorizedRole, 403, 'Anda tidak berhak mengakses dokumen ini.');
        abort_if($document->reimbursement_id !== $reimbursement->id, 404);

        return Storage::disk('local')->download($document->file, $document->original_name);
    }
}
