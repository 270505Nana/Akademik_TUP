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
    setIsLoading(true);
    try {
      const data = await loginUser({ ssoUsername, password, role: activeTab });
      login({ ...data.user, token: data.token });
      if (data.user.role === "mahasiswa") navigate("/mahasiswa/dashboard");
      else if (data.user.role === "dosen") navigate("/dosen/dashboard");
      else if (data.user.role === "akademik") navigate("/akademik/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal, coba lagi.");
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

            <button type="submit" className="btn-login" disabled={isLoading} onClick={() => navigate('/mahasiswa/dashboard')}>
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