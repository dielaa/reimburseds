import KaryawanDashboard from "../pages/karyawan/Dashboard";
import PmDashboard from "../pages/pm/Dashboard";
import FinanceDashboard from "../pages/finance/Dashboard";
import { getStoredUser } from "../services/api";

export default function RoleDashboard() {
  const user = getStoredUser();

  if (user?.role === "pm_pic") return <PmDashboard />;
  if (user?.role === "finance") return <FinanceDashboard />;
  return <KaryawanDashboard />;
}
