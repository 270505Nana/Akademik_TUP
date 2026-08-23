import { AuthProvider } from "./context/AuthContext";
import { StudentProvider } from "./context/StudentContext";
import { Routes, Route, Navigate } from "react-router-dom";

import 'bootstrap-icons/font/bootstrap-icons.css';
import LandingPage         from "./pages/landing/LandingPage";
import PusatInformasiTA    from "./pages/landing/PusatInformasiTA";
import LoginPage           from "./pages/auth/Login";
import RegisterPage        from "./pages/auth/Register";
import LengkapiData        from "./pages/mahasiswa/lengkapidata";
import DashboardMahasiswa  from "./pages/mahasiswa/Dashboard";
import DashboardAkademik   from "./pages/admin/dashboard";
import DashboardDosen      from "./pages/dosen/dashboard";
import JadwalNilaiSidang   from "./pages/dosen/JadwalNilaiSidang";
import InputNilaiSidang    from "./pages/dosen/InputNilaiSidang";
import MahasiswaBimbingan  from "./pages/dosen/MahasiswaBimbingan";
import RegistrasiTATUP     from "./pages/dosen/RegistrasiTATUP";
import PengajuanSK         from "./pages/mahasiswa/pengajuanSK";
import PermohonanSK        from "./pages/admin/permohonanSK";
import AturPeriodeSidang   from "./pages/admin/aturperiodesidang";
import AturPeriodeYudisium from "./pages/admin/aturperiodeyudisium";
import AturBerkas          from "./pages/admin/requirementdocs";
import UploadSKL           from "./pages/admin/skltranskrip";             
import RegistrasiSidang    from "./pages/admin/RegistrasiSidang";             
import ProtectedRoute      from "./components/common/protectedRoute";
import PendaftaranSidang   from "./pages/mahasiswa/pendaftaransidang";
import PendaftaranYudisium from "./pages/mahasiswa/pendaftaranyudisium";
import KelolaDataDosen      from "./pages/admin/keloladatadosen";

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/pusat-informasi" element={<PusatInformasiTA />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Lengkapi Data */}
          <Route
            path="/lengkapi-data"
            element={
              <ProtectedRoute allowedRoles={["MAHASISWA"]}>
                <LengkapiData />
              </ProtectedRoute>
            }
          />

          {/* Mahasiswa */}
          <Route
            path="/mahasiswa/dashboard"
            element={
              <ProtectedRoute allowedRoles={["MAHASISWA"]} requireCompleteProfile={true}>
                <DashboardMahasiswa />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mahasiswa/pengajuan-sk"
            element={
              <ProtectedRoute allowedRoles={["MAHASISWA"]} requireCompleteProfile={true}>
                <PengajuanSK />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mahasiswa/pendaftaran-sidang"
            element={
              <ProtectedRoute allowedRoles={["MAHASISWA"]} requireCompleteProfile={true}>
                <PendaftaranSidang />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/pendaftaran-yudisium"
            element={
              <ProtectedRoute allowedRoles={["MAHASISWA"]} requireCompleteProfile={true}>
                <PendaftaranYudisium />
              </ProtectedRoute>
            }
          />

          {/* Dosen */}
          <Route
            path="/dosen/dashboard"
            element={
              <ProtectedRoute allowedRoles={["DOSEN"]}>
                <DashboardDosen />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dosen/jadwal-nilai-sidang"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <JadwalNilaiSidang />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dosen/input-nilai/:id"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <InputNilaiSidang />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dosen/mahasiswa-bimbingan"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <MahasiswaBimbingan />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dosen/registrasi-ta-tup"
            element={
              <ProtectedRoute allowedRoles={["LECTURER"]}>
                <RegistrasiTATUP />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/akademik/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <DashboardAkademik />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/atur-periode/sidang"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AturPeriodeSidang />
              </ProtectedRoute>
            }
          />
          <Route
            path="/akademik/atur-periode/yudisium"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AturPeriodeYudisium />
              </ProtectedRoute>
            }
          />          
          <Route
            path="/akademik/permohonan-sk"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <PermohonanSK />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/atur-berkas"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AturBerkas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/registrasi-sidang-all"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <RegistrasiSidang />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/data-dosen"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <KelolaDataDosen />
              </ProtectedRoute>
            }
          />

          <Route
            path="/akademik/upload-skl"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
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