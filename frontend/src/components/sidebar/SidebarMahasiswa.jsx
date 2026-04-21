import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  ChevronDown, 
  FileCheck, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

import { motion } from 'motion/react';
import './sidebar.css';

const SidebarMahasiswa = ({ 
  isOpen, 
  onClose, 
  onShowToast 
}) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuSidebar = [
    {
      label: 'Utama',
      items: [
        { label: 'Beranda', icon: <Home className="nav-icon" />, path: '/mahasiswa/dashboard' }
      ]
    },
    {
      label: 'Sidang',
      items: [
        { 
          label: 'Registrasi Sidang', 
          icon: <Calendar className="nav-icon" />, 
          subItems: ['Permohonan Penerbitan SK', 'Registrasi Sidang', 'Pembaruan SK Tugas Akhir', 'Registrasi Yudisium'] 
        }
      ]
    },
  ];

  const getSubPath = (sub) => {
    if (sub === 'Permohonan Penerbitan SK') return '/mahasiswa/pengajuan-sk';
    if (sub === 'Registrasi Sidang') return '/mahasiswa/pendaftaran-sidang';
    return '#';
  };

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
              {section.items.map((item, iIdx) => {
                const isActive = item.path === location.pathname || 
                  (item.subItems && item.subItems.some(sub => getSubPath(sub) === location.pathname));

                return (
                  <div className="nav-item-group" key={iIdx}>
                    {item.path ? (
                      <Link 
                        to={item.path}
                        className={`nav-link-main ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ) : (
                      <div 
                        className={`nav-link-main ${isActive ? 'active' : ''}`}
                        onClick={() => item.subItems && toggleMenu(item.label)}
                        aria-expanded={expandedMenus[item.label]}
                      >
                        {item.icon}
                        {item.label}
                        {item.subItems && <ChevronDown className="nav-arrow" size={14} />}
                      </div>
                    )}
                    
                    {item.subItems && (
                      <motion.div 
                        initial={false}
                        animate={{ height: expandedMenus[item.label] || isActive ? 'auto' : 0, opacity: expandedMenus[item.label] || isActive ? 1 : 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="sub-nav">
                          {item.subItems.map((sub, subIdx) => (
                            <li key={subIdx}>
                              <Link 
                                to={getSubPath(sub)}
                                className={location.pathname === getSubPath(sub) ? 'active' : ''}
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
          <div className="avatar">P</div>
          <div className="user-info">
            <div className="user-name">Prajna Paramitha</div>
            <div className="user-role">Mahasiswa</div>
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

export default SidebarMahasiswa;
