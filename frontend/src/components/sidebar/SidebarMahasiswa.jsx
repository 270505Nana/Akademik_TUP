import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import "./sidebar.css"; 

const SidebarMahasiswa = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user, logout } = useAuth();
  const { student, logoutStudentData } = useStudent();

  const namaDisplay = student?.namaLengkap || user?.username || "Mahasiswa";
  const avatarChar = namaDisplay.charAt(0).toUpperCase();

  const handleLogout = () => {
    logoutStudentData();
    logout();
    navigate("/login", { replace: true });
  };

  // Struktur Menu Dibuat Flat (Naik Pangkat)
  const menuSidebar = [
    {
      label: "Beranda",
      icon: <Home className="nav-icon" size={18} />,
      path: "/mahasiswa/dashboard",
    },
    {
      label: "PERMOHONAN SKTA",
      icon: <Calendar className="nav-icon" size={18} />,
      subItems: [
        { label: "Permohonan Penerbitan SK", path: "/mahasiswa/pengajuan-sk" },
        { label: "Pembaruan SK Tugas Akhir", path: "/mahasiswa/pembaruan-sk" }
      ],
    },
    {
      label: "SIDANG & YUDISIUM",
      icon: <Calendar className="nav-icon" size={18} />,
      subItems: [
        { label: "Registrasi Sidang", path: "/mahasiswa/pendaftaran-sidang" },
        { label: "Registrasi Yudisium", path: "/mahasiswa/pendaftaran-yudisium" },
        { label: "Unduh SKL & Transkrip", path: "/mahasiswa/unduh-berkas" }
      ],
    },
  ];

  return (
    <>
      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.45)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "32px 28px",
              maxWidth: 360, width: "90%", textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#FEF2F2", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 16px",
              }}
            >
              <LogOut size={24} color="#C0182A" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Keluar dari SIMTA?
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
              Sesi kamu akan diakhiri dan kamu perlu login kembali untuk mengakses sistem.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{ padding: "9px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 600, background: "#F3F4F6", color: "#374151", border: "none", cursor: "pointer" }}
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: "9px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700, background: "#C0182A", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Layout */}
      <aside id="sidebar" className={isOpen ? "open" : ""}>
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <span className="logo-text">SIMTA</span>
        </div>

        <nav className="sidebar-nav">
          {menuSidebar.map((item, idx) => {
            // Render menu dengan URL (Beranda)
            if (item.path) {
              return (
                <div className="nav-item-group" key={idx}>
                  <Link
                    to={item.path}
                    className={`nav-link-main ${location.pathname === item.path ? "active" : ""}`}
                    onClick={onClose}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </div>
              );
            }

            // Render Header Merah Statis + Sub-menu
            if (item.subItems) {
              return (
                <div className="nav-item-group" key={idx}>
                  <div className="nav-section-header">
                    {item.icon}
                    {item.label}
                  </div>
                  <ul className="sub-nav">
                    {item.subItems.map((sub, subIdx) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <li key={subIdx}>
                          <Link
                            to={sub.path}
                            className={isSubActive ? "active" : ""}
                            onClick={onClose}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }
            return null;
          })}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{avatarChar}</div>
          <div className="user-info">
            <div className="user-name">{namaDisplay}</div>
            <div className="user-role">
              {user?.role === "MAHASISWA" ? "Mahasiswa" : "Mahasiswa"}
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div
        id="sidebar-overlay"
        className={isOpen ? "show" : ""}
        onClick={onClose}
      />
    </>
  );
};

export default SidebarMahasiswa;