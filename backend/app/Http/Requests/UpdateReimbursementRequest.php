<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReimbursementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project' => ['nullable', 'string', 'max:255'],
            'date' => ['sometimes', 'required', 'date'],
            'purpose' => ['sometimes', 'required', 'string', 'max:1000'],
        ];
    }
}
