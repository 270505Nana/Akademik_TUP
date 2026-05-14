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

import bgLogin from "../../assets/bg-login.png";
import logoSimta from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";

import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../service/api";
import CustomAlert from "../../components/common/CustomAlert";
import "./Auth.css";

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState("mahasiswa");
  const [ssoUsername, setSsoUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);   // ← Gunakan CustomAlert
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!ssoUsername.trim()) {
      setAlert({ type: "error", msg: "SSO Username tidak boleh kosong." });
      return;
    }
    if (!password) {
      setAlert({ type: "error", msg: "Password tidak boleh kosong." });
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser({ 
        email: ssoUsername, 
        password 
      });

      login({
        ...response.data,
        token: response.token,
      });

      const userRole = response.data?.role?.toUpperCase();

      const roleMap = {
        STUDENT: "/mahasiswa/dashboard",
        LECTURER: "/dosen/dashboard",
        ACADEMIC_STAFF: "/akademik/dashboard",
        ADMIN: "/akademik/dashboard",
      };

      const destination = roleMap[userRole] || "/";

      // Success Alert sebelum redirect
      setAlert({ 
        type: "success", 
        msg: "Login berhasil! Mengarahkan ke dashboard..." 
      });

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1200);

    } catch (err) {
      console.error(err);
      
      let errorMsg = "Login gagal. Silakan coba lagi.";

      const backendMsg = err.response?.data?.message?.toLowerCase();

      if (backendMsg?.includes("tidak ditemukan") || backendMsg?.includes("not found")) {
        errorMsg = "Akun dengan email ini tidak terdaftar.";
      } else if (backendMsg?.includes("password") || backendMsg?.includes("salah") || backendMsg?.includes("invalid")) {
        errorMsg = "Email atau Password yang Anda masukkan salah.";
      } else if (backendMsg?.includes("belum diverifikasi")) {
        errorMsg = "Akun Anda belum diverifikasi. Silakan hubungi admin.";
      }

      setAlert({ type: "error", msg: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
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

      <div className="right-panel">
        <div className="blob blob-top-right" />
        <div className="blob blob-bottom-left" />

        <div className="form-card">
          <div className="form-logo">
            <img src={logoTelkom} alt="Logo Telkom" className="form-logo-img" />
          </div>

          <div className="role-toggle">
            <button className={`role-btn ${activeTab === "mahasiswa" ? "active" : ""}`} onClick={() => setActiveTab("mahasiswa")}>
              <BsMortarboardFill /> Mahasiswa
            </button>
            <button className={`role-btn ${activeTab === "dosen" ? "active" : ""}`} onClick={() => setActiveTab("dosen")}>
              <BsPersonBadgeFill /> Dosen/Pegawai
            </button>
          </div>

          <p className="sso-label">SSO LOGIN</p>

          <form onSubmit={handleSubmit}>
            {alert && <CustomAlert type={alert.type} message={alert.msg} />}

            <div className="form-group">
              <label className="form-label" htmlFor="ssoUsername">SSO Username</label>
              <div className="input-wrapper">
                <BsPersonFill className="input-icon" />
                <input
                  id="ssoUsername"
                  type="email"
                  className="form-input"
                  placeholder={activeTab === "mahasiswa" ? "nama@student.telkomuniversity.ac.id" : "nama@telkomuniversity.ac.id"}
                  value={ssoUsername}
                  onChange={(e) => setSsoUsername(e.target.value)}
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
                  required
                />
                <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
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
            <BsQuestionCircle /> <em>Lupa password?</em>&nbsp;
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