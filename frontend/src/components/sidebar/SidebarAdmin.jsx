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
        { label: 'Kelola Periode Sidang',   path: '/akademik/atur-periode/sidang'   },
        { label: 'Kelola Periode Yudisium', path: '/akademik/atur-periode/yudisium' },
      ]
    },
    {
      label: 'Manajemen Akademik',
      icon: <Database size={13} />,
      items: [
        { label: 'Manajemen Data Akademik',      path: '/akademik/data-dosen'  },
        { label: 'Manajemen Persyaratan Berkas', path: '/akademik/atur-berkas' }
      ]
    },
    {
      label: 'Layanan Akhir Studi',
      icon: <FileCheck size={13} />,
      items: [
        { label: 'Administrasi Sidang',   path: '/akademik/registrasi-sidang-all' },
        { label: 'Penjadwalan Sidang',    path: '/akademik/penjadwalan-sidang'    }, 
        { label: 'Administrasi Yudisium', path: '/akademik/verifikasi-yudisium'   }
      ]
    },
    {
      label: 'Layanan SK & SKL',
      icon: <FileText size={13} />,
      items: [
        { label: 'Permohonan SK TA', path: '/akademik/permohonan-sk'    },
        { label: 'Upload SKL',       path: '/akademik/upload-skl'       },
        { label: 'Upload Transkrip', path: '/akademik/upload-transkrip' },
      ]
    }
  ];

  const handleLogout    = ()  => setShowLogoutConfirm(true);
  const confirmLogout   = ()  => { setShowLogoutConfirm(false); logout(); navigate('/login', { replace: true }); };
  const cancelLogout    = ()  => setShowLogoutConfirm(false);

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

      <aside id="sidebar" className={isOpen ? 'open' : ''} style={{ display: 'flex', flexDirection: 'column', width: '220px' }}>
        
        <div className="sidebar-logo" style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
          <div className="logo-icon" style={{ background: '#C0182A', color: 'white', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>S</div>
          <span className="logo-text" style={{ color: '#C0182A', fontWeight: 800, fontSize: '15px', marginLeft: '8px', letterSpacing: '1px' }}>SIMTA</span>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', paddingBottom: '12px' }}>
          {menuSidebar.map((section, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '12px' }}>
              
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '10px', fontWeight: 700, color: '#C0182A', textTransform: 'uppercase',
                letterSpacing: '0.03em', marginBottom: '4px', padding: '0 16px'
              }}>
                {section.icon}
                <span>{section.label}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {section.items.map((item, iIdx) => (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => isActive ? 'sidebar-sub-link active' : 'sidebar-sub-link'}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

            </div>
          ))}
        </nav>

        <div className="sidebar-user" style={{ borderTop: '1px solid #F1F5F9', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#C0182A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>A</div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1E293B' }}>Administrator</div>
              <div style={{ fontSize: '9px', color: '#64748B' }}>Akademik Staff</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }} title="Keluar">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <div id="sidebar-overlay" className={isOpen ? 'show' : ''} onClick={onClose} />

      <style>{`
        /* Menyembunyikan scrollbar di area navigasi menu */
        .sidebar-nav {
          -ms-overflow-style: none;  /* IE dan Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .sidebar-nav::-webkit-scrollbar {
          display: none; /* Chrome, Safari, dan Opera */
        }

        .sidebar-sub-link {
          display: block;
          padding: 6px 16px 6px 36px; /* Padding direduksi agar lebih padat */
          text-decoration: none;
          font-size: 11.5px; /* Font diperkecil lagi */
          font-weight: 500;
          color: #475569;
          background-color: transparent;
          border-right: 2px solid transparent; 
          transition: all 0.2s ease-in-out;
        }
        
        .sidebar-sub-link:hover:not(.active) {
          color: #C0182A;
          background-color: #F8FAFC;
        }

        .sidebar-sub-link.active {
          font-weight: 600;
          color: #C0182A;
          background-color: #FEF2F2;
          border-right: 2px solid #C0182A;
        }

        .logout-btn-hover {
          color: #94A3B8;
        }
        
        .logout-btn-hover:hover {
          color: #C0182A;
        }
        
        /* Menyesuaikan lebar di desktop */
        @media (min-width: 992px) {
          #sidebar {
            width: 220px !important; 
          }
        }
      `}</style>
    </>
  );
};

export default SidebarAdmin;