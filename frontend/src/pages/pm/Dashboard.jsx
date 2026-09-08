import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartBar, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaSearch, FaEye } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertBanner from "../../components/AlertBanner";
import StatCard from "../../components/StatCard";
import api, { formatCurrency, formatDate } from "../../services/api";

const PAGE_SIZE = 3;

export default function PmDashboard() {
  const [summary, setSummary] = useState(null);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [pending, setPending] = useState([]);
  const [pendingMeta, setPendingMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (targetPage = 1) => {
    setLoading(true);
    Promise.all([
      api.get("/dashboard"),
      api.get("/reimbursements", { params: { status: "disetujui" } }),
      api.get("/reimbursements", { params: { status: "ditolak" } }),
      api.get("/reimbursements", { params: { pending_only: true, page: targetPage } }),
    ])
      .then(([dash, approved, rejected, pendingRes]) => {
        setSummary(dash.data.summary);
        setApprovedTotal(approved.data.data?.total ?? approved.data.data?.data?.length ?? 0);
        setRejectedTotal(rejected.data.data?.total ?? rejected.data.data?.data?.length ?? 0);
        const paginated = pendingRes.data.data;
        setPending(paginated.data || []);
        setPendingMeta({
          current_page: paginated.current_page || 1,
          last_page: paginated.last_page || 1,
          total: paginated.total || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => load(1), 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = pending.filter((row) => {
    const term = search.toLowerCase();
    return !term || row.user?.name?.toLowerCase().includes(term) || row.project?.name?.toLowerCase().includes(term);
  });

  const stats = [
    { label: "Total Masuk (Bulan Ini)", value: summary?.total ?? 0, icon: <FaChartBar />, iconBg: "#e0e7ff", iconColor: "#4f46e5" },
    { label: "Siap Verifikasi", value: pendingMeta.total, icon: <FaHourglassHalf />, iconBg: "#fef3c7", iconColor: "#d97706" },
    { label: "Telah Disetujui", value: approvedTotal, icon: <FaCheckCircle />, iconBg: "#d1fae5", iconColor: "#059669" },
    { label: "Telah Ditolak", value: rejectedTotal, icon: <FaTimesCircle />, iconBg: "#fee2e2", iconColor: "#dc2626" },
  ];

  const startIndex = (pendingMeta.current_page - 1) * PAGE_SIZE;

  return (
    <DashboardLayout>
      <AlertBanner>
        <span className="font-semibold">Info:</span> Menunggu persetujuan Anda. Pastikan nota/kuitansi sesuai
        dengan aturan perusahaan.
      </AlertBanner>

      <h2 className="text-2xl font-bold text-slate-900 mb-1">Manager Dashboard</h2>
      <p className="text-gray-500 text-sm mb-6">Kelola dan review pengajuan reimburse dari tim proyek Anda.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">Daftar Pengajuan Menunggu Persetujuan Saya</h3>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pengaju..."
              className="h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-b border-gray-100 text-gray-500 text-left">
                <th className="py-3 px-6 font-medium">No</th>
                <th className="py-3 px-2 font-medium">Tgl</th>
                <th className="py-3 px-2 font-medium">Pengaju</th>
                <th className="py-3 px-2 font-medium">Project</th>
                <th className="py-3 px-2 font-medium text-right">Nominal</th>
                <th className="py-3 px-6 font-medium text-right">Aksi</th>
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
                filtered.map((row, i) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 px-6">{startIndex + i + 1}</td>
                    <td className="py-4 px-2 whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {row.user?.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{row.user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{row.user?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        {row.project || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right font-medium whitespace-nowrap">
                      {formatCurrency(row.total_amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/riwayat/${row.id}`} className="text-gray-400 hover:text-gray-600 inline-block">
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Tidak ada pengajuan yang menunggu persetujuan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4">
          <p className="text-xs text-gray-400">
            Menampilkan {pending.length === 0 ? 0 : startIndex + 1}-{startIndex + pending.length} dari{" "}
            {pendingMeta.total} pengajuan
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pendingMeta.current_page > 1 && load(pendingMeta.current_page - 1)}
              disabled={pendingMeta.current_page <= 1}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: pendingMeta.last_page }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => load(p)}
                className={`w-8 h-8 rounded-md text-sm font-medium ${
                  p === pendingMeta.current_page
                    ? "bg-orange-50 text-orange-600 border border-orange-300"
                    : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => pendingMeta.current_page < pendingMeta.last_page && load(pendingMeta.current_page + 1)}
              disabled={pendingMeta.current_page >= pendingMeta.last_page}
              className="w-8 h-8 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
