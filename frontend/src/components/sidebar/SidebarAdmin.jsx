import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  ChevronDown, 
  FileCheck, 
  Users, 
  Settings, 
  LogOut,
  FileText,
  Database,
  Layout
} from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import '../../components/sidebar/sidebar.css';

const SidebarAdmin = ({ 
  isOpen, 
  onClose, 
  onShowToast 
}) => {
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState({
    'Manajemen Sidang': false,
    'Verifikasi Berkas': false,
    'Manajemen Data Akademik': false,
    'Layanan SK & SKL': false
  });

  // Auto expand menu if sub-item is active
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
            { label: 'Atur Persyaratan Berkas', path: '/akademik/atur-persyaratan' }
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
      label: 'Master Data',
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
            { label: 'Upload SKL & Transkrip Nilai', path: '/akademik/upload-skl' }
          ] 
        }
      ]
    }
  ];

  return (
    <>
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
                  <div 
                    className={`nav-link-main ${location.pathname === item.path || (item.subItems && item.subItems.some(sub => location.pathname === sub.path)) ? 'active' : ''}`}
                    onClick={() => item.subItems && toggleMenu(item.label)}
                    aria-expanded={expandedMenus[item.label]}
                  >
                    {item.icon}
                    {item.label}
                    {item.subItems && <ChevronDown className="nav-arrow" size={14} />}
                  </div>
                  
                  {item.subItems && (
                    <motion.div 
                      initial={false}
                      animate={{ height: expandedMenus[item.label] ? 'auto' : 0, opacity: expandedMenus[item.label] ? 1 : 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="sub-nav">
                        {item.subItems.map((sub, subIdx) => {
                          const isActiveSub = location.pathname === sub.path;
                          return (
                            <li key={subIdx}>
                              <Link 
                                to={sub.path} 
                                className={isActiveSub ? 'active-sub' : ''}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
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
            <div className="user-name">Budiono</div>
            <div className="user-role">Administrator</div>
          </div>
          <button 
            className="logout-btn" 
            onClick={() => onShowToast('Anda telah keluar dari sistem.', <LogOut size={18} />, 'warning')}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <div 
        id="sidebar-overlay" 
        className={isOpen ? 'show' : ''} 
        onClick={onClose}
      />
    </>
  );
};

export default SidebarAdmin;
