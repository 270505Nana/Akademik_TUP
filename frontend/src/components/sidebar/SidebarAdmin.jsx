import React, { useState, useEffect } from 'react';
import { Home, Calendar, ChevronDown, FileCheck, Users, Settings, LogOut, FileText, Database, Layout } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import '../../components/sidebar/sidebar.css';

const SidebarAdmin = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [expandedMenus, setExpandedMenus] = useState({
    'Manajemen Sidang': false,
    'Verifikasi Berkas': false,
    'Manajemen Data Akademik': false,
    'Layanan SK TA & SKL': true,
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    menuSidebar.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some(sub => location.pathname === sub.path);
          if (hasActiveSub) {
            setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const menuSidebar = [ 
    {
      label: 'Utama',
      items: [
        { label: 'Beranda', icon: <Home className="nav-icon" />, path: '/akademik/dashboard' }
      ]
    },
    {
      label: 'Pengaturan Periode',
      items: [
        { label: 'Kelola Periode Sidang & Yudisium', icon: <Calendar className="nav-icon" />, path: '/akademik/atur-periode' }
      ]
    },
    {
      label: 'Kegiatan Sidang',
      items: [
        { 
          label: 'Manajemen Sidang', 
          icon: <Layout className="nav-icon" />, 
          subItems: [
            { label: 'Penjadwalan Sidang', path: '/akademik/penjadwalan' },
            { label: 'Atur Persyaratan Berkas', path: '/akademik/atur-berkas' }
          ]
        }
      ]
    },
    {
      label: 'Proses Verifikasi',
      items: [
        { 
          label: 'Verifikasi Berkas', 
          icon: <FileCheck className="nav-icon" />, 
          subItems: [
            { label: 'Verifikasi Sidang', path: '/akademik/verifikasi-sidang' },
            { label: 'Verifikasi Yudisium', path: '/akademik/verifikasi-yudisium' }
          ] 
        }
      ]
    },
    {
      label: 'Data Akademik',
      items: [
        { 
          label: 'Manajemen Data Akademik', 
          icon: <Database className="nav-icon" />, 
          subItems: [
            { label: 'Manajemen Data Dosen', path: '/akademik/data-dosen' },
            { label: 'Manajemen Data KK', path: '/akademik/data-kk' }
          ] 
        }
      ]
    },
    {
      label: 'Layanan Mahasiswa',
      items: [
        { 
          label: 'Layanan SK & SKL', 
          icon: <FileText className="nav-icon" />, 
          subItems: [
            { label: 'Permohonan SK TA', path: '/akademik/permohonan-sk' },
            { label: 'Upload SKL & transkrip nilai', path: '/akademik/upload-skl' }
          ] 
        }
      ]
    }
  ];

  return (
    <>
      {/*  MODAL KONFIRMASI LOGOUT  */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', 
          inset: 0, 
          zIndex: 9999,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', 
            borderRadius: 16, 
            padding: '32px 28px',
            maxWidth: 360, 
            width: '90%', 
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{
              width: 56, 
              height: 56, 
              borderRadius: '50%',
              background: '#FEF2F2', 
              display: 'flex',
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <LogOut size={24} color="#C0182A" />
            </div>
            
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#111827', 
              marginBottom: 8 
            }}>
              Keluar dari SIMTA?
            </h3>
            
            <p style={{ 
              fontSize: 13, 
              color: '#6B7280', 
              marginBottom: 24, 
              lineHeight: 1.6 
            }}>
              Sesi kamu akan diakhiri dan kamu perlu login kembali untuk mengakses sistem.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={cancelLogout}
                style={{
                  padding: '9px 24px', 
                  borderRadius: 9999, 
                  fontSize: 13,
                  fontWeight: 600, 
                  background: '#F3F4F6',
                  color: '#374151', 
                  border: 'none', 
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  padding: '9px 24px', 
                  borderRadius: 9999, 
                  fontSize: 13,
                  fontWeight: 700, 
                  background: '#C0182A',
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer',
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  SIDEBAR   */}
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
                      <ChevronDown className="nav-arrow" size={14} />
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
                            <Link 
                              to={sub.path} 
                              className={location.pathname === sub.path ? 'active-sub' : ''}
                              onClick={onClose}
                            >
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
          <div className="avatar">B</div>
          <div className="user-info">
            <div className="user-name">Administrator</div>
            <div className="user-role">Akademik Staff</div>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Keluar dari sistem"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div id="sidebar-overlay" className={isOpen ? 'show' : ''} onClick={onClose} />
    </>
  );
};

export default SidebarAdmin;