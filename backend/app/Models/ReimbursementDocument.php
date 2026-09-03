<?php

namespace App\Models;

use App\Enums\DocumentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReimbursementDocument extends Model
{
    use HasFactory;

    protected $fillable = ['reimbursement_id', 'file', 'original_name', 'document_type'];

    protected function casts(): array
    {
        return [
            'document_type' => DocumentType::class,
        ];
    }

    public function reimbursement(): BelongsTo
    {
        return $this->belongsTo(Reimbursement::class);
    }
}
