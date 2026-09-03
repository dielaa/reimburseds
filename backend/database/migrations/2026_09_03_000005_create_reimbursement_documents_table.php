<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reimbursement_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reimbursement_id')->constrained('reimbursements')->cascadeOnDelete();
            $table->string('file'); // path tersimpan di storage
            $table->string('original_name')->nullable();
            $table->string('document_type');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reimbursement_documents');
    }
};
