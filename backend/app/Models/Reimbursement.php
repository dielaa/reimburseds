<?php

namespace App\Models;

use App\Enums\ReimbursementStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reimbursement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'project',
        'date',
        'purpose',
        'total_amount',
        'status',
        'rejected_by',
        'rejection_reason',
        'submitted_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'submitted_at' => 'datetime',
            'paid_at' => 'datetime',
            'total_amount' => 'decimal:2',
            'status' => ReimbursementStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReimbursementItem::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ReimbursementDocument::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(ReimbursementStatusLog::class)->latest();
    }

    public function recalculateTotal(): void
    {
        $this->total_amount = $this->items()->sum('amount');
        $this->save();
    }

    public function logStatus(ReimbursementStatus $status, ?string $note = null, ?int $changedBy = null): void
    {
        $this->statusLogs()->create([
            'status' => $status->value,
            'note' => $note,
            'changed_by' => $changedBy,
        ]);
    }
}
