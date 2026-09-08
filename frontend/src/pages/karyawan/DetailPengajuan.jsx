import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaArrowLeft, FaInfoCircle, FaPaperclip, FaFileAlt, FaEye, FaListUl, FaImage } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatusBadge from "../../components/StatusBadge";
import ApprovalTimeline from "../../components/ApprovalTimeline";
import DocumentPreviewModal from "../../components/DocumentPreviewModal";
import api, { CATEGORY_LABELS, DOCUMENT_TYPE_LABELS, formatCurrency, formatDate, getStoredUser } from "../../services/api";

export default function DetailPengajuan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewIsPaymentProof, setPreviewIsPaymentProof] = useState(false);

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

  const runAction = async (fn, successMsg) => {
    setActionLoading(true);
    try {
      await fn();
      await Swal.fire("Berhasil", successMsg, "success");
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

  const isOwner = data.user_id === user?.id;
  const status = data.status;

  return (
    <DashboardLayout>
      <Link to="/riwayat" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <FaArrowLeft size={13} /> Kembali ke Riwayat
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">#REIM-{String(data.id).padStart(4, "0")}</h2>
          <StatusBadge status={status} />
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-gray-400">Tanggal Transaksi</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(data.date)}</p>
        </div>
      </div>

      {status === "ditolak" && data.rejection_reason && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-5 py-4 mb-6">
          <span className="font-semibold">Alasan Penolakan: </span>
          {data.rejection_reason}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaInfoCircle className="text-gray-400" /> Informasi Pengajuan
            </h3>
            <hr className="border-gray-100 mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Project</p>
                <p className="font-semibold text-slate-900">{data.project || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Nama Pemohon</p>
                <p className="font-semibold text-slate-900">
                  {data.user?.name} {data.user?.department ? `(${data.user.department})` : ""}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Tujuan / Keperluan</p>
              <p className="bg-gray-50 rounded-md px-4 py-3 text-sm text-slate-700">{data.purpose}</p>
            </div>

            <div className="bg-indigo-50 rounded-md px-4 py-3 inline-block">
              <p className="text-xs text-gray-400 mb-1">Total Diajukan</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(data.total_amount)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaListUl className="text-gray-400" /> Rincian Biaya ({(data.items || []).length} item)
            </h3>
            <hr className="border-gray-100 mb-4" />
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
              <p className="text-base font-bold text-slate-900">{formatCurrency(data.total_amount)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaPaperclip className="text-gray-400" /> Bukti Lampiran ({(data.documents || []).length})
            </h3>
            <hr className="border-gray-100 mb-4" />

            <div className="space-y-3">
              {(data.documents || []).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FaFileAlt className="text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.original_name}</p>
                      <p className="text-xs text-gray-400">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewIsPaymentProof(false);
                      setPreviewDoc(doc);
                    }}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    title="Lihat dokumen"
                  >
                    <FaEye />
                  </button>
                </div>
              ))}
              {(data.documents || []).length === 0 && (
                <p className="text-sm text-gray-400">Belum ada bukti transaksi yang diunggah.</p>
              )}
            </div>
          </div>

          {data.payment_proof_original_name && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                <FaImage className="text-gray-400" /> Bukti Pembayaran dari Finance
              </h3>
              <hr className="border-gray-100 mb-4" />
              <div className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FaFileAlt className="text-teal-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{data.payment_proof_original_name}</p>
                    <p className="text-xs text-gray-400">Bukti transfer pembayaran reimbursement Anda</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPreviewIsPaymentProof(true);
                    setPreviewDoc({
                      id: "payment-proof",
                      original_name: data.payment_proof_original_name,
                      document_type: "bukti_pembayaran",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  title="Lihat bukti pembayaran"
                >
                  <FaEye />
                </button>
              </div>
            </div>
          )}

          {user?.role === "karyawan" && isOwner && status === "draft" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Aksi</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    runAction(() => api.post(`/reimbursements/${data.id}/submit`), "Pengajuan berhasil dikirim.")
                  }
                  disabled={actionLoading}
                  className="h-10 px-5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  Kirim Pengajuan
                </button>
                <button
                  onClick={async () => {
                    const confirm = await Swal.fire({
                      title: "Hapus draft ini?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Hapus",
                      confirmButtonColor: "#dc2626",
                    });
                    if (confirm.isConfirmed) {
                      await runAction(() => api.delete(`/reimbursements/${data.id}`), "Draft berhasil dihapus.");
                      navigate("/riwayat");
                    }
                  }}
                  disabled={actionLoading}
                  className="h-10 px-5 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-60"
                >
                  Hapus Draft
                </button>
              </div>
            </div>
          )}
        </div>

        <ApprovalTimeline data={data} />
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
