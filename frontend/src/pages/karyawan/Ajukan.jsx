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
  FaPlus,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertBanner from "../../components/AlertBanner";
import api, {
  CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  formatCurrency,
  getStoredUser,
} from "../../services/api";

const MIN_DOCUMENTS = 1;

function emptyItem() {
  return {
    project: "",
    category: "",
    categoryOther: "",
    description: "",
    amount: "",
    files: [], // [{ file, document_type }] — foto/bukti khusus item ini
  };
}

export default function Ajukan() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [submitting, setSubmitting] = useState(null); // "draft" | "submit" | null

  const [form, setForm] = useState({
    nama: user?.name || "",
    divisi: user?.department || "",
    date: "",
    purpose: "",
  });

  const [items, setItems] = useState([emptyItem()]);

  const grandTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalFiles = items.reduce((sum, item) => sum + item.files.length, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleItemFilesChange = (itemIndex, e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIndex
          ? { ...it, files: [...it.files, ...picked.map((file) => ({ file, document_type: "nota" }))] }
          : it,
      ),
    );
  };

  const updateItemFileDocType = (itemIndex, fileIndex, value) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIndex
          ? { ...it, files: it.files.map((f, fi) => (fi === fileIndex ? { ...f, document_type: value } : f)) }
          : it,
      ),
    );
  };

  const removeItemFile = (itemIndex, fileIndex) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIndex ? { ...it, files: it.files.filter((_, fi) => fi !== fileIndex) } : it,
      ),
    );
  };

  const buildPayload = () => ({
    date: form.date,
    purpose: form.purpose,
    items: items.map((item) => {
      const isOther = item.category === "lainnya" && item.categoryOther.trim();
      const itemDescription = isOther
        ? `[Lainnya: ${item.categoryOther.trim()}] ${item.description}`
        : item.description;

      return {
        project: item.project.trim() || null,
        category: item.category,
        description: itemDescription,
        amount: Number(item.amount),
      };
    }),
  });

  const createReimbursement = async () => {
    const res = await api.post("/reimbursements", buildPayload());
    const reimbursement = res.data.data;
    const savedItems = reimbursement.items || [];

    for (let i = 0; i < items.length; i += 1) {
      const savedItemId = savedItems[i]?.id;
      for (const f of items[i].files) {
        const fd = new FormData();
        fd.append("file", f.file);
        fd.append("document_type", f.document_type);
        if (savedItemId) fd.append("reimbursement_item_id", savedItemId);
        await api.post(`/reimbursements/${reimbursement.id}/documents`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
    }

    return reimbursement;
  };

  const validateBase = () => {
    if (!form.nama || !form.divisi) {
      Swal.fire("Data belum lengkap", "Mohon lengkapi nama dan divisi.", "warning");
      return false;
    }
    if (!form.date || !form.purpose) {
      Swal.fire("Data belum lengkap", "Mohon lengkapi tanggal dan tujuan/keperluan pengajuan.", "warning");
      return false;
    }
    if (items.length === 0) {
      Swal.fire("Data belum lengkap", "Mohon tambahkan minimal 1 item biaya.", "warning");
      return false;
    }
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (!it.category || !it.description || !it.amount) {
        Swal.fire(
          "Data belum lengkap",
          `Mohon lengkapi kategori, nama item, dan total pada item ke-${i + 1}.`,
          "warning",
        );
        return false;
      }
      if (it.category === "lainnya" && !it.categoryOther.trim()) {
        Swal.fire("Data belum lengkap", `Mohon sebutkan kategori lainnya pada item ke-${i + 1}.`, "warning");
        return false;
      }
      if (Number(it.amount) <= 0) {
        Swal.fire("Data belum lengkap", `Total pada item ke-${i + 1} harus lebih dari 0.`, "warning");
        return false;
      }
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
    if (totalFiles < MIN_DOCUMENTS) {
      Swal.fire(
        "Bukti transaksi kurang",
        `Mohon unggah minimal ${MIN_DOCUMENTS} bukti transaksi (foto/struk) pada salah satu item sebelum mengirim pengajuan.`,
        "warning",
      );
      return;
    }

    setSubmitting("submit");
    try {
      const reimbursement = await createReimbursement();
      const res = await api.post(`/reimbursements/${reimbursement.id}/submit`);
      const warnings = res.data.warnings;

      if (warnings && Object.keys(warnings).length > 0) {
        const warningText = Object.values(warnings).flat().join(" ");
        await Swal.fire("Pengajuan terkirim", `Perhatian: ${warningText}`, "warning");
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
        <h2 className="text-2xl font-bold text-slate-900">
          Formulir Pengajuan Reimbursement
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Lengkapi data berikut untuk memproses permintaan reimbursement Anda.
        </p>
      </div>

      <AlertBanner>
        <span className="font-semibold">Perhatian!</span> Batas pengajuan H-3
        sebelum tanggal cair (15 & 30). Minimal {MIN_DOCUMENTS} bukti transaksi
        wajib diunggah. Anda dapat menambahkan beberapa project dan item
        sekaligus dalam satu pengajuan.
      </AlertBanner>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
        {/* Data Diri */}
        <section>
          <h3 className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
            <FaUser className="text-gray-400" /> Data Diri & Keperluan
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
          </div>

          <div className="mt-5">
            <Field label="Tujuan / Keperluan Pengajuan" required>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                rows={2}
                className="input resize-none"
                placeholder="Tujuan/Pengeluaran"
                required
              />
            </Field>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Rincian Biaya - multi project & item */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="flex items-center gap-2 text-slate-900 font-semibold">
              <FaWallet className="text-gray-400" /> Rincian Biaya
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-orange-300 text-orange-600 text-xs font-medium hover:bg-orange-50"
            >
              <FaPlus size={11} /> Tambah Item
            </button>
          </div>

          <div className="space-y-5">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-5 relative bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-700">Item {idx + 1}</p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600"
                      title="Hapus item ini"
                    >
                      <FaTrash size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nama Project">
                    <input
                      type="text"
                      value={item.project}
                      onChange={(e) => updateItem(idx, "project", e.target.value)}
                      className="input"
                      placeholder="Nama project"
                    />
                  </Field>
                  <Field label="Nama Item / Deskripsi Pengeluaran" required>
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      className="input"
                      placeholder="Nama item"
                      required
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-6">
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`category-${idx}`}
                          value={value}
                          checked={item.category === value}
                          onChange={(e) => updateItem(idx, "category", e.target.value)}
                          className="accent-orange-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {item.category === "lainnya" && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={item.categoryOther}
                        onChange={(e) => updateItem(idx, "categoryOther", e.target.value)}
                        className="input"
                        placeholder="Sebutkan kategori lainnya"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  <Field label="Total Item (Rp)" required>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(idx, "amount", e.target.value)}
                      min="0"
                      className="input"
                      placeholder="Rp 0"
                      required
                    />
                  </Field>
                </div>

                {/* Lampiran Bukti khusus item ini */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaPaperclip className="text-gray-400" size={12} /> Foto/Bukti Item Ini{" "}
                    <span className="text-gray-400 font-normal">({item.files.length} file)</span>
                  </label>

                  <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-lg py-6 cursor-pointer hover:bg-gray-50 transition bg-white">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400">
                      <FaCloudUploadAlt size={16} />
                    </div>
                    <p className="text-xs text-gray-600">Klik untuk unggah foto/struk item ini</p>
                    <p className="text-[11px] text-gray-400">PDF, JPG, PNG (Maks. 5MB per file)</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      className="hidden"
                      onChange={(e) => handleItemFilesChange(idx, e)}
                    />
                  </label>

                  {item.files.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {item.files.map((f, fileIdx) => (
                        <div
                          key={`${f.file.name}-${fileIdx}`}
                          className="flex items-center gap-3 bg-indigo-50 rounded-md px-3 py-2 text-sm text-slate-700"
                        >
                          <FaFileAlt className="text-indigo-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate">
                              {f.file.name} ({(f.file.size / 1024 / 1024).toFixed(1)} MB)
                            </p>
                          </div>
                          <select
                            value={f.document_type}
                            onChange={(e) => updateItemFileDocType(idx, fileIdx, e.target.value)}
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
                            onClick={() => removeItemFile(idx, fileIdx)}
                            className="text-red-400 hover:text-red-600 shrink-0"
                            title="Hapus"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5 bg-orange-50 border border-orange-100 rounded-lg px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Total Keseluruhan</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Total bukti transaksi terlampir: {totalFiles} file (minimal {MIN_DOCUMENTS})
              </p>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(grandTotal)}</p>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Tombol Kiri */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto h-11 px-6 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 order-3 sm:order-1"
          >
            Batal
          </button>

          {/* Group Tombol Kanan */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
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
          </div>

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
