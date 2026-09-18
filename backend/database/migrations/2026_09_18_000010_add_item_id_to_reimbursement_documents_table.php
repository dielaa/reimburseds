<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reimbursement_documents', function (Blueprint $table) {
            $table->foreignId('reimbursement_item_id')
                ->nullable()
                ->after('reimbursement_id')
                ->constrained('reimbursement_items')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reimbursement_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reimbursement_item_id');
        });
    }
};
