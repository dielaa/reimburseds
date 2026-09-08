import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFileInvoice, FaExclamationCircle, FaClipboardCheck, FaWallet, FaSearch, FaEye } from "react-icons/fa";
import DashboardLayout from "../../layouts/DashboardLayout";
import AlertBanner from "../../components/AlertBanner";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import api, { formatCurrency, formatDate } from "../../services/api";

export default function FinanceDashboard() {
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/dashboard"),
      api.get("/reimbursements", { params: { status: "disetujui" } }),
      api.get("/reimbursements", { params: { status: "verifikasi_finance" } }),
      api.get("/reimbursements", { params: { status: "dibayarkan" } }),
      api.get("/reimbursements", { params: { status: "selesai" } }),
      api.get("/reimbursements"),
    ])
      .then(([dash, disetujui, verifikasi, dibayarkan, selesai, all]) => {
        if (!active) return;
        setSummary(dash.data.summary);
        const readyToVerify = [...(disetujui.data.data?.data || []), ...(verifikasi.data.data?.data || [])];
        setPending(readyToVerify);
        const paidRows = [...(dibayarkan.data.data?.data || []), ...(selesai.data.data?.data || [])];
        setTotalPaid(paidRows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0));
        setRecentLogs((all.data.data?.data || []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Total Masuk (Bulan Ini)", value: summary?.total ?? 0, icon: <FaFileInvoice />, iconBg: "#e0e7ff", iconColor: "#4f46e5" },
    { label: "Siap Verifikasi", value: pending.length, icon: <FaExclamationCircle />, iconBg: "#fef3c7", iconColor: "#d97706" },
    { label: "Telah Disetujui", value: summary?.disetujui ?? 0, icon: <FaClipboardCheck />, iconBg: "#d1fae5", iconColor: "#059669" },
    { label: "Sudah Cair (Total)", value: formatCurrency(totalPaid), icon: <FaWallet />, iconBg: "#cffafe", iconColor: "#0891b2" },
  ];

  const filtered = pending.filter((row) => {
    const term = search.toLowerCase();
    return !term || row.user?.name?.toLowerCase().includes(term) || row.project?.name?.toLowerCase().includes(term);
  });

  return (
    <DashboardLayout>
      <AlertBanner>
        <span className="font-semibold">Perhatian:</span> Verifikasi kelengkapan nota & kuitansi.
        Reimbursement cair tgl 15 & 30 setiap bulan.
      </AlertBanner>

      <h2 className="text-2xl font-bold text-slate-900 mb-1">Finance Dashboard</h2>
      <p className="text-gray-500 text-sm mb-6">Verifikasi dan proses pencairan reimbursement karyawan.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Daftar Pengajuan Siap Diverifikasi</h3>
              <p className="text-xs text-gray-400">Menunggu review dokumen (Nota & Kuitansi)</p>
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pengaju / project..."
                className="h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100 text-gray-500 text-left">
                  <th className="py-3 px-6 font-medium">No</th>
                  <th className="py-3 px-2 font-medium">Tgl Pengajuan</th>
                  <th className="py-3 px-2 font-medium">Pengaju</th>
                  <th className="py-3 px-2 font-medium">Status</th>
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
                      <td className="py-4 px-6">{i + 1}</td>
                      <td className="py-4 px-2 whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="py-4 px-2">
                        <p className="font-semibold text-slate-900">{row.user?.name}</p>
                        <p className="text-xs text-gray-400">{row.user?.department}</p>
                      </td>
                      <td className="py-4 px-2">
                        <StatusBadge status={row.status} />
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
                      Tidak ada pengajuan yang perlu diverifikasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-center py-4">
            <Link to="/riwayat" className="text-orange-500 font-medium hover:underline text-sm">
              Lihat Semua Pengajuan
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit">
          <h3 className="font-bold text-slate-900 mb-1">Riwayat Verifikasi (Terakhir)</h3>
          <p className="text-xs text-gray-400 mb-4">Aktivitas approval Anda</p>
          <div className="space-y-4">
            {recentLogs.map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    #REIM-{String(row.id).padStart(4, "0")}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{row.purpose}</p>
                  <p className="text-xs text-gray-400">{formatDate(row.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={row.status} />
                  <p className="text-xs font-medium text-slate-700 mt-1">{formatCurrency(row.total_amount)}</p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && !loading && (
              <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
