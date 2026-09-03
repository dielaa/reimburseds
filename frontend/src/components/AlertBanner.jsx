import { FaExclamationTriangle } from "react-icons/fa";

export default function AlertBanner({ children }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400 rounded-md px-5 py-4 mb-6">
      <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" size={16} />
      <p className="text-sm text-amber-800">{children}</p>
    </div>
  );
}
