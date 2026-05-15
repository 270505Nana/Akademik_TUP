import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  BsMortarboardFill,
  BsPersonBadgeFill,
  BsPersonFill,
  BsLockFill,
  BsArrowRightCircleFill,
  BsQuestionCircle,
  BsEyeFill,
  BsEyeSlashFill,
} from "react-icons/bs";

import bgLogin    from "../../assets/bg-login.png";
import logoSimta  from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";

import { useAuth }   from "../../context/AuthContext";
import { loginUser } from "../../service/api";
import CustomAlert   from "../../components/common/CustomAlert";
import "./Auth.css";

// ── Mapping: tab yang boleh untuk role apa ──────────────────────────────────
// Tab "mahasiswa" → hanya STUDENT
// Tab "dosen"     → LECTURER dan ACADEMIC_STAFF
const TAB_ALLOWED_ROLES = {
  mahasiswa: ["STUDENT"],
  dosen:     ["LECTURER", "ACADEMIC_STAFF"],
};

const LoginPage = () => {
  const [activeTab,    setActiveTab]    = useState("mahasiswa");
  const [ssoUsername,  setSsoUsername]  = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert,        setAlert]        = useState(null); // { type, msg }
  const [isLoading,    setIsLoading]    = useState(false);

  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── Kalau sudah login, redirect sesuai role ──────────────────────────────
  if (isAuthenticated && user) {
    const roleMap = {
      STUDENT:        "/mahasiswa/dashboard",
      LECTURER:       "/dosen/dashboard",
      ACADEMIC_STAFF: "/akademik/dashboard",
    };
    return <Navigate to={roleMap[user.role] || "/login"} replace />;
  }

  // ── Ganti tab: reset form & alert ───────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setAlert(null);
    setSsoUsername("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // ── Validasi input kosong ────────────────────────────────────────────
    if (!ssoUsername.trim()) {
      setAlert({ type: "error", msg: "Email tidak boleh kosong." });
      return;
    }
    if (!password) {
      setAlert({ type: "error", msg: "Password tidak boleh kosong." });
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginUser({ email: ssoUsername, password });

      // ── Ambil & normalkan role dari response backend ─────────────────
      const role = data.data?.role?.toUpperCase()?.trim();

      // ── VALIDASI TAB vs ROLE ─────────────────────────────────────────
      // Cek apakah role yang dikembalikan backend sesuai tab yang dipilih
      // Token TIDAK disimpan jika role tidak sesuai tab
      const allowedRolesForTab = TAB_ALLOWED_ROLES[activeTab];
      if (!allowedRolesForTab.includes(role)) {
        const errMsg =
          activeTab === "mahasiswa"
            ? "Akun ini bukan akun mahasiswa. Silakan login melalui tab Dosen/Pegawai."
            : "Akun ini adalah akun mahasiswa. Silakan login melalui tab Mahasiswa.";
        setAlert({ type: "error", msg: errMsg });
        return; // ← early return, login() tidak dipanggil, token tidak tersimpan
      }

      // ── Validasi lolos → simpan token ke context & localStorage ─────
      // AuthContext.login() menyimpan ke:
      //   localStorage["simta_user"]  = { id, username, email, role, ... }
      //   localStorage["simta_token"] = JWT token string
      login({
        ...data.data,
        role,              // pastikan role sudah uppercase
        token: data.token,
      });

      // ── Redirect berdasarkan role ────────────────────────────────────
      const destination = {
        STUDENT:        "/mahasiswa/dashboard",
        LECTURER:       "/dosen/dashboard",
        ACADEMIC_STAFF: "/akademik/dashboard",
      }[role] || "/login";

      setAlert({ type: "success", msg: "Login berhasil! Mengarahkan ke dashboard..." });
      setTimeout(() => navigate(destination, { replace: true }), 1200);

    } catch (err) {
      const backendMsg = err.response?.data?.message?.toLowerCase() || "";

      let errMsg = "Login gagal. Periksa email dan password kamu.";
      if (backendMsg.includes("tidak ditemukan") || backendMsg.includes("not found")) {
        errMsg = "Akun dengan email ini tidak terdaftar.";
      } else if (
        backendMsg.includes("password") ||
        backendMsg.includes("salah") ||
        backendMsg.includes("invalid")
      ) {
        errMsg = "Email atau password yang kamu masukkan salah.";
      } else if (backendMsg.includes("belum diverifikasi")) {
        errMsg = "Akun kamu belum diverifikasi. Silakan hubungi admin.";
      }

      setAlert({ type: "error", msg: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      {/* ── Left Panel ──────────────────────────────────────────────────── */}
      <div className="left-panel">
        <img src={bgLogin} alt="Background" className="bg-image" />
        <div className="left-overlay" />
        <div className="left-content">
          <div className="brand-logo">
            <img src={logoSimta} alt="Logo SIMTA" className="logo-img" />
          </div>
          <div className="brand-text">
            <p className="brand-welcome">Selamat Datang di</p>
            <h1 className="brand-name">SIMTA</h1>
            <p className="brand-desc">
              Sistem Informasi Manajemen Tugas Akhir
              <br />
              Telkom University Purwokerto
            </p>
          </div>
          <p className="brand-footer">Telkom University</p>
        </div>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────────── */}
      <div className="right-panel">
        <div className="blob blob-top-right" />
        <div className="blob blob-bottom-left" />

        <div className="form-card">
          <div className="form-logo">
            <img src={logoTelkom} alt="Logo Telkom" className="form-logo-img" />
          </div>

          {/* ── Role Tab ──────────────────────────────────────────────── */}
          <div className="role-toggle">
            <button
              className={`role-btn ${activeTab === "mahasiswa" ? "active" : ""}`}
              onClick={() => handleTabChange("mahasiswa")}
              type="button"
            >
              <BsMortarboardFill /> Mahasiswa
            </button>
            <button
              className={`role-btn ${activeTab === "dosen" ? "active" : ""}`}
              onClick={() => handleTabChange("dosen")}
              type="button"
            >
              <BsPersonBadgeFill /> Dosen/Pegawai
            </button>
          </div>

          <p className="sso-label">SSO LOGIN</p>

          {/* ── Alert ─────────────────────────────────────────────────── */}
          {alert && (
            <CustomAlert
              type={alert.type}
              message={alert.msg}
            />
          )}

          {/* ── Form ──────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="ssoUsername">
                SSO Username
              </label>
              <div className="input-wrapper">
                <BsPersonFill className="input-icon" />
                <input
                  id="ssoUsername"
                  type="email"
                  className="form-input"
                  placeholder={
                    activeTab === "mahasiswa"
                      ? "nama@student.telkomuniversity.ac.id"
                      : "nama@telkomuniversity.ac.id"
                  }
                  value={ssoUsername}
                  onChange={(e) => { setSsoUsername(e.target.value); setAlert(null); }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <BsLockFill className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Masukkan password kamu"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAlert(null); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan password"
                >
                  {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={isLoading}
            >
              <span>{isLoading ? "Memproses..." : "Login"}</span>
              {!isLoading && <BsArrowRightCircleFill />}
            </button>
          </form>

          <p className="forgot-text">
            <BsQuestionCircle /> <em>Lupa password?</em>&nbsp;
            <a href="#" className="forgot-link">Hub helpdesk</a>
          </p>

          {/* Register link hanya muncul di tab Mahasiswa */}
          {activeTab === "mahasiswa" && (
            <p className="login-redirect">
              Belum punya akun?&nbsp;
              <Link to="/register" className="forgot-link">Daftar di sini</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;