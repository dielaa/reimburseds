<?php

use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ReimbursementController;
use App\Http\Controllers\Api\ReimbursementDocumentController;
use App\Http\Controllers\Api\ReimbursementItemController;
use Illuminate\Support\Facades\Route;

// ==== Public ====
Route::post('/login', [AuthController::class, 'login']);

// ==== Authenticated (semua role) ====
Route::middleware('auth.token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::put('/profile', [AuthController::class, 'updateProfile']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/projects', [ProjectController::class, 'index']);

    // Reimbursement: list & detail bisa diakses semua role (difilter/otorisasi di controller - FR-10)
    Route::get('/reimbursements', [ReimbursementController::class, 'index']);
    Route::get('/reimbursements/{reimbursement}', [ReimbursementController::class, 'show']);

    // ==== Karyawan (FR-02, FR-04) ====
    Route::middleware('role:karyawan')->group(function () {
        Route::post('/projects', [ProjectController::class, 'store']); // opsional: buat project baru jika belum ada
        Route::post('/reimbursements', [ReimbursementController::class, 'store']);
        Route::put('/reimbursements/{reimbursement}', [ReimbursementController::class, 'update']);
        Route::delete('/reimbursements/{reimbursement}', [ReimbursementController::class, 'destroy']);
        Route::post('/reimbursements/{reimbursement}/submit', [ReimbursementController::class, 'submit']);

        Route::post('/reimbursements/{reimbursement}/items', [ReimbursementItemController::class, 'store']);
        Route::delete('/reimbursements/{reimbursement}/items/{item}', [ReimbursementItemController::class, 'destroy']);

        Route::post('/reimbursements/{reimbursement}/documents', [ReimbursementDocumentController::class, 'store']);
        Route::delete('/reimbursements/{reimbursement}/documents/{document}', [ReimbursementDocumentController::class, 'destroy']);
    });

    // Download dokumen: pemilik, PM/PIC, atau Finance (dicek manual di controller)
    Route::get('/reimbursements/{reimbursement}/documents/{document}/download', [ReimbursementDocumentController::class, 'download']);

    // ==== Project Manager / PIC (FR-05, FR-06) ====
    Route::middleware('role:pm_pic')->group(function () {
        Route::post('/reimbursements/{reimbursement}/approve', [ApprovalController::class, 'approve']);
        Route::post('/reimbursements/{reimbursement}/reject', [ApprovalController::class, 'reject']);
    });

    // ==== Finance (FR-07) ====
    Route::middleware('role:finance')->group(function () {
        Route::post('/reimbursements/{reimbursement}/verify', [FinanceController::class, 'verify']);
        Route::post('/reimbursements/{reimbursement}/finance-reject', [FinanceController::class, 'reject']);
        Route::post('/reimbursements/{reimbursement}/process', [FinanceController::class, 'process']);
        Route::post('/reimbursements/{reimbursement}/pay', [FinanceController::class, 'pay']);
        Route::post('/reimbursements/{reimbursement}/complete', [FinanceController::class, 'complete']);
    });
});
