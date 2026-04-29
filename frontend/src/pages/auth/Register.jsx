import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

import bgLogin    from "../../assets/bg-login.png";
import logoSimta  from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";

import { registerUser } from "../../service/api";
import CustomAlert from "../../components/common/CustomAlert";
import "./Auth.css";

// Validasi special karakter
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

function validate(formData) {
  const { username, email, no_telp, password, confirmPassword } = formData;

  if (!username.trim())       return { type: "error", msg: "Username tidak boleh kosong." };
  if (!email.trim())          return { type: "error", msg: "Email tidak boleh kosong." };
  if (!no_telp.trim())        return { type: "error", msg: "Nomor HP tidak boleh kosong." };
  if (!password)              return { type: "error", msg: "Password tidak boleh kosong." };
  if (!confirmPassword)       return { type: "error", msg: "Konfirmasi password tidak boleh kosong." };

  if (password.length < 8)
    return { type: "warning", msg: "Password minimal 8 karakter." };

  if (!SPECIAL_CHAR_REGEX.test(password))
    return { type: "warning", msg: "Password harus mengandung minimal 1 karakter khusus (!@#$%^&* dst)." };

  if (password !== confirmPassword)
    return { type: "error", msg: "Password dan Konfirmasi Password tidak cocok." };

  return null; 
}

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
  const [alert,      setAlert]      = useState(null); 
  const [isLoading,  setIsLoading]  = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (alert) setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    const validationError = validate(formData);
    if (validationError) {
      setAlert({ type: validationError.type, msg: validationError.msg });
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        username:        formData.username,
        email:           formData.email,
        no_telp:         formData.no_telp,        
        password:        formData.password,
        confirmPassword: formData.confirmPassword, 
      });

      navigate("/login", {
        state: {
          alert: {
            type: "success",
            msg: "Berhasil register! Silahkan Login.",
          },
        },
        replace: true,
      });

    } catch (err) {
      const msg = err.response?.data?.message || "Registrasi gagal, coba lagi.";
      setAlert({ type: "error", msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper register-wrapper">

      <div className="left-panel">
        <img 
            src={bgLogin} 
            alt="Background" 
            className="bg-image" 
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2029&auto=format&fit=crop"; }}
        />
        <div className="left-overlay" />
        <div className="left-content">
          <div className="brand-logo">
            <img 
                src={logoSimta} 
                alt="Logo SIMTA" 
                className="logo-img" 
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }}
            />
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
              <img 
                src={logoTelkom} 
                alt="Logo Telkom" 
                className="form-logo-img" 
                onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/id/thumb/0/03/Logo_Telkom_University.png/1200px-Logo_Telkom_University.png"; }}
              />
            </div>
          </div>

          <h2 className="form-title">Create account</h2>

          {alert && (
            <CustomAlert
              type={alert.type}
              message={alert.msg}
            />
          )}

          <form onSubmit={handleSubmit} noValidate>

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
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                <i className="bi bi-telephone-fill" />&nbsp; Nomor Handphone
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
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                <i className="bi bi-lock-fill" />&nbsp; Password
              </label>
              <p style={{ fontSize: "0.75rem", color: "#9e9e9e", marginBottom: 6 }}>
                Min. 8 karakter &amp; mengandung karakter khusus (!@#$%^&amp;*)
              </p>
              <div className="input-wrapper">
                <i className="bi bi-lock input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input"
                  placeholder="Minimal 8 karakter + karakter khusus"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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