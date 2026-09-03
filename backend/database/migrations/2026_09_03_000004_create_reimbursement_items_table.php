<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reimbursement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reimbursement_id')->constrained('reimbursements')->cascadeOnDelete();
            $table->string('category');
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reimbursement_items');
    }
};
