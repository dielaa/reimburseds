import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f5fb] flex">
      <Sidebar />
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
