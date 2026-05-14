import { AuthProvider } from "./context/AuthContext";
import { StudentProvider } from "./context/StudentContext";
import { Routes, Route, Navigate } from "react-router-dom";

import "bootstrap-icons/font/bootstrap-icons.css";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import LengkapiData from "./pages/mahasiswa/LengkapiData";
import DashboardMahasiswa from "./pages/mahasiswa/dashboard";
import DashboardAkademik from "./pages/admin/dashboard";
import DashboardDosen from "./pages/dosen/dashboard";
import PengajuanSK from "./pages/mahasiswa/pengajuanSK";
import PermohonanSK from "./pages/admin/permohonanSK";
import AturPeriode from "./pages/admin/aturperiode";
import AturBerkas from "./pages/admin/requirementdocs";
import UploadSKL from "./pages/admin/skltranskrip";

import ProtectedRoute from "./components/common/ProtectedRoute";
import PendaftaranSidang from "./pages/mahasiswa/pendaftaransidang";

const Placeholder = ({ title }) => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
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

          <Route path="/login" element={<LoginPage />} />
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
            path="/mahasiswa"
            element={
              <ProtectedRoute
                allowedRoles={["STUDENT"]}
                requireCompleteProfile={true}
              />
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardMahasiswa />} />
            <Route path="pengajuan-sk" element={<PengajuanSK />} />
            <Route path="pendaftaran-sidang" element={<PendaftaranSidang />} />
            <Route
              path="pendaftaran-yudisium"
              element={<Placeholder title="Pendaftaran Yudisium" />}
            />
          </Route>

          {/* Dosen */}
          <Route
            path="/dosen"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]} />
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardDosen />} />
          </Route>

          {/* Admin */}
          <Route
            path="/akademik"
            element={
              <ProtectedRoute allowedRoles={["ACADEMIC_STAFF"]} />
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardAkademik />} />
            <Route path="atur-periode" element={<AturPeriode />} />
            <Route path="permohonan-sk" element={<PermohonanSK />} />
            <Route path="atur-berkas" element={<AturBerkas />} />
            <Route path="upload-skl" element={<UploadSKL />} />
          </Route>

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
