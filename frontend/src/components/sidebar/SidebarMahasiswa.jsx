import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, ChevronDown, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import "./sidebar.css";

const SidebarMahasiswa = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});
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

  const toggleMenu = (label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const menuSidebar = [
    {
      label: "Utama",
      items: [
        {
          label: "Beranda",
          icon: <Home className="nav-icon" />,
          path: "/mahasiswa/dashboard",
        },
      ],
    },
    {
      label: "SKTA",
      items: [
        {
          label: "Permohonan SKTA",
          icon: <Calendar className="nav-icon" />,
          subItems: ["Permohonan Penerbitan SK", "Pembaruan SK Tugas Akhir"],
        },
      ],
    },
    {
      label: "Sidang",
      items: [
        {
          label: "Registrasi Sidang",
          icon: <Calendar className="nav-icon" />,
          subItems: [
            "Registrasi Sidang",
            // 'Registrasi Yudisium'
          ],
        },
      ],
    },
  ];

  const getSubPath = (sub) => {
    if (sub === "Permohonan Penerbitan SK") return "/mahasiswa/pengajuan-sk";
    if (sub === "Registrasi Sidang") return "/mahasiswa/pendaftaran-sidang";
    if (sub === "Registrasi Yudisium") return "/mahasiswa/pendaftaran-yudisium";
    return "#";
  };

  return (
    <>
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "32px 28px",
              maxWidth: 360,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <LogOut size={24} color="#C0182A" />
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Keluar dari SIMTA?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Sesi kamu akan diakhiri dan kamu perlu login kembali untuk
              mengakses sistem.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "9px 24px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: "9px 24px",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "#C0182A",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <aside id="sidebar" className={isOpen ? "open" : ""}>
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <span className="logo-text">SIMTA</span>
        </div>

        <nav className="sidebar-nav">
          {menuSidebar.map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item, iIdx) => {
                const isActive =
                  item.path === location.pathname ||
                  (item.subItems &&
                    item.subItems.some(
                      (sub) => getSubPath(sub) === location.pathname,
                    ));

                return (
                  <div className="nav-item-group" key={iIdx}>
                    {item.path ? (
                      <Link
                        to={item.path}
                        className={`nav-link-main ${location.pathname === item.path ? "active" : ""}`}
                        onClick={onClose}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ) : (
                      <div
                        className={`nav-link-main ${isActive ? "active" : ""}`}
                        onClick={() => item.subItems && toggleMenu(item.label)}
                        aria-expanded={expandedMenus[item.label]}
                      >
                        {item.icon}
                        {item.label}
                        {item.subItems && (
                          <ChevronDown className="nav-arrow" size={14} />
                        )}
                      </div>
                    )}

                    {item.subItems && (
                      <motion.div
                        initial={false}
                        animate={{
                          height:
                            expandedMenus[item.label] || isActive ? "auto" : 0,
                          opacity:
                            expandedMenus[item.label] || isActive ? 1 : 0,
                        }}
                        className="overflow-hidden"
                      >
                        <ul className="sub-nav">
                          {item.subItems.map((sub, subIdx) => (
                            <li key={subIdx}>
                              <Link
                                to={getSubPath(sub)}
                                className={
                                  location.pathname === getSubPath(sub)
                                    ? "active"
                                    : ""
                                }
                                onClick={onClose}
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{avatarChar}</div>
          <div className="user-info">
            {/* Nama dari StudentContext */}
            <div className="user-name">{namaDisplay}</div>
            <div className="user-role">
              {user?.role === "STUDENT"
                ? "Mahasiswa"
                : user?.role === "LECTURER"
                  ? "Dosen"
                  : user?.role === "ACADEMIC_STAFF"
                    ? "Staf Akademik"
                    : (user?.role ?? "Mahasiswa")}
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
