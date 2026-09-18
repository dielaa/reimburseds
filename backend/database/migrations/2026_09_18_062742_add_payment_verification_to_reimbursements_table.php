<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reimbursements', function (Blueprint $table) {
            $table->timestamp('payment_confirmed_at')->nullable()->after('payment_proof_original_name');
            $table->text('payment_revision_reason')->nullable()->after('payment_confirmed_at');
            $table->timestamp('payment_revision_requested_at')->nullable()->after('payment_revision_reason');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reimbursements', function (Blueprint $table) {
             $table->dropColumn([
                'payment_confirmed_at',
                'payment_revision_reason',
                'payment_revision_requested_at',
            ]);
        });
    }
};
