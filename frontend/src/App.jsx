import { AuthProvider }    from "./context/AuthContext";
import { StudentProvider } from "./context/StudentContext";
import { Routes, Route, Navigate } from "react-router-dom";

import "bootstrap-icons/font/bootstrap-icons.css";

// Auth
import LoginPage    from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";

// Mahasiswa
import LengkapiData       from "./pages/mahasiswa/LengkapiData";
import DashboardMahasiswa from "./pages/mahasiswa/dashboard";
import PengajuanSK        from "./pages/mahasiswa/pengajuanSK";
import PendaftaranSidang  from "./pages/mahasiswa/pendaftaransidang";

// Dosen
import DashboardDosen from "./pages/dosen/dashboard";

// Admin / Akademik
import DashboardAkademik from "./pages/admin/dashboard";
import PermohonanSK      from "./pages/admin/permohonanSK";
import AturPeriode       from "./pages/admin/aturperiode";
import AturBerkas        from "./pages/admin/requirementdocs";
import UploadSKL         from "./pages/admin/skltranskrip";

import ProtectedRoute from "./components/common/ProtectedRoute";

const Placeholder = ({ title }) => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h2>{title} Page</h2>
    <p>This is a placeholder for the {title} feature.</p>
  </div>
);

// ── 403 Forbidden ─────────────────────────────────────────────────────────────
const ForbiddenPage = () => (
  <div style={{ textAlign: "center", padding: "4rem" }}>
    <h2>403 — Akses Ditolak</h2>
    <p>Kamu tidak memiliki izin untuk mengakses halaman ini.</p>
  </div>
);

// ── 404 Not Found ─────────────────────────────────────────────────────────────
const NotFoundPage = () => (
  <div style={{ textAlign: "center", padding: "4rem" }}>
    <h2>404 — Halaman Tidak Ditemukan</h2>
    <p>Halaman yang kamu cari tidak tersedia.</p>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <StudentProvider>
        <Routes>

          {/* ── Root redirect ──────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Auth (public) ──────────────────────────────────────────── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Lengkapi Data (STUDENT only, belum perlu profil lengkap) ─ */}
          <Route
            path="/lengkapi-data"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <LengkapiData />
              </ProtectedRoute>
            }
          />

          {/* ── Mahasiswa (STUDENT + profil harus lengkap) ─────────────── */}
          <Route
            path="/mahasiswa/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile>
                <DashboardMahasiswa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/pengajuan-sk"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile>
                <PengajuanSK />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/pendaftaran-sidang"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile>
                <PendaftaranSidang />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/pendaftaran-yudisium"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile>
                <Placeholder title="Pendaftaran Yudisium" />
              </ProtectedRoute>
            }
          />

          {/* ── Dosen (LECTURER only) ──────────────────────────────────── */}
          <Route
            path="/dosen/dashboard"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <DashboardDosen />
              </ProtectedRoute>
            }
          />

          {/* ── Akademik / Admin ───────────────────────────────────────── */}
          <Route
            path="/akademik/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF", "ADMIN"]}>
                <DashboardAkademik />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/atur-periode"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF", "ADMIN"]}>
                <AturPeriode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/permohonan-sk"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF", "ADMIN"]}>
                <PermohonanSK />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/atur-berkas"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF", "ADMIN"]}>
                <AturBerkas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/upload-skl"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF", "ADMIN"]}>
                <UploadSKL />
              </ProtectedRoute>
            }
          />

          {/* ── Error pages ────────────────────────────────────────────── */}
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />

        </Routes>
      </StudentProvider>
    </AuthProvider>
  );
};

export default App;