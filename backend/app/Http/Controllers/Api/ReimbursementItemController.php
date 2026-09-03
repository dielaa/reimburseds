<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReimbursementStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReimbursementItemRequest;
use App\Models\Reimbursement;
use App\Models\ReimbursementItem;
use Illuminate\Http\Request;

class ReimbursementItemController extends Controller
{
    public function store(StoreReimbursementItemRequest $request, Reimbursement $reimbursement)
    {
        $this->authorizeDraftOwner($request, $reimbursement);

        $item = $reimbursement->items()->create($request->validated());
        $reimbursement->recalculateTotal();

        return response()->json(['message' => 'Item biaya ditambahkan.', 'data' => $item], 201);
    }

    public function destroy(Request $request, Reimbursement $reimbursement, ReimbursementItem $item)
    {
        $this->authorizeDraftOwner($request, $reimbursement);

        if ($item->reimbursement_id !== $reimbursement->id) {
            return response()->json(['message' => 'Item tidak ditemukan pada pengajuan ini.'], 404);
        }

        $item->delete();
        $reimbursement->recalculateTotal();

        return response()->json(['message' => 'Item biaya dihapus.']);
    }

    protected function authorizeDraftOwner(Request $request, Reimbursement $reimbursement): void
    {
        $user = $request->user();

        abort_if($reimbursement->user_id !== $user->id, 403, 'Anda tidak berhak mengubah pengajuan ini.');
        abort_if($reimbursement->status !== ReimbursementStatus::DRAFT, 422, 'Rincian biaya hanya dapat diubah selama status Draft.');
    }
}
