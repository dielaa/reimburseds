<?php

namespace App\Models;

use App\Enums\ItemCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReimbursementItem extends Model
{
    use HasFactory;

    protected $fillable = ['reimbursement_id', 'category', 'description', 'amount'];

    protected function casts(): array
    {
        return [
            'category' => ItemCategory::class,
            'amount' => 'decimal:2',
        ];
    }

    public function reimbursement(): BelongsTo
    {
        return $this->belongsTo(Reimbursement::class);
    }
}
