import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaPaperclip,
  FaFileAlt,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaCloudUploadAlt,
  FaImage,
  FaReceipt,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import ApprovalTimeline from "../../components/ApprovalTimeline";
import DocumentPreviewModal from "../../components/DocumentPreviewModal";
import api, {
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatCurrency,
  formatDate,
} from "../../services/api";

const CATEGORY_ICON = "📄";

const STAGE_CONFIG = {
  disetujui: { badge: "Menunggu Finance", action: "verify", actionLabel: "Setujui & Proses" },
  verifikasi_finance: { badge: "Verifikasi Finance", action: "process", actionLabel: "Proses Pembayaran" },
  diproses: { badge: "Diproses", action: "pay", actionLabel: "Tandai Dibayarkan" },
  dibayarkan: { badge: "Dibayarkan", action: "complete", actionLabel: "Selesaikan" },
};

const CAN_REJECT = ["disetujui", "verifikasi_finance"];

export default function VerifikasiPengajuan() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewIsPaymentProof, setPreviewIsPaymentProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get(`/reimbursements/${id}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError("Gagal memuat data pengajuan."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const stage = data ? STAGE_CONFIG[data.status] : null;

  const handleAction = async () => {
    if (!stage) return;
    setActionLoading(true);
    try {
      if (stage.action === "pay") {
        const fd = new FormData();
        if (note) fd.append("note", note);
        if (proofFile) fd.append("proof", proofFile);
        await api.post(`/reimbursements/${id}/pay`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/reimbursements/${id}/${stage.action}`, { note: note || undefined });
      }
      await Swal.fire("Berhasil", "Aksi berhasil diproses.", "success");
      setNote("");
      setProofFile(null);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Terjadi kesalahan.";
      Swal.fire("Gagal", message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: "Alasan Penolakan",
      input: "textarea",
      inputValue: note,
      inputPlaceholder: "Tuliskan alasan penolakan (min. 5 karakter)...",
      showCancelButton: true,
      confirmButtonText: "Tolak Pengajuan",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
    });
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.post(`/reimbursements/${id}/finance-reject`, { reason });
      await Swal.fire("Berhasil", "Pengajuan ditolak.", "success");
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Terjadi kesalahan.";
      Swal.fire("Gagal", message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Memuat data...</p>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <p className="text-red-500">{error || "Data tidak ditemukan."}</p>
      </DashboardLayout>
    );
  }

  const firstItem = (data.items || [])[0];

  return (
    <DashboardLayout>
      <Link to="/riwayat" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <FaArrowLeft size={13} /> Kembali ke Riwayat
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Verifikasi #REIM-{String(data.id).padStart(4, "0")}</h2>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold w-fit">
          <FaHourglassHalf size={11} /> {stage?.badge || STATUS_LABELS[data.status]}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Diajukan oleh {data.user?.name} ({data.user?.department || "-"}) pada {formatDate(data.date)}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 mb-2">Kategori</p>
              <p className="flex items-center gap-2 text-slate-900 font-semibold">
                <span>{CATEGORY_ICON}</span>
                {CATEGORY_LABELS[firstItem?.category] || "-"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 mb-2">Total Nominal</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.total_amount)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 mb-2">Deskripsi Pengajuan</p>
            <p className="text-sm text-slate-700">{data.purpose}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaReceipt className="text-gray-400" /> Rincian Biaya ({(data.items || []).length} item)
            </h3>
            <div className="space-y-3">
              {(data.items || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {item.project ? `${item.project} · ` : ""}
                      {CATEGORY_LABELS[item.category] || item.category}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
              {(data.items || []).length === 0 && (
                <p className="text-sm text-gray-400">Belum ada rincian biaya.</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-slate-900">Total Keseluruhan</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(data.total_amount)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaPaperclip className="text-gray-400" /> Bukti Lampiran ({(data.documents || []).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(data.documents || []).map((doc) => (
                <div
                  key={doc.id}
                  className="border-2 border-dashed border-gray-200 rounded-lg py-8 px-4 flex flex-col items-center gap-2 bg-indigo-50/30"
                >
                  <FaFileAlt className="text-gray-400" size={28} />
                  <p className="text-sm font-semibold text-slate-900 text-center break-all">{doc.original_name}</p>
                  <button
                    onClick={() => {
                      setPreviewIsPaymentProof(false);
                      setPreviewDoc(doc);
                    }}
                    className="mt-1 inline-flex items-center gap-2 h-9 px-4 rounded-full border border-gray-300 text-xs font-medium text-slate-700 hover:bg-white"
                  >
                    <FaEye size={12} /> Lihat / Unduh Bukti
                  </button>
                </div>
              ))}
              {(data.documents || []).length === 0 && (
                <p className="text-sm text-gray-400 col-span-2">Belum ada bukti transaksi.</p>
              )}
            </div>
          </div>

          {data.payment_proof_original_name && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                <FaImage className="text-gray-400" /> Bukti Pembayaran
              </h3>
              <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 px-4 flex flex-col items-center gap-2 bg-teal-50/30 max-w-sm">
                <FaFileAlt className="text-gray-400" size={28} />
                <p className="text-sm font-semibold text-slate-900 text-center break-all">
                  {data.payment_proof_original_name}
                </p>
                <button
                  onClick={() => {
                    setPreviewIsPaymentProof(true);
                    setPreviewDoc({
                      id: "payment-proof",
                      original_name: data.payment_proof_original_name,
                      document_type: "bukti_pembayaran",
                    });
                  }}
                  className="mt-1 inline-flex items-center gap-2 h-9 px-4 rounded-full border border-gray-300 text-xs font-medium text-slate-700 hover:bg-white"
                >
                  <FaEye size={12} /> Lihat / Unduh Bukti
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ApprovalTimeline data={data} />

          {stage && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              {stage.action === "pay" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto/Bukti Transfer Pembayaran (Opsional)
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-6 cursor-pointer hover:bg-gray-50 transition">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400">
                      <FaCloudUploadAlt size={18} />
                    </div>
                    <p className="text-xs text-gray-600">Klik untuk mengunggah foto bukti transfer</p>
                    <p className="text-xs text-gray-400">Format: PDF, JPG, PNG (Maks. 5MB)</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {proofFile && (
                    <div className="mt-2 flex items-center gap-2 bg-indigo-50 rounded-md px-3 py-2 text-xs text-slate-700">
                      <FaFileAlt className="text-indigo-400 shrink-0" />
                      <span className="truncate">
                        {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                  )}
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Finance (Opsional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition mb-4 resize-none"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium"
                >
                  <FaCheckCircle size={14} /> {stage.actionLabel}
                </button>
                {CAN_REJECT.includes(data.status) && (
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium"
                  >
                    <FaTimesCircle size={14} /> Tolak
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        reimbursementId={data.id}
        doc={previewDoc}
        isPaymentProof={previewIsPaymentProof}
        onClose={() => setPreviewDoc(null)}
      />
    </DashboardLayout>
  );
}
