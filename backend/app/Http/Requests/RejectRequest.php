<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // FR-06: Penolakan wajib disertai alasan.
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ];
    }
}
