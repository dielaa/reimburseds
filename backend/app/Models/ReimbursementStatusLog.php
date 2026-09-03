<?php

namespace App\Models;

use App\Enums\ReimbursementStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReimbursementStatusLog extends Model
{
    protected $fillable = ['reimbursement_id', 'status', 'note', 'changed_by'];

    protected function casts(): array
    {
        return [
            'status' => ReimbursementStatus::class,
        ];
    }

    public function reimbursement(): BelongsTo
    {
        return $this->belongsTo(Reimbursement::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
