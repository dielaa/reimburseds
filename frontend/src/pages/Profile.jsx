import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaArrowLeft,
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaIdBadge,
  FaBriefcase,
  FaSignOutAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaTelegramPlane,
} from "react-icons/fa";
import DashboardLayout from "../layouts/DashboardLayout";
import api, {
  ROLE_LABELS,
  clearSession,
  getStoredUser,
  setSession,
} from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", department: "" });
  const [connectingTelegram, setConnectingTelegram] = useState(false);

  const [checkingStatus, setCheckingStatus] = useState(false);

  const refreshUser = async () => {
    setCheckingStatus(true);
    try {
      const res = await api.get("/me");
      const freshUser = res.data.user;
      setUser(freshUser);
      const token = localStorage.getItem("token");
      if (token) setSession(token, freshUser);
      Swal.fire({
        title: freshUser.telegram_chat_id
          ? "Sudah terhubung"
          : "Belum terhubung",
        icon: freshUser.telegram_chat_id ? "success" : "info",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Gagal", "Tidak bisa mengecek status.", "error");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnectTelegram = async () => {
    setConnectingTelegram(true);
    try {
      const res = await api.post("/profile/telegram-link");
      window.open(res.data.link, "_blank");
      Swal.fire({
        title: "Selesaikan di Telegram",
        text: "Klik tombol START di chat Telegram yang baru terbuka, lalu kembali ke sini dan klik 'Cek Status'.",
        icon: "info",
      });
    } catch (err) {
      Swal.fire(
        "Gagal",
        "Tidak bisa membuat link Telegram. Coba lagi.",
        "error",
      );
    } finally {
      setConnectingTelegram(false);
    }
  };

  useEffect(() => {
    api
      .get("/me")
      .then((res) => {
        const freshUser = res.data.user;
        setUser(freshUser);
        const token = localStorage.getItem("token");
        if (token) setSession(token, freshUser);
      })
      .catch(() => {
        // fall back to cached user if request fails
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore
    }
    clearSession();
    navigate("/login");
  };

  const startEditing = () => {
    setForm({
      name: user?.name || "",
      department: user?.department || "",
    });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department.trim()) {
      Swal.fire(
        "Data belum lengkap",
        "Nama dan Divisi tidak boleh kosong.",
        "warning",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/profile", {
        name: form.name,
        department: form.department,
      });
      const updatedUser = res.data.user || { ...user, ...form };
      setUser(updatedUser);
      const token = localStorage.getItem("token");
      if (token) setSession(token, updatedUser);
      setEditing(false);
      Swal.fire("Berhasil", "Data diri berhasil diperbarui.", "success");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Gagal memperbarui data diri.";
      Swal.fire("Gagal", message, "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DashboardLayout>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
        <FaArrowLeft size={13} /> Kembali ke Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Data Diri Karyawan
        </h2>
        {!loading && user && !editing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 h-10 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
          >
            <FaEdit size={13} /> Edit Data
          </button>
        )}
      </div>
      <div className="flex justify-center">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 w-full max-w-6xl mx-auto">
          {loading && !user ? (
            <p className="text-gray-400 text-center">Memuat data...</p>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-orange-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                    {initials}
                  </div>

                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-orange-400 border-4 border-white rounded-full"></div>
                </div>

                <h3 className="text-3xl font-bold text-slate-900">
                  {user?.name}
                </h3>

                <p className="text-lg text-gray-500 mt-1">{user?.department}</p>

                <p className="text-sm text-gray-400 mt-1">{user?.email}</p>

                <span className="mt-4 px-5 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold tracking-wide">
                  ●{" "}
                  {(ROLE_LABELS[user?.role] || user?.role || "").toUpperCase()}
                </span>
              </div>

              <hr className="border-gray-200 mb-8" />
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <FaTelegramPlane
                    size={22}
                    className={
                      user?.telegram_chat_id ? "text-sky-500" : "text-gray-400"
                    }
                  />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      NOTIFIKASI TELEGRAM
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {user?.telegram_chat_id ? "Terhubung" : "Belum terhubung"}
                    </p>
                  </div>
                </div>

                {user?.telegram_chat_id ? (
                  <button
                    onClick={refreshUser}
                    disabled={checkingStatus}
                    className="h-10 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm disabled:opacity-60"
                  >
                    {checkingStatus ? "Mengecek..." : "Cek Status"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleConnectTelegram}
                      disabled={connectingTelegram}
                      className="flex items-center gap-2 h-10 px-4 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm disabled:opacity-60"
                    >
                      <FaTelegramPlane size={13} />{" "}
                      {connectingTelegram
                        ? "Memproses..."
                        : "Hubungkan Telegram"}
                    </button>
                    <button
                      onClick={refreshUser}
                      className="h-10 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                    >
                      Cek Status
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <EditableField
                      icon={FaUser}
                      label="Nama Lengkap"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                    />
                    <EditableField
                      icon={FaBuilding}
                      label="Divisi"
                      name="department"
                      value={form.department}
                      onChange={handleFormChange}
                      required
                    />
                    <Field
                      icon={FaEnvelope}
                      label="Email Perusahaan"
                      value={user?.email}
                    />
                    <Field
                      icon={FaIdBadge}
                      label="ID Karyawan"
                      value={`#${String(user?.id || "-").padStart(4, "0")}`}
                    />
                    <Field
                      icon={FaBriefcase}
                      label="Role"
                      value={ROLE_LABELS[user?.role] || user?.role}
                    />
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="flex items-center gap-2 h-11 px-6 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-60"
                    >
                      <FaTimes size={14} /> Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 h-11 px-6 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-60"
                    >
                      <FaSave size={14} />{" "}
                      {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <Field
                      icon={FaUser}
                      label="Nama Lengkap"
                      value={user?.name}
                    />
                    <Field
                      icon={FaBuilding}
                      label="Divisi"
                      value={user?.department}
                    />
                    <Field
                      icon={FaEnvelope}
                      label="Email Perusahaan"
                      value={user?.email}
                    />
                    <Field
                      icon={FaIdBadge}
                      label="ID Karyawan"
                      value={`#${String(user?.id || "-").padStart(4, "0")}`}
                    />
                    <Field
                      icon={FaBriefcase}
                      label="Role"
                      value={ROLE_LABELS[user?.role] || user?.role}
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 h-11 px-6 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium"
                    >
                      <FaSignOutAlt size={14} /> Keluar
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
      <p className="flex items-center gap-2 text-xs text-gray-400 mb-1">
        <Icon size={12} /> {label.toUpperCase()}
      </p>
      <p className="text-slate-900 font-semibold text-xl mt-2">
        {value || "-"}
      </p>
    </div>
  );
}

function EditableField({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
}) {
  return (
    <div className="bg-gray-50 rounded-md px-4 py-3">
      <label
        htmlFor={name}
        className="flex items-center gap-2 text-xs text-gray-400 mb-1"
      >
        <Icon size={12} /> {label.toUpperCase()}{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-white border border-gray-200 rounded-md px-3 py-1.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  );
}
