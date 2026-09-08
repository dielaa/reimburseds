import KaryawanDetail from "../pages/karyawan/DetailPengajuan";
import PmReview from "../pages/pm/ReviewPengajuan";
import FinanceVerifikasi from "../pages/finance/VerifikasiPengajuan";
import { getStoredUser } from "../services/api";

export default function RoleDetail() {
  const user = getStoredUser();

  if (user?.role === "pm_pic") return <PmReview />;
  if (user?.role === "finance") return <FinanceVerifikasi />;
  return <KaryawanDetail />;
}
