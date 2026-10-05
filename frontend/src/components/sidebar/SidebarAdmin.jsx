import React, { useState } from 'react';
import { Home, Calendar, Database, FileCheck, FileText, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../components/sidebar/sidebar.css';

const SidebarAdmin = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuSidebar = [
  {
    label: 'Utama',
    icon: <Home size={13} />,
    items: [
      { label: 'Beranda', path: '/akademik/dashboard' }
    ]
  },
  {
    label: 'Kelola Periode',
    icon: <Calendar size={13} />,
    items: [
      { label: 'Kelola Periode Sidang', path: '/akademik/atur-periode/sidang' },
      { label: 'Kelola Periode Yudisium', path: '/akademik/atur-periode/yudisium' },
    ]
  },
  {
    label: 'Manajemen Akademik',
    icon: <Database size={13} />,
    items: [
      { label: 'Manajemen Data Dosen', path: '/akademik/data-dosen' },
      { label: 'Manajemen Data Pusat Informasi', path: '/akademik/pusat-informasi' },
      { label: 'Manajemen Persyaratan Berkas', path: '/akademik/atur-berkas' }
    ]
  },
  {
    label: 'Layanan Akhir Studi',
    icon: <FileCheck size={13} />,
    items: [
      { label: 'Administrasi Sidang', path: '/akademik/registrasi-sidang-all' },
      { label: 'Penjadwalan Sidang', path: '/akademik/penjadwalan-sidang' },
      { label: 'Administrasi Yudisium', path: '/akademik/verifikasi-yudisium' }
    ]
  },
  {
    label: 'Layanan SK & SKL',
    icon: <FileText size={13} />,
    items: [
      { label: 'Permohonan SK TA', path: '/akademik/permohonan-sk' },
      { label: 'Upload SKL', path: '/akademik/upload-skl' },
      { label: 'Upload Transkrip', path: '/akademik/upload-transkrip' },
    ]
  }
];

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => { setShowLogoutConfirm(false); logout(); navigate('/login', { replace: true }); };
  const cancelLogout = () => setShowLogoutConfirm(false);

  return (
    <>
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: '20px', maxWidth: 300, width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <LogOut size={18} color="#C0182A" />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>Keluar dari SIMTA?</h3>
            <p style={{ fontSize: 11.5, color: '#6B7280', margin: '0 0 16px 0', lineHeight: 1.4 }}>Sesi kamu akan diakhiri dan kamu perlu login kembali.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={cancelLogout} style={{ padding: '6px 16px', borderRadius: 9999, fontSize: 11.5, fontWeight: 600, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer' }}>Batal</button>
              <button onClick={confirmLogout} style={{ padding: '6px 16px', borderRadius: 9999, fontSize: 11.5, fontWeight: 700, background: '#C0182A', color: '#fff', border: 'none', cursor: 'pointer' }}>Ya, Keluar</button>
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
            <div key={sIdx} className="nav-item-group">
              
              <div className="nav-section-header">
                <span className="nav-icon">{section.icon}</span>
                <span>{section.label}</span>
              </div>

              <ul className="sub-nav" style={{ margin: 0, padding: 0 }}>
                {section.items.map((item, iIdx) => (
                  <li key={iIdx}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Administrator</span>
            <span className="user-role">Akademik Staff</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Keluar">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div id="sidebar-overlay" className={isOpen ? 'show' : ''} onClick={onClose} />
    </>
  );
};

export default SidebarAdmin;