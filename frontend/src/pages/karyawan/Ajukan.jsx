import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaUser,
  FaWallet,
  FaPaperclip,
  FaCloudUploadAlt,
  FaFileAlt,
  FaPaperPlane,
  FaTrash,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertBanner from "../../components/AlertBanner";
import api, { CATEGORY_LABELS, DOCUMENT_TYPE_LABELS, getStoredUser } from "../../services/api";

const MIN_DOCUMENTS = 1;

export default function Ajukan() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [files, setFiles] = useState([]); // [{ file, document_type }]
  const [submitting, setSubmitting] = useState(null); // "draft" | "submit" | null

  const [form, setForm] = useState({
    nama: user?.name || "",
    divisi: user?.department || "",
    project: "",
    date: "",
    category: "",
    categoryOther: "",
    description: "",
    amount: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilesChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked.map((file) => ({ file, document_type: "nota" }))]);
    e.target.value = "";
  };

  const updateFileDocType = (index, value) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, document_type: value } : f)));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPayload = () => {
    const isOther = form.category === "lainnya" && form.categoryOther.trim();
    const itemDescription = isOther
      ? `[Lainnya: ${form.categoryOther.trim()}] ${form.description}`
      : form.description;

    return {
      project: form.project.trim() || null,
      date: form.date,
      purpose: form.description,
      items: [
        {
          category: form.category,
          description: itemDescription,
          amount: Number(form.amount),
        },
      ],
    };
  };

  const createReimbursement = async () => {
    const res = await api.post("/reimbursements", buildPayload());
    const reimbursement = res.data.data;

    for (const item of files) {
      const fd = new FormData();
      fd.append("file", item.file);
      fd.append("document_type", item.document_type);
      await api.post(`/reimbursements/${reimbursement.id}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    return reimbursement;
  };

  const validateBase = () => {
    if (!form.nama || !form.divisi) {
      Swal.fire("Data belum lengkap", "Mohon lengkapi nama dan divisi.", "warning");
      return false;
    }
    if (!form.date || !form.category || !form.description || !form.amount) {
      Swal.fire("Data belum lengkap", "Mohon lengkapi tanggal, kategori, deskripsi, dan nominal.", "warning");
      return false;
    }
    if (form.category === "lainnya" && !form.categoryOther.trim()) {
      Swal.fire("Data belum lengkap", "Mohon sebutkan kategori lainnya.", "warning");
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateBase()) return;
    setSubmitting("draft");
    try {
      await createReimbursement();
      await Swal.fire("Draft tersimpan", "Pengajuan berhasil disimpan sebagai draft.", "success");
      navigate("/riwayat");
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menyimpan draft.", "error");
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateBase()) return;
    if (files.length < MIN_DOCUMENTS) {
      Swal.fire(
        "Bukti transaksi kurang",
        `Mohon unggah minimal ${MIN_DOCUMENTS} bukti transaksi sebelum mengirim pengajuan.`,
        "warning"
      );
      return;
    }

    setSubmitting("submit");
    try {
      const reimbursement = await createReimbursement();
      const res = await api.post(`/reimbursements/${reimbursement.id}/submit`);
      const warnings = res.data.warnings;

      if (warnings && warnings.length > 0) {
        await Swal.fire("Pengajuan terkirim", `Perhatian: ${warnings.join(" ")}`, "warning");
      } else {
        await Swal.fire("Berhasil", "Pengajuan berhasil dikirim dan menunggu approval.", "success");
      }
      navigate("/riwayat");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Gagal mengirim pengajuan.";
      Swal.fire("Gagal", message, "error");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Formulir Pengajuan Reimbursement</h2>
        <p className="text-gray-500 text-sm mt-1">
          Lengkapi data berikut untuk memproses permintaan reimbursement Anda.
        </p>
      </div>

      <AlertBanner>
        <span className="font-semibold">Perhatian!</span> Batas pengajuan H-3 sebelum tanggal
        cair (15 & 30). Minimal {MIN_DOCUMENTS} bukti transaksi wajib diunggah.
      </AlertBanner>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
        {/* Data Diri & Proyek */}
        <section>
          <h3 className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
            <FaUser className="text-gray-400" /> Data Diri & Proyek
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nama Karyawan" required>
              <input
                name="nama"
                value={form.nama}
                readOnly
                disabled
                className="input bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="Nama lengkap"
                required
              />
            </Field>
            <Field label="Divisi" required>
              <input
                name="divisi"
                value={form.divisi}
                readOnly
                disabled
                className="input bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="Divisi / Departemen"
                required
              />
            </Field>
            <Field label="Tanggal Transaksi" required>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="input"
                required
              />
            </Field>
            <Field label="Nama Project">
              <input
                type="text"
                name="project"
                value={form.project}
                onChange={handleChange}
                className="input"
                placeholder="Nama project (opsional)"
              />
            </Field>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-6">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={form.category === value}
                    onChange={handleChange}
                    className="accent-orange-500"
                  />
                  {label}
                </label>
              ))}
            </div>
            {form.category === "lainnya" && (
              <div className="mt-3">
                <input
                  type="text"
                  name="categoryOther"
                  value={form.categoryOther}
                  onChange={handleChange}
                  className="input"
                  placeholder="Sebutkan kategori lainnya"
                  required
                />
              </div>
            )}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Rincian Biaya */}
        <section>
          <h3 className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
            <FaWallet className="text-gray-400" /> Rincian Biaya
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Deskripsi Pengeluaran" required className="md:col-span-2">
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input"
                placeholder="Jelaskan secara rinci pengeluaran ini..."
                required
              />
            </Field>
            <Field label="Total Nominal (Rp)" required>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0"
                className="input"
                placeholder="Rp 0"
                required
              />
            </Field>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Lampiran Bukti */}
        <section>
          <h3 className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
            <FaPaperclip className="text-gray-400" /> Lampiran Bukti
          </h3>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unggah Struk/Kwitansi <span className="text-red-500">*</span>{" "}
            <span className="text-gray-400 font-normal">
              (minimal {MIN_DOCUMENTS} file — saat ini {files.length})
            </span>
          </label>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-10 cursor-pointer hover:bg-gray-50 transition">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400">
              <FaCloudUploadAlt size={20} />
            </div>
            <p className="text-sm text-gray-600">Klik untuk mengunggah atau seret file ke sini</p>
            <p className="text-xs text-gray-400">Format didukung: PDF, JPG, PNG (Maks. 5MB per file)</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
          </label>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((item, idx) => (
                <div
                  key={`${item.file.name}-${idx}`}
                  className="flex items-center gap-3 bg-indigo-50 rounded-md px-4 py-3 text-sm text-slate-700"
                >
                  <FaFileAlt className="text-indigo-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {item.file.name} ({(item.file.size / 1024 / 1024).toFixed(1)} MB)
                    </p>
                  </div>
                  <select
                    value={item.document_type}
                    onChange={(e) => updateFileDocType(idx, e.target.value)}
                    className="h-9 px-2 rounded-md border border-gray-200 text-xs bg-white shrink-0"
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                    title="Hapus"
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <hr className="border-gray-100" />

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={submitting !== null}
            className="w-full sm:w-auto h-11 px-6 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-60 order-2 sm:order-1"
          >
            {submitting === "draft" ? "Menyimpan..." : "Simpan Draf"}
          </button>
          <button
            type="submit"
            disabled={submitting !== null}
            className="w-full sm:w-auto h-11 px-6 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {submitting === "submit" ? "Mengirim..." : "Kirim Pengajuan"} <FaPaperPlane size={13} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto h-11 px-6 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 order-3"
          >
            Batal
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
