import { AuthProvider } from "./context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap-icons/font/bootstrap-icons.css';
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import DashboardMahasiswa from "./pages/mahasiswa/DashboardMahasiswa";
import DashboardAkademik from "./pages/admin/dashboard.jsx";
// import ProtectedRoute from "./components/common/ProtectedRoute";


const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* publik */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* mhs */}
        <Route
          path="/mahasiswa/dashboard" element={<DashboardMahasiswa />}
          // element={
          //   <ProtectedRoute allowedRoles={["mahasiswa"]}>
          //     <DashboardMahasiswa />
          //   </ProtectedRoute>
          // }
        />

        {/* buat dosen */}
        {/* <Route
          path="/dosen/dashboard"/
          element={
            <ProtectedRoute allowedRoles={["dosen"]}>
              <DashboardDosen />
            </ProtectedRoute>
          }
        /> */}

        {/* buat admin */}
        <Route
          path="/akademik/dashboard" element={<DashboardAkademik />}
          // element={
          //   <ProtectedRoute allowedRoles={["akademik"]}>
          //     <DashboardAkademik />
          //   </ProtectedRoute>
          // }
        />

        {/* 403 Forbidden */}
        <Route
          path="/forbidden"
          element={
            <div style={{ textAlign: "center", padding: "4rem" }}>
              <h2>403 — Akses Ditolak</h2>
              <p>Kamu tidak memiliki izin untuk mengakses halaman ini.</p>
            </div>
          }
        />
        
        {/* Catch-all: redirect ke login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
