import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Riwayat from "../pages/Riwayat";
import Profile from "../pages/Profile";
import Ajukan from "../pages/karyawan/Ajukan";
import ProtectedRoute from "../components/ProtectedRoute";
import RoleDashboard from "./RoleDashboard";
import RoleDetail from "./RoleDetail";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ajukan"
          element={
            <ProtectedRoute>
              <Ajukan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/riwayat"
          element={
            <ProtectedRoute>
              <Riwayat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/riwayat/:id"
          element={
            <ProtectedRoute>
              <RoleDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
