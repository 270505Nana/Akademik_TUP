import React, { useState } from 'react';
import '../sidebar/sidebar.css';
import logo from '../../assets/logo-simta.png'; 

const SidebarMahasiswa = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('Registrasi Sidang (Sub)'); 
  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
  };

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-content">
          <span className="sidebar-logo-text">SIMTA</span>
          <img src={logo} alt="Logo" className="sidebar-logo-img" />
        </div>
      </div>

      <nav className="sidebar-nav-menu">

        <div 
          className={`sidebar-nav-item ${activeMenu === 'Beranda' ? 'active' : ''}`}
          onClick={() => handleMenuClick('Beranda')}
        >
          <i className="bi bi-house-door"></i> <span>Beranda</span>
        </div>
        
        <div className="sidebar-nav-dropdown">
          <div 
            className={`sidebar-nav-item sidebar-dropdown-toggle ${activeMenu.includes('Registrasi') ? 'parent-active' : ''}`} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <i className="bi bi-people-fill"></i> <span>Registrasi Sidang</span>
            <i className={`bi ${isDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-auto`}></i>
          </div>
          
          {isDropdownOpen && (
            <div className="sidebar-dropdown-content">
              <div 
                className={`sub-item ${activeMenu === 'SK' ? 'active' : ''}`}
                onClick={() => handleMenuClick('SK')}
              >
                Permohonan penerbitan SK
              </div>
              
              <div 
                className={`sub-item ${activeMenu === 'Registrasi Sidang (Sub)' ? 'active' : ''}`}
                onClick={() => handleMenuClick('Registrasi Sidang (Sub)')}
              >
                Registrasi Sidang
              </div>

              <div 
                className={`sub-item ${activeMenu === 'Pembaruan' ? 'active' : ''}`}
                onClick={() => handleMenuClick('Pembaruan')}
              >
                Pembaruan SK Tugas Akhir
              </div>

              <div 
                className={`sub-item ${activeMenu === 'Yudisium' ? 'active' : ''}`}
                onClick={() => handleMenuClick('Yudisium')}
              >
                Registrasi Yudisium
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="sidebar-user-footer">
        <div className="sidebar-user-profile">
          <i className="bi bi-person-circle sidebar-profile-icon"></i>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Meisari Mantiatini</span>
            <span className="sidebar-user-id">NIP. 198205122010121003</span>
          </div>
        </div>
        <button className="sidebar-btn-logout">
          <i className="bi bi-box-arrow-right"></i> <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarMahasiswa;