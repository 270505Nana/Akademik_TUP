import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

import bgLogin    from "../../assets/bg-login.png";
import logoSimta  from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";
import waveBottom from "../../assets/wave-bottom.png";

import { registerUser } from "../../service/api";
import "./Auth.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username:        "",
    email:           "",
    no_telp:         "",
    password:        "",
    confirmPassword: "",
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error,      setError]      = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading,  setIsLoading]  = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        username: formData.username,
        email:    formData.email,
        no_telp:  formData.no_telp,
        password: formData.password,
      });
      setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registrasi gagal, coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper register-wrapper">

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
              Academic Information System
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
        
          <div className="register-header">
            <div className="form-logo">
              <img src={logoTelkom} alt="Logo Telkom" className="form-logo-img" />
            </div>
          </div>

          <h2 className="form-title">Create account</h2>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-username">
                <i className="bi bi-person-fill" />&nbsp; Username
              </label>
              <div className="input-wrapper">
                <i className="bi bi-person input-icon" />
                <input
                  id="reg-username"
                  type="text"
                  name="username"
                  className="form-input"
                  placeholder="Masukkan nama lengkap"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                <i className="bi bi-envelope-fill" />&nbsp; Email
              </label>
              <div className="input-wrapper">
                <i className="bi bi-envelope input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Masukkan email pribadi"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                <i className="bi bi-telephone-fill" />&nbsp; Contact Numbers
              </label>
              <div className="input-wrapper">
                <i className="bi bi-telephone input-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  name="no_telp"
                  className="form-input"
                  placeholder="Masukkan nomor HP"
                  value={formData.no_telp}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                <i className="bi bi-lock-fill" />&nbsp; Password
              </label>
              <div className="input-wrapper">
                <i className="bi bi-lock input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input"
                  placeholder="Minimal 8 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan password"
                >
                  {showPassword ? <IoMdEyeOff size={18} /> : <IoMdEye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                <i className="bi bi-shield-lock-fill" />&nbsp; Confirm Password
              </label>
              <div className="input-wrapper">
                <i className="bi bi-shield-lock input-icon" />
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Ulangi password kamu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Tampilkan konfirmasi password"
                >
                  {showConfirmPassword ? <IoMdEyeOff size={18} /> : <IoMdEye size={18} />}
                </button>
              </div>
            </div>

            {error      && <p className="form-error">{error}</p>}
            {successMsg && <p className="form-success">{successMsg}</p>}

            <button
              type="submit"
              className="btn-register"
              disabled={isLoading}
            >
              <span>{isLoading ? "Mendaftar..." : "Register"}</span>
              {!isLoading && <i className="bi bi-person-check-fill" />}
            </button>
          </form>

          <p className="login-redirect">
            Sudah memiliki akun?&nbsp;
            <Link to="/login" className="forgot-link">Login disini</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;