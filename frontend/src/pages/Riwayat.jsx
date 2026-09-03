import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaEye, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import api, { formatCurrency, formatDate, STATUS_LABELS } from "../services/api";

export default function Riwayat() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = (targetPage = 1, targetStatus = status) => {
    setLoading(true);
    api
      .get("/reimbursements", {
        params: {
          page: targetPage,
          ...(targetStatus ? { status: targetStatus } : {}),
        },
      })
      .then((res) => {
        const paginated = res.data.data;
        setRows(paginated.data || []);
        setPage(paginated.current_page || 1);
        setLastPage(paginated.last_page || 1);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(1, status), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = rows.filter((row) => {
    const term = search.toLowerCase();
    return (
      row.project?.name?.toLowerCase().includes(term) ||
      row.purpose?.toLowerCase().includes(term) ||
      !term
    );
  });

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Riwayat Pengajuan</h2>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-4 md:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Pencarian</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Project / Deskripsi..."
                className="w-full h-11 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchData(1, status)}
            className="h-11 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left">
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
                filtered.map((row, i) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="py-4 px-6">{(page - 1) * 15 + i + 1}</td>
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
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-4 py-5">
          <button
            onClick={() => page > 1 && fetchData(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40"
          >
            <FaChevronLeft size={12} />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {lastPage}
          </span>
          <button
            onClick={() => page < lastPage && fetchData(page + 1)}
            disabled={page >= lastPage}
            className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-40"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
