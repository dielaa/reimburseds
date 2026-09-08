import { STATUS_LABELS, formatDateTime } from "../services/api";

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

export default function ApprovalTimeline({ data }) {
  const status = data.status;
  const timelineDoneIndex = TIMELINE_ORDER.indexOf(status);

  const timeline = TIMELINE_ORDER.map((s, idx) => {
    const log = (data.statusLogs || []).find((l) => l.status === s);
    let state = "todo";
    if (status === "ditolak") {
      state = log ? "done" : "todo";
    } else if (idx < timelineDoneIndex) state = "done";
    else if (idx === timelineDoneIndex) state = "active";
    return {
      label: STATUS_LABELS[s],
      time: log ? formatDateTime(log.created_at) : "",
      actor: log?.changedBy?.name,
      note: log?.note,
      state,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
      <h3 className="font-semibold text-slate-900 mb-5">Riwayat Persetujuan</h3>
      <ol className="space-y-6 relative border-l border-gray-200 ml-2">
        {timeline.map((t) => (
          <li key={t.label} className="ml-5 relative">
            <span
              className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ${
                t.state === "done" ? "bg-green-500" : t.state === "active" ? "bg-orange-500" : "bg-gray-200"
              }`}
            />
            <p className={`text-sm font-medium ${t.state === "active" ? "text-orange-600" : "text-slate-900"}`}>
              {t.label}
            </p>
            {t.time && (
              <p className={`text-xs ${t.state === "active" ? "text-orange-500" : "text-gray-400"}`}>
                {t.actor ? `${t.actor} • ` : ""}
                {t.time}
              </p>
            )}
            {t.state === "active" && !t.time && <p className="text-xs text-orange-500">Menunggu Tindakan Anda</p>}
            {t.note && (
              <p className="mt-1.5 text-xs text-slate-600 bg-gray-50 rounded-md px-3 py-2 italic">"{t.note}"</p>
            )}
          </li>
        ))}
        {status === "ditolak" && (
          <li className="ml-5 relative">
            <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-red-500" />
            <p className="text-sm font-medium text-red-600">Ditolak</p>
            {data.rejection_reason && (
              <p className="mt-1.5 text-xs text-slate-600 bg-red-50 rounded-md px-3 py-2 italic">
                "{data.rejection_reason}"
              </p>
            )}
          </li>
        )}
      </ol>
    </div>
  );
}
