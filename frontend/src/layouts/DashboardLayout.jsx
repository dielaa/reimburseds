import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5fb] flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-gray-200 px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
            aria-label="Buka menu"
          >
            <FaBars size={18} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logodasa.png" alt="Logo" className="w-6 h-6 object-contain shrink-0" />
            <span className="font-semibold text-slate-900 truncate">Reimbursement</span>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}