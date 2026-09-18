import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
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
  FaArrowLeft,
  FaSave,
  FaDownload,
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

function itemFromServer(item) {
  return {
    id: item.id,
    project: item.project || "",
    category: item.category || "",
    categoryOther: "",
    description: item.description || "",
    amount: item.amount != null ? String(item.amount) : "",
  };
}

function emptyItem() {
  return {
    id: null,
    project: "",
    category: "",
    categoryOther: "",
    description: "",
    amount: "",
  };
}

export default function EditDraft() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(null); // "save" | "submit" | "delete" | null
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ nama: "", divisi: "", date: "", purpose: "" });
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);

  const grandTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const load = () => {
    setLoading(true);
    api
      .get(`/reimbursements/${id}`)
      .then((res) => {
        const data = res.data.data;
        if (data.user_id !== user?.id || data.status !== "draft") {
          setNotFound(true);
          return;
        }
        setForm({
          nama: data.user?.name || user?.name || "",
          divisi: data.user?.department || user?.department || "",
          date: data.date ? String(data.date).slice(0, 10) : "",
          purpose: data.purpose || "",
        });
        const loadedItems = (data.items || []).map(itemFromServer);
        // project is only stored as an aggregate on the reimbursement itself
        // (not per item), so prefill it back into the item field when we can
        // unambiguously attribute it (single-item draft).
        if (loadedItems.length === 1 && data.project) {
          loadedItems[0].project = data.project;
        }
        setItems(loadedItems);
        setDocuments(data.documents || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (user?.role !== "karyawan") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = async (index) => {
    if (items.length <= 1) return;
    const item = items[index];

    if (!item.id) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const confirm = await Swal.fire({
      title: "Hapus item ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/reimbursements/${id}/items/${item.id}`);
      setItems((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus item.", "error");
    }
  };

  const handleFilesChange = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    setUploading(true);
    try {
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("document_type", "nota");
        await api.post(`/reimbursements/${id}/documents`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      load();
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal mengunggah bukti transaksi.", "error");
    } finally {
      setUploading(false);
    }
  };

  const updateDocType = async (doc, value) => {
    // document_type can only be changed by re-uploading; kept read-only after upload.
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, document_type: value } : d)));
  };

  const removeDocument = async (doc) => {
    const confirm = await Swal.fire({
      title: "Hapus bukti transaksi ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/reimbursements/${id}/documents/${doc.id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus dokumen.", "error");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/reimbursements/${id}/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.original_name || "dokumen";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire("Gagal", "Tidak dapat mengunduh dokumen.", "error");
    }
  };

  const validate = () => {
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
      if (it.category === "lainnya" && !it.categoryOther.trim() && !it.description.startsWith("[Lainnya:")) {
        // categoryOther only required when switching category fresh; skip strict block if description already set
      }
      if (Number(it.amount) <= 0) {
        Swal.fire("Data belum lengkap", `Total pada item ke-${i + 1} harus lebih dari 0.`, "warning");
        return false;
      }
    }
    return true;
  };

  const persistChanges = async () => {
    // project is stored as a single aggregate field on the reimbursement,
    // built from the unique project names entered across items (same
    // logic as the initial "Ajukan" submission).
    const projectNames = items
      .map((item) => item.project.trim())
      .filter(Boolean)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .join(", ");

    // Save header fields
    await api.put(`/reimbursements/${id}`, {
      project: projectNames || null,
      date: form.date,
      purpose: form.purpose,
    });

    // Save item changes: create new ones, update existing ones
    for (const item of items) {
      const isOther = item.category === "lainnya" && item.categoryOther.trim();
      const description = isOther
        ? `[Lainnya: ${item.categoryOther.trim()}] ${item.description}`
        : item.description;

      const payload = {
        category: item.category,
        description,
        amount: Number(item.amount),
      };

      if (item.id) {
        await api.put(`/reimbursements/${id}/items/${item.id}`, payload);
      } else {
        await api.post(`/reimbursements/${id}/items`, payload);
      }
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving("save");
    try {
      await persistChanges();
      await Swal.fire("Tersimpan", "Perubahan draft berhasil disimpan.", "success");
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Gagal menyimpan perubahan.";
      Swal.fire("Gagal", message, "error");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      title: "Hapus draft ini?",
      text: "Data pengajuan yang dihapus tidak dapat dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    setSaving("delete");
    try {
      await api.delete(`/reimbursements/${id}`);
      await Swal.fire("Berhasil", "Draft berhasil dihapus.", "success");
      navigate("/draft");
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus draft.", "error");
      setSaving(null);
    }
  };

  const handleSubmitDraft = async () => {
    if (!validate()) return;
    if (documents.length < MIN_DOCUMENTS) {
      Swal.fire(
        "Bukti transaksi kurang",
        `Mohon unggah minimal ${MIN_DOCUMENTS} bukti transaksi sebelum mengirim pengajuan.`,
        "warning",
      );
      return;
    }

    setSaving("submit");
    try {
      await persistChanges();
      const res = await api.post(`/reimbursements/${id}/submit`);
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
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Memuat data...</p>
      </DashboardLayout>
    );
  }

  if (notFound) {
    return (
      <DashboardLayout>
        <p className="text-red-500 mb-4">
          Draft tidak ditemukan, atau pengajuan ini sudah tidak berstatus draft.
        </p>
        <Link to="/draft" className="text-orange-500 font-medium hover:underline">
          Kembali ke Draft
        </Link>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Link
        to="/draft"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
        <FaArrowLeft size={13} /> Kembali ke Draft
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Edit Draft Pengajuan</h2>
        <p className="text-gray-500 text-sm mt-1">
          Ubah data pengajuan Anda, lalu simpan perubahan atau kirim langsung untuk diproses.
        </p>
      </div>

      <AlertBanner>
        <span className="font-semibold">Perhatian!</span> Batas pengajuan H-3
        sebelum tanggal cair (15 & 30). Minimal {MIN_DOCUMENTS} bukti transaksi
        wajib diunggah sebelum mengirim pengajuan.
      </AlertBanner>

      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
        {/* Data Diri */}
        <section>
          <h3 className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
            <FaUser className="text-gray-400" /> Data Diri & Keperluan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nama Karyawan" required>
              <input
                value={form.nama}
                readOnly
                disabled
                className="input bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </Field>
            <Field label="Divisi" required>
              <input
                value={form.divisi}
                readOnly
                disabled
                className="input bg-gray-100 text-gray-500 cursor-not-allowed"
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

        {/* Rincian Biaya */}
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
              <div key={item.id ?? `new-${idx}`} className="border border-gray-200 rounded-lg p-5 relative bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Item {idx + 1} {!item.id && <span className="text-xs text-orange-500 font-normal">(baru)</span>}
                  </p>
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
                        placeholder="Sebutkan kategori lainnya (opsional jika sudah tercantum di deskripsi)"
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
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5 bg-orange-50 border border-orange-100 rounded-lg px-5 py-4">
            <p className="text-sm font-semibold text-slate-700">Total Keseluruhan</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(grandTotal)}</p>
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
              (minimal {MIN_DOCUMENTS} file — saat ini {documents.length})
            </span>
          </label>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-10 cursor-pointer hover:bg-gray-50 transition">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400">
              <FaCloudUploadAlt size={20} />
            </div>
            <p className="text-sm text-gray-600">
              {uploading ? "Mengunggah..." : "Klik untuk mengunggah atau seret file ke sini"}
            </p>
            <p className="text-xs text-gray-400">
              Format didukung: PDF, JPG, PNG (Maks. 5MB per file)
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleFilesChange}
            />
          </label>

          {documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 bg-indigo-50 rounded-md px-4 py-3 text-sm text-slate-700"
                >
                  <FaFileAlt className="text-indigo-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{doc.original_name}</p>
                  </div>
                  <select
                    value={doc.document_type}
                    onChange={(e) => updateDocType(doc, e.target.value)}
                    disabled
                    title="Untuk mengganti jenis dokumen, hapus lalu unggah ulang"
                    className="h-9 px-2 rounded-md border border-gray-200 text-xs bg-white shrink-0 disabled:opacity-70"
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    title="Unduh"
                  >
                    <FaDownload size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc)}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving !== null}
            className="w-full sm:w-auto h-11 px-6 rounded-full border border-red-300 text-red-600 font-medium hover:bg-red-50 disabled:opacity-60 order-3 sm:order-1"
          >
            {saving === "delete" ? "Menghapus..." : "Hapus Draft"}
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving !== null}
              className="w-full sm:w-auto h-11 px-6 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-2 order-2 sm:order-1"
            >
              <FaSave size={13} /> {saving === "save" ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              type="button"
              onClick={handleSubmitDraft}
              disabled={saving !== null}
              className="w-full sm:w-auto h-11 px-6 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {saving === "submit" ? "Mengirim..." : "Kirim Pengajuan"} <FaPaperPlane size={13} />
            </button>
          </div>
        </div>
      </div>
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
