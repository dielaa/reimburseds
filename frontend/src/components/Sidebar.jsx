import { NavLink, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaThLarge,
  FaCheckCircle,
  FaClock,
  FaUserCircle,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import api, { clearSession, getStoredUser, ROLE_LABELS } from "../services/api";

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/ajukan", label: "Ajukan", icon: FaCheckCircle },
  { to: "/riwayat", label: "Riwayat", icon: FaClock },
  { to: "/profile", label: "Profile", icon: FaUserCircle },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore network errors on logout, clear session locally anyway
    }
    clearSession();
    navigate("/login");
  };

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shrink-0 bg-white border-r border-gray-200 flex flex-col justify-between h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:h-auto lg:min-h-screen`}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-lg border bg-white flex items-center justify-center">
                <img src="/logodasa.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 leading-tight truncate">Reimbursement</h1>
                <p className="text-gray-500 text-xs truncate">PT Dasa Aprilindo Sentosa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden shrink-0 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Tutup menu"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {user?.role === "karyawan" && (
            <button
              onClick={() => goTo("/ajukan")}
              className="w-full h-11 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 mb-8 transition"
            >
              <FaPlus size={14} /> Ajukan Baru
            </button>
          )}

          <nav className="space-y-1">
            {menuItems
              .filter((item) => item.to !== "/ajukan" || user?.role === "karyawan")
              .map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition ${isActive
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="p-5 sm:p-6 border-t border-gray-100 space-y-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{ROLE_LABELS[user.role] || user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full h-11 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-slate-700 font-medium flex items-center justify-center gap-2 transition-all duration-200"
          >
            <FaSignOutAlt size={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}