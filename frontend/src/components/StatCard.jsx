export default function StatCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-3">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
    </div>
  );
}
