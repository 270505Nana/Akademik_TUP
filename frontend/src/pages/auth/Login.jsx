import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  BsMortarboardFill, 
  BsPersonBadgeFill, 
  BsPersonFill, 
  BsLockFill, 
  BsArrowRightCircleFill, 
  BsQuestionCircle,
  BsEyeFill,
  BsEyeSlashFill
} from "react-icons/bs";

// Placeholders for missing assets to avoid build errors if they don't exist
// User can replace these with actual files in src/assets/
import bgLogin from "../../assets/bg-login.png";
import logoSimta from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";

import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../service/api";
import "./Auth.css";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState("mahasiswa");
  const [ssoUsername, setSsoUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  // Validasi sederhana sebelum hit API
  if (!ssoUsername.trim()) { setError("Email tidak boleh kosong."); return; }
  if (!password)            { setError("Password tidak boleh kosong."); return; }

  setIsLoading(true);
  try {
    const data = await loginUser({ email: ssoUsername, password });
    // data = { message: "...", token: "eyJ...", data: { id, email, role, ... } }

    // ✅ Gabungkan user data + token jadi satu object untuk AuthContext
    login({
      ...data.data,      // user fields: id, email, username, role, dll
      token: data.token, // token ikut masuk
    });

    // ✅ Map role dari BE ke route FE
    const roleMap = {
      STUDENT:       "/mahasiswa/dashboard",
      LECTURER:      "/dosen/dashboard",
      ACADEMIC_STAFF: "/akademik/dashboard",
    };

    const role = data.data?.role;
    const destination = roleMap[role] || "/dashboard";
    navigate(destination);

  } catch (err) {
    // Tampilkan pesan error dari BE
    const msg =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      "Login gagal. Periksa email dan password kamu.";
    setError(msg);
    console.log("Login error detail:", err.response?.data);
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="login-wrapper">
      <div className="left-panel">
        <img 
          src={bgLogin} 
          alt="Background" 
          className="bg-image" 
          onError={(e) => { 
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2029&auto=format&fit=crop"; 
          }} 
        />
        <div className="left-overlay" />

        <div className="left-content">
          <div className="brand-logo">
            <img src={logoSimta} alt="Logo SIMTA" className="logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
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

      <div className="right-panel">
        <div className="blob blob-top-right" />
        <div className="blob blob-bottom-left" />

        <div className="form-card">
          <div className="form-logo">
            <img src={logoTelkom} alt="Logo Telkom" className="form-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>

          <div className="role-toggle">
            <button
              className={`role-btn ${activeTab === "mahasiswa" ? "active" : ""}`}
              onClick={() => { setActiveTab("mahasiswa"); setError(""); }}
              type="button"
            >
              <BsMortarboardFill />
              Mahasiswa
            </button>

            <button
              className={`role-btn ${activeTab === "dosen" ? "active" : ""}`}
              onClick={() => { setActiveTab("dosen"); setError(""); }}
              type="button"
            >
              <BsPersonBadgeFill />
              Dosen/Pegawai
            </button>

          </div>

          <p className="sso-label">SSO LOGIN</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="ssoUsername">SSO Username</label>
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
                  onChange={(e) => setSsoUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <BsLockFill className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              <span>{isLoading ? "Memproses..." : "Login"}</span>
              {!isLoading && <BsArrowRightCircleFill />}
            </button>

          </form>

          <p className="forgot-text">
            <BsQuestionCircle />
            <em>Lupa password?</em>&nbsp;
            <a href="#" className="forgot-link">Hub helpdesk</a>
          </p>

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
