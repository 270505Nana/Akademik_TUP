import React, { useState } from 'react';
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

const SidebarAdmin = ({ 
  isOpen, 
  onClose, 
  onShowToast 
}) => {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const navSections = [
    {
      label: 'Utama',
      items: [
        { label: 'Beranda', icon: <Home className="nav-icon" />, active: true }
      ]
    },
    {
      label: 'Sidang',
      items: [
        { 
          label: 'Manajemen Sidang', 
          icon: <Calendar className="nav-icon" />, 
          subItems: ['Atur Periode', 'Atur Persyaratan', 'Penjadwalan'] 
        }
      ]
    },
    {
      label: 'Reposi Data',
      items: [
        { 
          label: 'Verifikasi Data', 
          icon: <FileCheck className="nav-icon" />, 
          subItems: ['Monitoring Progres', 'Verifikasi Berkas', 'Ekspor Data'] 
        },
        { 
          label: 'Layanan SK', 
          icon: <Users className="nav-icon" />, 
          subItems: ['Permohonan SK', 'Upload SK'] 
        },
        { 
          label: 'Manajemen Sidang', 
          icon: <Settings className="nav-icon" />, 
          subItems: ['Kirim Reminder'] 
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
          {navSections.map((section, sIdx) => (
            <React.Fragment key={sIdx}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item, iIdx) => (
                <div className="nav-item-group" key={iIdx}>
                  <div 
                    className={`nav-link-main ${item.active ? 'active' : ''}`}
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
                        {item.subItems.map((sub, subIdx) => (
                          <li key={subIdx}><a href="#">{sub}</a></li>
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
