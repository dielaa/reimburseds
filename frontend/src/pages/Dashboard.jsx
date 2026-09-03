import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChartBar,
  FaHourglassHalf,
  FaCheck,
  FaTimes,
  FaEye,
  FaPlus,
  FaArrowRight,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import AlertBanner from "../components/AlertBanner";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import api, { formatCurrency, formatDate, getStoredUser } from "../services/api";

export default function Dashboard() {
  const user = getStoredUser();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/dashboard")
      .then((res) => {
        if (!active) return;
        setSummary(res.data.summary);
        setRecent(res.data.recent || []);
      })
      .catch(() => {
        if (active) setError("Gagal memuat data dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Total Pengajuan", value: summary?.total ?? 0, icon: <FaChartBar />, iconBg: "#e0e7ff", iconColor: "#4f46e5" },
    { label: "Menunggu Approval", value: summary?.menunggu_approval ?? 0, icon: <FaHourglassHalf />, iconBg: "#fef3c7", iconColor: "#d97706" },
    { label: "Disetujui", value: summary?.disetujui ?? 0, icon: <FaCheck />, iconBg: "#d1fae5", iconColor: "#059669" },
    { label: "Ditolak", value: summary?.ditolak ?? 0, icon: <FaTimes />, iconBg: "#fee2e2", iconColor: "#dc2626" },
  ];

  return (
    <DashboardLayout>
      <AlertBanner>
        <span className="font-semibold">Perhatian!</span> Batas akhir pengajuan adalah H-3
        sebelum tanggal cair (15 & 30). Upload semua bukti transaksi.
      </AlertBanner>

      <h2 className="text-3xl font-bold text-slate-900 mb-1">Dashboard Reimbursement</h2>
      <p className="text-gray-500 mb-6">
        {user?.role === "karyawan"
          ? "Pantau status reimburse Anda bulan ini."
          : "Pantau reimbursement yang perlu ditindaklanjuti."}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">Pengajuan Terbaru</h3>
          {user?.role === "karyawan" && (
            <Link
              to="/ajukan"
              className="h-10 px-5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium flex items-center gap-2"
            >
              <FaPlus size={12} /> Ajukan Baru
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-gray-100 text-gray-500 text-left">
                <th className="py-3 px-6 font-medium">No</th>
                <th className="py-3 px-2 font-medium">Tanggal</th>
                <th className="py-3 px-2 font-medium">Project</th>
                <th className="py-3 px-2 font-medium">Deskripsi</th>
                <th className="py-3 px-2 font-medium text-right">Nominal</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading &&
                recent.map((row, i) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6">{i + 1}</td>
                    <td className="py-4 px-2 whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="py-4 px-2 font-semibold text-slate-900">{row.project?.name || "-"}</td>
                    <td className="py-4 px-2 text-gray-600 max-w-xs truncate">{row.purpose}</td>
                    <td className="py-4 px-2 text-right font-medium whitespace-nowrap">
                      {formatCurrency(row.total_amount)}
                    </td>
                    <td className="py-4 px-2">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/riwayat/${row.id}`} className="text-gray-400 hover:text-gray-600 inline-block">
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Belum ada pengajuan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-center py-5">
          <Link
            to="/riwayat"
            className="text-orange-500 font-medium hover:underline inline-flex items-center gap-1"
          >
            Lihat Semua Riwayat <FaArrowRight size={12} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
