import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaEdit,
  FaTrash,
  FaPaperPlane,
  FaPlus,
  FaFileAlt,
} from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertBanner from "../../components/AlertBanner";
import api, { formatCurrency, formatDate, getStoredUser } from "../../services/api";

export default function Draft() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/reimbursements", { params: { status: "draft" } })
      .then((res) => setRows(res.data.data?.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user?.role !== "karyawan") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDelete = async (row) => {
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

    setActionId(row.id);
    try {
      await api.delete(`/reimbursements/${row.id}`);
      await Swal.fire("Berhasil", "Draft berhasil dihapus.", "success");
      load();
    } catch (err) {
      Swal.fire("Gagal", err.response?.data?.message || "Gagal menghapus draft.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleSubmit = async (row) => {
    const confirm = await Swal.fire({
      title: "Kirim pengajuan ini?",
      text: "Pastikan data dan bukti transaksi sudah lengkap sebelum dikirim.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kirim",
      confirmButtonColor: "#f97316",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    setActionId(row.id);
    try {
      const res = await api.post(`/reimbursements/${row.id}/submit`);
      const warnings = res.data.warnings;
      if (warnings && Object.keys(warnings).length > 0) {
        const warningText = Object.values(warnings).flat().join(" ");
        await Swal.fire("Pengajuan terkirim", `Perhatian: ${warningText}`, "warning");
      } else {
        await Swal.fire("Berhasil", "Pengajuan berhasil dikirim dan menunggu approval.", "success");
      }
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Gagal mengirim pengajuan.";
      Swal.fire("Gagal", message, "error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Draft Pengajuan</h2>
          <p className="text-gray-500 text-sm mt-1">
            Kelola pengajuan yang belum Anda kirim. Anda dapat mengedit, menghapus, atau
            mengirimnya dari sini.
          </p>
        </div>
        <Link
          to="/ajukan"
          className="h-11 px-5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium flex items-center justify-center gap-2 shrink-0"
        >
          <FaPlus size={12} /> Ajukan Baru
        </Link>
      </div>

      <AlertBanner>
        <span className="font-semibold">Info!</span> Pengajuan berstatus draft belum
        dikirim ke atasan dan belum masuk ke proses approval. Klik <em>Edit</em> untuk
        mengubah data, atau <em>Kirim</em> jika sudah siap diajukan.
      </AlertBanner>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left">
                <th className="py-3 px-6 font-medium text-center">No</th>
                <th className="py-3 px-4 font-medium">Tanggal</th>
                <th className="py-3 px-4 font-medium">Project</th>
                <th className="py-3 px-4 font-medium">Deskripsi</th>
                <th className="py-3 px-4 font-medium text-center">Nominal</th>
                <th className="py-3 px-6 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row, i) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="py-4 px-6 text-center">{i + 1}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      {row.project || "-"}
                    </td>
                    <td className="py-4 px-4 text-gray-600 max-w-xs truncate">
                      {row.purpose}
                    </td>
                    <td className="py-4 px-4 text-center font-medium whitespace-nowrap">
                      {formatCurrency(row.total_amount)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => navigate(`/draft/${row.id}`)}
                          disabled={actionId === row.id}
                          className="text-indigo-500 hover:text-indigo-700 disabled:opacity-40"
                          title="Edit draft"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleSubmit(row)}
                          disabled={actionId === row.id}
                          className="text-orange-500 hover:text-orange-700 disabled:opacity-40"
                          title="Kirim pengajuan"
                        >
                          <FaPaperPlane />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          disabled={actionId === row.id}
                          className="text-red-400 hover:text-red-600 disabled:opacity-40"
                          title="Hapus draft"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <FaFileAlt size={28} className="text-gray-300" />
                      <p>Belum ada draft pengajuan.</p>
                      <Link
                        to="/ajukan"
                        className="text-orange-500 font-medium hover:underline text-sm"
                      >
                        Buat pengajuan baru
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
