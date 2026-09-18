<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReimbursementDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $reimbursement = $this->route('reimbursement');

        return [
            // Format: jpg, jpeg, png, pdf. Maksimal 5MB (5120 KB).
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'document_type' => ['required', 'in:nota,struk,invoice,form_tanpa_nota,lainnya'],
            // Foto/bukti per item: opsional, tapi jika diisi harus milik pengajuan ini.
            'reimbursement_item_id' => [
                'nullable',
                'integer',
                Rule::exists('reimbursement_items', 'id')->where(
                    fn ($query) => $query->where('reimbursement_id', $reimbursement?->id)
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Format bukti transaksi harus jpg, jpeg, png, atau pdf.',
            'file.max' => 'Ukuran file bukti transaksi maksimal 5MB.',
            'reimbursement_item_id.exists' => 'Item biaya tujuan tidak ditemukan pada pengajuan ini.',
        ];
    }
}
