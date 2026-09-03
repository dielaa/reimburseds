<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReimbursementDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Format: jpg, jpeg, png, pdf. Maksimal 5MB (5120 KB).
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'document_type' => ['required', 'in:nota,struk,invoice,form_tanpa_nota,lainnya'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Format bukti transaksi harus jpg, jpeg, png, atau pdf.',
            'file.max' => 'Ukuran file bukti transaksi maksimal 5MB.',
        ];
    }
}
