import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaInfoCircle,
  FaPaperclip,
  FaFileAlt,
  FaDownload,
  FaListUl,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import api, {
  CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStoredUser,
} from "../services/api";

const TIMELINE_ORDER = [
  "draft",
  "diajukan",
  "menunggu_approval",
  "disetujui",
  "verifikasi_finance",
  "diproses",
  "dibayarkan",
  "selesai",
];

export default function DetailPengajuan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const promptReason = async () => {
    const { value: reason } = await Swal.fire({
      title: "Alasan Penolakan",
      input: "textarea",
      inputPlaceholder: "Tuliskan alasan penolakan (min. 5 karakter)...",
      showCancelButton: true,
      confirmButtonText: "Tolak Pengajuan",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Batal",
    });
    return reason;
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

  const timelineDoneIndex = TIMELINE_ORDER.indexOf(status);
  const timeline = TIMELINE_ORDER.map((s, idx) => {
    const log = (data.statusLogs || []).find((l) => l.status === s);
    let state = "todo";
    if (status === "ditolak") {
      state = log ? "done" : "todo";
    } else if (idx < timelineDoneIndex) state = "done";
    else if (idx === timelineDoneIndex) state = "active";
    return { label: STATUS_LABELS[s], time: log ? formatDateTime(log.created_at) : "", state };
  });

  return (
    <DashboardLayout>
      <Link
        to="/riwayat"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
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
          {/* Informasi Pengajuan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaInfoCircle className="text-gray-400" /> Informasi Pengajuan
            </h3>
            <hr className="border-gray-100 mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Project</p>
                <p className="font-semibold text-slate-900">{data.project?.name || "-"}</p>
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

          {/* Rincian Biaya */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaListUl className="text-gray-400" /> Rincian Biaya
            </h3>
            <hr className="border-gray-100 mb-4" />
            <div className="space-y-3">
              {(data.items || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.description}</p>
                    <p className="text-xs text-gray-400">{CATEGORY_LABELS[item.category] || item.category}</p>
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
          </div>

          {/* Bukti Lampiran */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
              <FaPaperclip className="text-gray-400" /> Bukti Lampiran
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
                    onClick={() => handleDownload(doc)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    title="Unduh dokumen"
                  >
                    <FaDownload />
                  </button>
                </div>
              ))}
              {(data.documents || []).length === 0 && (
                <p className="text-sm text-gray-400">Belum ada bukti transaksi yang diunggah.</p>
              )}
            </div>
          </div>

          {/* Aksi */}
          <ActionPanel
            data={data}
            user={user}
            isOwner={isOwner}
            actionLoading={actionLoading}
            runAction={runAction}
            promptReason={promptReason}
            navigate={navigate}
          />
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <h3 className="font-semibold text-slate-900 mb-5">Status Timeline</h3>
          <ol className="space-y-6 relative border-l border-gray-200 ml-2">
            {timeline.map((t) => (
              <li key={t.label} className="ml-5 relative">
                <span
                  className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ${
                    t.state === "done"
                      ? "bg-green-500"
                      : t.state === "active"
                      ? "bg-orange-500"
                      : "bg-gray-200"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    t.state === "active" ? "text-orange-600" : "text-slate-900"
                  }`}
                >
                  {t.label}
                </p>
                {t.time && (
                  <p className={`text-xs ${t.state === "active" ? "text-orange-500" : "text-gray-400"}`}>
                    {t.time}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ActionPanel({ data, user, isOwner, actionLoading, runAction, promptReason, navigate }) {
  const status = data.status;
  const role = user?.role;
  const buttons = [];

  if (role === "karyawan" && isOwner && status === "draft") {
    buttons.push({
      label: "Kirim Pengajuan",
      cls: "bg-orange-500 hover:bg-orange-600 text-white",
      onClick: () => runAction(() => api.post(`/reimbursements/${data.id}/submit`), "Pengajuan berhasil dikirim."),
    });
    buttons.push({
      label: "Hapus Draft",
      cls: "border border-red-300 text-red-600 hover:bg-red-50",
      onClick: async () => {
        const confirm = await Swal.fire({
          title: "Hapus draft ini?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Hapus",
          confirmButtonColor: "#dc2626",
        });
        if (confirm.isConfirmed) {
          runAction(() => api.delete(`/reimbursements/${data.id}`), "Draft berhasil dihapus.").then(() =>
            navigate("/riwayat")
          );
        }
      },
    });
  }

  if (role === "pm_pic" && status === "menunggu_approval") {
    buttons.push({
      label: "Setujui",
      cls: "bg-teal-600 hover:bg-teal-700 text-white",
      onClick: () => runAction(() => api.post(`/reimbursements/${data.id}/approve`), "Pengajuan disetujui."),
    });
    buttons.push({
      label: "Tolak",
      cls: "border border-red-300 text-red-600 hover:bg-red-50",
      onClick: async () => {
        const reason = await promptReason();
        if (reason) runAction(() => api.post(`/reimbursements/${data.id}/reject`, { reason }), "Pengajuan ditolak.");
      },
    });
  }

  if (role === "finance") {
    if (status === "disetujui") {
      buttons.push({
        label: "Verifikasi",
        cls: "bg-indigo-600 hover:bg-indigo-700 text-white",
        onClick: () => runAction(() => api.post(`/reimbursements/${data.id}/verify`), "Pengajuan sedang diverifikasi."),
      });
      buttons.push({
        label: "Tolak",
        cls: "border border-red-300 text-red-600 hover:bg-red-50",
        onClick: async () => {
          const reason = await promptReason();
          if (reason)
            runAction(() => api.post(`/reimbursements/${data.id}/finance-reject`, { reason }), "Pengajuan ditolak.");
        },
      });
    }
    if (status === "verifikasi_finance") {
      buttons.push({
        label: "Proses Pembayaran",
        cls: "bg-purple-600 hover:bg-purple-700 text-white",
        onClick: () => runAction(() => api.post(`/reimbursements/${data.id}/process`), "Pengajuan diproses."),
      });
      buttons.push({
        label: "Tolak",
        cls: "border border-red-300 text-red-600 hover:bg-red-50",
        onClick: async () => {
          const reason = await promptReason();
          if (reason)
            runAction(() => api.post(`/reimbursements/${data.id}/finance-reject`, { reason }), "Pengajuan ditolak.");
        },
      });
    }
    if (status === "diproses") {
      buttons.push({
        label: "Tandai Dibayarkan",
        cls: "bg-cyan-600 hover:bg-cyan-700 text-white",
        onClick: () => runAction(() => api.post(`/reimbursements/${data.id}/pay`), "Pembayaran dicatat."),
      });
    }
    if (status === "dibayarkan") {
      buttons.push({
        label: "Selesaikan",
        cls: "bg-green-600 hover:bg-green-700 text-white",
        onClick: () => runAction(() => api.post(`/reimbursements/${data.id}/complete`), "Reimbursement selesai."),
      });
    }
  }

  if (buttons.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Aksi</h3>
      <div className="flex flex-wrap gap-3">
        {buttons.map((b) => (
          <button
            key={b.label}
            onClick={b.onClick}
            disabled={actionLoading}
            className={`h-10 px-5 rounded-md text-sm font-medium disabled:opacity-60 transition ${b.cls}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
