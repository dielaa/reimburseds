import { STATUS_LABELS } from "../services/api";

const STYLES = {
  draft: "bg-gray-100 text-gray-700",
  diajukan: "bg-blue-100 text-blue-700",
  menunggu_approval: "bg-amber-100 text-amber-700",
  disetujui: "bg-teal-100 text-teal-700",
  verifikasi_finance: "bg-indigo-100 text-indigo-700",
  diproses: "bg-purple-100 text-purple-700",
  dibayarkan: "bg-cyan-100 text-cyan-700",
  selesai: "bg-green-100 text-green-700",
  ditolak: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase();
  const style = STYLES[key] || "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[key] || status;

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}
    >
      {label}
    </span>
  );
}
