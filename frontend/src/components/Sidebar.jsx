import { NavLink, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaThLarge,
  FaCheckCircle,
  FaClock,
  FaUserCircle,
  FaQuestionCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import api, { clearSession, getStoredUser, ROLE_LABELS } from "../services/api";

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/ajukan", label: "Ajukan", icon: FaCheckCircle },
  { to: "/riwayat", label: "Riwayat", icon: FaClock },
  { to: "/profile", label: "Profile", icon: FaUserCircle },
];

export default function Sidebar() {
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

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col justify-between min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg border bg-white flex items-center justify-center">
            <img src="/logodasa.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Reimbursement</h1>
            <p className="text-gray-500 text-xs">PT Dasa Aprilindo Sentosa</p>
          </div>
        </div>

        {user?.role === "karyawan" && (
          <button
            onClick={() => navigate("/ajukan")}
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

      <div className="p-6 border-t border-gray-100 space-y-4">
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
  );
}
