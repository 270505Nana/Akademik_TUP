import React, { useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  FilePlus2,
  ClipboardList,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import './sidebar.css';

// Sidebar untuk role Dosen
const SidebarDosen = ({ isOpen, onClose }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, profile, logout } = useAuth();
  const namaDisplay  = profile?.name || user?.name || user?.username || 'Dosen';
  const avatarChar   = (namaDisplay.trim().charAt(0) || 'D').toUpperCase();
  const roleDisplay  = user?.role === 'DOSEN' ? 'Dosen' : (user?.role || 'Dosen');
  const fotoProfil   = profile?.avatarUrl || profile?.avatar || profile?.foto || null;
  const isKetuaKK    = profile?.isKetuaKK ?? false;

  const [expandedMenus, setExpandedMenus]         = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout  = () => setShowLogoutConfirm(true);
  const confirmLogout = () => { setShowLogoutConfirm(false); logout(); navigate('/login', { replace: true }); };
  const cancelLogout  = () => setShowLogoutConfirm(false);

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Menu "Penjadwalan Sidang" hanya ditampilkan jika dosen adalah Ketua KK,
  // berdasarkan data profil fresh yang di-fetch dari BE saat halaman dimuat.
  const sidangItems = [
    { label: 'Jadwal & Nilai Sidang', icon: <Calendar className="nav-icon" />, path: '/dosen/jadwal-nilai-sidang' },
    ...(isKetuaKK ? [{ label: 'Penjadwalan Sidang', icon: <ClipboardList className="nav-icon" />, path: '/dosen/penjadwalan-sidang' }] : []),
  ];

  const menuSidebar = [
    {
      label: 'Utama',
      items: [
        { label: 'Beranda', icon: <Home className="nav-icon" />, path: '/dosen/dashboard' },
      ],
    },
    {
      label: 'Tugas Akhir',
      items: [
        { label: 'Registrasi Tugas Akhir TUP', icon: <FilePlus2 className="nav-icon" />, path: '/dosen/registrasi-ta-tup' },
        { label: 'Mahasiswa Bimbingan',         icon: <Users className="nav-icon" />,    path: '/dosen/mahasiswa-bimbingan' },
      ],
    },
    {
      label: 'Sidang',
      items: sidangItems,
    },
  ];

  return (
    <>
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            maxWidth: 360, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#FEF2F2', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <LogOut size={24} color="#C0182A" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Keluar dari SIMTA?
            </h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
              Sesi Anda akan diakhiri dan Anda perlu login kembali untuk mengakses sistem.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={cancelLogout}
                style={{ padding: '9px 24px', borderRadius: 9999, fontSize: 13, fontWeight: 600, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                style={{ padding: '9px 24px', borderRadius: 9999, fontSize: 13, fontWeight: 700, background: '#C0182A', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <aside id="sidebar" className={isOpen ? 'open' : ''}>
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <span className="logo-text">SIMTA</span>
        </div>

        <nav className="sidebar-nav">
          {menuSidebar.map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item, iIdx) => (
                <div className="nav-item-group" key={iIdx}>
                  {item.subItems ? (
                    <div
                      className={`nav-link-main ${item.subItems.some(sub => location.pathname === sub.path) ? 'active' : ''}`}
                      onClick={() => toggleMenu(item.label)}
                    >
                      {item.icon}
                      {item.label}
                      <ChevronDown className="nav-arrow" size={14} style={{ transform: expandedMenus[item.label] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={`nav-link-main ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )}

                  {item.subItems && (
                    <motion.div
                      initial={false}
                      animate={{ height: expandedMenus[item.label] ? 'auto' : 0, opacity: expandedMenus[item.label] ? 1 : 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="sub-nav">
                        {item.subItems.map((sub, subIdx) => (
                          <li key={subIdx}>
                            <Link to={sub.path} className={location.pathname === sub.path ? 'active-sub' : ''} onClick={onClose}>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">
            {fotoProfil ? (
              <img
                src={fotoProfil}
                alt={namaDisplay}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              avatarChar
            )}
          </div>
          <div className="user-info">
            <div className="user-name" title={namaDisplay}>{namaDisplay}</div>
            <div className="user-role">{roleDisplay}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Keluar dari sistem">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div id="sidebar-overlay" className={isOpen ? 'show' : ''} onClick={onClose} />
    </>
  );
};

export default SidebarDosen;
