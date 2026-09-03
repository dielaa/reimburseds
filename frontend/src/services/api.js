import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// simple global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ---- Session helpers ----
export function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}

// ---- Shared lookup helpers ----
export const STATUS_LABELS = {
  draft: "Draft",
  diajukan: "Diajukan",
  menunggu_approval: "Menunggu Approval",
  disetujui: "Disetujui",
  verifikasi_finance: "Verifikasi Finance",
  diproses: "Diproses",
  dibayarkan: "Dibayarkan",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

export const ROLE_LABELS = {
  karyawan: "Karyawan",
  pm_pic: "Project Manager / PIC",
  finance: "Finance",
};

export const CATEGORY_LABELS = {
  transportasi: "Transportasi",
  akomodasi: "Akomodasi",
  konsumsi: "Konsumsi",
  komunikasi: "Komunikasi",
  perlengkapan: "Perlengkapan",
  lainnya: "Lainnya",
};

export const DOCUMENT_TYPE_LABELS = {
  nota: "Nota",
  struk: "Struk",
  invoice: "Invoice",
  form_tanpa_nota: "Form Tanpa Nota",
  lainnya: "Lainnya",
};

export function formatCurrency(value) {
  const num = Number(value || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
