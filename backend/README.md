# Reimburse - Backend Laravel

Backend untuk aplikasi **Reimburse (Formulir Permohonan Pergantian DASA)** sesuai PRD & ERD yang diberikan.
Tanpa Sanctum/Passport/JWT — autentikasi API token dibuat manual (murni Laravel core: `Hash`, `Str`, `Auth`).

## 1. Cara pakai (kamu belum install package apapun)

1. Buat project Laravel baru (kalau belum):
   ```bash
   composer create-project laravel/laravel reimburse-be
   cd reimburse-be
   ```
2. Salin/timpa folder & file dari paket ini ke project barumu, mengikuti struktur yang sama:
   - `app/Enums/*`
   - `app/Models/*` (menimpa `User.php` bawaan)
   - `app/Services/*`
   - `app/Http/Middleware/*`
   - `app/Http/Requests/*`
   - `app/Http/Controllers/Api/*` (dan `Controller.php` kalau belum ada)
   - `database/migrations/*` (tambahan, jangan hapus migration `users`, `cache`, `jobs` bawaan)
   - `database/seeders/*`
   - `routes/api.php` (timpa)

3. **Daftarkan middleware** di `bootstrap/app.php` (Laravel 11/12):
   ```php
   ->withMiddleware(function (Middleware $middleware) {
       $middleware->alias([
           'auth.token' => \App\Http\Middleware\TokenAuthenticate::class,
           'role' => \App\Http\Middleware\EnsureUserHasRole::class,
       ]);
   })
   ```
   Kalau project kamu Laravel 10 ke bawah (masih ada `app/Http/Kernel.php`), daftarkan di `$middlewareAliases` pada `Kernel.php` dengan key yang sama.

   Kalau file `routes/api.php` belum otomatis ke-load, pastikan terdaftar di `bootstrap/app.php`:
   ```php
   ->withRouting(
       web: __DIR__.'/../routes/web.php',
       api: __DIR__.'/../routes/api.php',
       commands: __DIR__.'/../routes/console.php',
       health: '/up',
   )
   ```

4. Setup `.env` (samakan dengan DB kamu, contoh MySQL):
   ```
   DB_CONNECTION=mysql
   DB_DATABASE=reimburse
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. Migrate & seed:
   ```bash
   php artisan migrate
   php artisan db:seed
   php artisan storage:link
   ```
   Seeder membuat 3 akun contoh (password semua: `password`):
   - `karyawan@company.com` (role: karyawan)
   - `pm@company.com` (role: pm_pic)
   - `finance@company.com` (role: finance)

6. Jalankan:
   ```bash
   php artisan serve
   ```

## 2. Alur status (FR-08 & Section 6 PRD)

```
Draft -> Diajukan -> Menunggu Approval -> (PM/PIC) -> Disetujui -> (Finance) Verifikasi Finance
      -> Diproses -> Dibayarkan -> Selesai
Ditolak bisa terjadi di tahap Menunggu Approval (PM/PIC) atau Disetujui/Verifikasi Finance (Finance)
```

## 3. Ringkasan endpoint

| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | /api/login | public | login, dapat token |
| POST | /api/logout | semua | hapus token aktif |
| GET | /api/me | semua | profil user login |
| GET | /api/dashboard | semua | ringkasan sesuai role |
| GET | /api/projects | semua | daftar project (utk pilih PID) |
| POST | /api/projects | karyawan | tambah project baru (opsional) |
| GET | /api/reimbursements | semua | list (karyawan: milik sendiri) |
| POST | /api/reimbursements | karyawan | buat draft + rincian biaya |
| GET | /api/reimbursements/{id} | semua* | detail + timeline |
| PUT | /api/reimbursements/{id} | karyawan (pemilik) | edit selama draft |
| DELETE | /api/reimbursements/{id} | karyawan (pemilik) | hapus draft |
| POST | /api/reimbursements/{id}/items | karyawan | tambah item biaya (draft) |
| DELETE | /api/reimbursements/{id}/items/{itemId} | karyawan | hapus item (draft) |
| POST | /api/reimbursements/{id}/documents | karyawan | upload bukti (draft) |
| DELETE | /api/reimbursements/{id}/documents/{docId} | karyawan | hapus bukti (draft) |
| GET | /api/reimbursements/{id}/documents/{docId}/download | pemilik/pm_pic/finance | unduh bukti |
| POST | /api/reimbursements/{id}/submit | karyawan (pemilik) | Draft -> Menunggu Approval |
| POST | /api/reimbursements/{id}/approve | pm_pic | -> Disetujui |
| POST | /api/reimbursements/{id}/reject | pm_pic | -> Ditolak (wajib `reason`) |
| POST | /api/reimbursements/{id}/verify | finance | Disetujui -> Verifikasi Finance |
| POST | /api/reimbursements/{id}/finance-reject | finance | -> Ditolak (wajib `reason`) |
| POST | /api/reimbursements/{id}/process | finance | -> Diproses |
| POST | /api/reimbursements/{id}/pay | finance | -> Dibayarkan |
| POST | /api/reimbursements/{id}/complete | finance | -> Selesai |

*akses detail dibatasi: karyawan hanya pengajuan miliknya (FR-10).

## 4. Business rules yang sudah diimplementasikan

- **BR-01** (`DisbursementScheduleService`): hitung tanggal pencairan berikutnya (15/30, mundur ke hari kerja terdekat kalau akhir pekan).
- **BR-02**: dicek saat submit — kalau lewat H-3 hari kerja, submit **tetap jalan** tapi dikirim `warnings` (info pengajuan masuk siklus pencairan berikutnya). Ubah ke hard-block di `ReimbursementValidationService::validateForSubmission()` kalau kamu ingin ini memblokir submit.
- **BR-03**: submit ditolak jika belum ada dokumen bukti transaksi.
- **BR-04**: submit ditolak jika reimbursement project tidak punya PID/nama project valid.
- **BR-05**: enforced lewat alur status (harus lolos `approve` sebelum masuk endpoint Finance).
- **BR-06** (nominal besar/overbudget perlu approval manajemen): PRD belum memberi angka ambang batas/role manajemen secara eksplisit, jadi belum diimplementasi otomatis — silakan beri tahu nilai threshold-nya kalau mau saya tambahkan step approval tambahan.
- **BR-07** (hardcopy bukti asli / form tanpa nota): didukung lewat `document_type = form_tanpa_nota`, proses fisik hardcopy tetap manual di luar sistem.
- **BR-08**: submit ditolak jika `date` transaksi sudah lebih dari 2 bulan dari hari ini.

## 5. Asumsi yang saya buat (karena PRD tidak merinci)

- Daftar kategori item (`app/Enums/ItemCategory.php`) dan tipe dokumen (`DocumentType.php`) — silakan sesuaikan.
- Approval PM/PIC tidak dibatasi per-project (siapapun user role `pm_pic` bisa approve). Kalau butuh mapping PM/PIC ke project tertentu, perlu tabel pivot tambahan (`project_managers`).
- Format bukti transaksi: jpg/jpeg/png/pdf, maksimal 5MB — sesuaikan di `StoreReimbursementDocumentRequest`.
- Token expired 7 hari, disimpan hash SHA-256 di tabel `personal_tokens` (mekanisme sederhana pengganti Sanctum).
