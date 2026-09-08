import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaArrowLeft, FaFileAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import ApprovalTimeline from "../../components/ApprovalTimeline";
import DocumentPreviewModal from "../../components/DocumentPreviewModal";
import api, { CATEGORY_LABELS, formatCurrency, formatDateTime } from "../../services/api";

export default function ReviewPengajuan() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

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

  const handleApprove = async () => {
    const { value: note, isConfirmed } = await Swal.fire({
      title: "Setujui Pengajuan",
      input: "textarea",
      inputPlaceholder: "Catatan persetujuan (opsional)...",
      showCancelButton: true,
      confirmButtonText: "Setujui",
      confirmButtonColor: "#0d9488",
      cancelButtonText: "Batal",
    });
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      await api.post(`/reimbursements/${id}/approve`, { note: note || undefined });
      await Swal.fire("Berhasil", "Pengajuan disetujui.", "success");
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
      inputPlaceholder: "Tuliskan alasan penolakan (min. 5 karakter)...",
      showCancelButton: true,
      confirmButtonText: "Tolak Pengajuan",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
    });
    if (!reason) return;

    setActionLoading(true);
    try {
      await api.post(`/reimbursements/${id}/reject`, { reason });
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

  const canReview = data.status === "menunggu_approval";

  return (
    <DashboardLayout>
      <Link to="/riwayat" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <FaArrowLeft size={13} /> Kembali ke Riwayat
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-1">
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          Project Manager Review
        </span>
        <span className="text-gray-400 text-sm">
          ID: REIMB-{new Date(data.date || data.created_at).getFullYear()}-{String(data.id).padStart(4, "0")}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Informasi Pengajuan</h2>
        <p className="text-sm text-gray-400">Submitted: {formatDateTime(data.submitted_at || data.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Detail Pemohon</h3>
            <hr className="border-gray-100 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-gray-400 mb-1">Nama Pemohon</p>
                <p className="font-semibold text-slate-900">{data.user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Divisi</p>
                <p className="font-semibold text-slate-900">{data.user?.department || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Project</p>
                <p className="font-semibold text-slate-900">{data.project?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="font-semibold text-slate-900">{data.user?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Informasi Pengajuan</h3>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(data.total_amount)}</p>
            </div>
            <hr className="border-gray-100 mb-4" />

            {(data.items || []).map((item, idx) => (
              <div key={item.id} className={idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""}>
                <p className="text-xs text-gray-400 mb-1">Kategori</p>
                <p className="font-medium text-slate-900 mb-3">{CATEGORY_LABELS[item.category] || item.category}</p>
                <p className="text-xs text-gray-400 mb-1">Deskripsi Pengeluaran</p>
                <p className="text-sm text-slate-700">{item.description}</p>
              </div>
            ))}

            <hr className="border-gray-100 my-4" />
            <p className="text-sm font-medium text-slate-700 mb-3">Bukti Lampiran ({(data.documents || []).length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(data.documents || []).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="flex flex-col items-center gap-2 border border-gray-200 rounded-lg py-4 px-2 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <FaFileAlt className="text-gray-400" size={22} />
                  <p className="text-xs font-medium text-slate-700 text-center truncate w-full">
                    {doc.original_name}
                  </p>
                </button>
              ))}
              {(data.documents || []).length === 0 && (
                <p className="text-sm text-gray-400 col-span-3">Belum ada bukti transaksi.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ApprovalTimeline data={data} />

          {canReview && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Tindakan Persetujuan</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-md bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium"
                >
                  <FaCheckCircle size={14} /> Setujui
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium"
                >
                  <FaTimesCircle size={14} /> Tolak
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewModal reimbursementId={data.id} doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </DashboardLayout>
  );
}
