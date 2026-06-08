import { AuthProvider } from "./context/AuthContext";
import { StudentProvider } from "./context/StudentContext";
import { Routes, Route, Navigate } from "react-router-dom";

import 'bootstrap-icons/font/bootstrap-icons.css';
import LoginPage           from "./pages/auth/Login";
import RegisterPage        from "./pages/auth/Register";
import LengkapiData        from "./pages/mahasiswa/LengkapiData";
import DashboardMahasiswa  from "./pages/mahasiswa/dashboard";
import DashboardAkademik   from "./pages/admin/dashboard";
import DashboardDosen      from "./pages/dosen/dashboard";
import PengajuanSK         from "./pages/mahasiswa/pengajuanSK";
import PermohonanSK        from "./pages/admin/permohonanSK";
import AturPeriodeSidang   from "./pages/admin/aturperiodesidang";
import AturPeriodeYudisium from "./pages/admin/aturperiodeyudisium";
import AturBerkas          from "./pages/admin/requirementdocs";
import UploadSKL           from "./pages/admin/skltranskrip";             
import RegistrasiSidang    from "./pages/admin/RegistrasiSidang";             
import ProtectedRoute      from "./components/common/ProtectedRoute";
import PendaftaranSidang   from "./pages/mahasiswa/pendaftaransidang";

const Placeholder = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>{title} Page</h2>
    <p>This is a placeholder for the {title} feature.</p>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <StudentProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Lengkapi Data */}
          <Route
            path="/lengkapi-data"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <LengkapiData />
              </ProtectedRoute>
            }
          />

          {/* Mahasiswa */}
          <Route
            path="/mahasiswa/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile={true}>
                <DashboardMahasiswa />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mahasiswa/pengajuan-sk"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile={true}>
                <PengajuanSK />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mahasiswa/pendaftaran-sidang"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile={true}>
                <PendaftaranSidang />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/pendaftaran-yudisium"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]} requireCompleteProfile={true}>
                <Placeholder title="Pendaftaran Yudisium" />
              </ProtectedRoute>
            }
          />

          {/* Dosen */}
          <Route
            path="/dosen/dashboard"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <DashboardDosen />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/akademik/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <DashboardAkademik />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/atur-periode/sidang"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <AturPeriodeSidang />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/atur-periode/yudisium"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <AturPeriodeYudisium />
              </ProtectedRoute>
            }
          />

          
          <Route
            path="/akademik/permohonan-sk"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <PermohonanSK />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/atur-berkas"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <AturBerkas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/registrasi-sidang-all"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <RegistrasiSidang />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/upload-skl"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]}>
                <UploadSKL />
              </ProtectedRoute>
            }
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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </StudentProvider>
    </AuthProvider>
  );
};

export default App;