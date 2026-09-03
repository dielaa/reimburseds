import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api, { setSession } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email) newErrors.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Format email tidak valid";
    if (!form.password) newErrors.password = "Password wajib diisi";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await api.post("/login", {
        email: form.email,
        password: form.password,
      });
      const { token, user } = res.data;
      setSession(token, user);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.response.data.errors || {}).map(([k, v]) => [k, v[0]])
          )
        );
      } else if (err.response?.status === 401) {
        setServerError(err.response.data.message || "Email atau password salah.");
      } else {
        setServerError("Tidak dapat terhubung ke server. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5fb] flex items-center justify-center px-4 relative">
      <span className="absolute top-6 left-6 text-gray-300 font-medium">Login</span>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-10">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-gray-700 flex items-center justify-center shadow-sm mb-4 overflow-hidden">
            <img
              src="/logodasa.png"
              alt="Logo"
              className="w-10 h-10 object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Reimbursement</h1>
          <p className="text-gray-400 text-sm mt-1">PT Dasa Aprilindo Sentosa</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {serverError}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Masukkan email Anda"
              className={`w-full h-12 px-4 rounded-lg border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition ${
                errors.email ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <button type="button" className="text-sm text-blue-500 hover:underline">
                Lupa password?
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password Anda"
                className={`w-full h-12 px-4 pr-12 rounded-lg border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition ${
                  errors.password ? "border-red-400" : "border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold shadow-sm shadow-orange-200 transition"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
