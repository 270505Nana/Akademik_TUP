import React, { useState } from 'react';
import { 
  CalendarCheck, FileText, Printer, 
  Filter, Download, MoreVertical, Activity, Clock, 
  AlertCircle, ArrowRightCircle, ChevronLeft, ChevronRight,
  Eye, CheckCircle2, Menu, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarDosen from '../../components/sidebar/SidebarDosen';
import '../dashboard.css';

const StatusBadge = ({ text }) => {
  if (text === 'Belum Terbit') return <span className="badge-pill-red">{text}</span>;
  if (text === 'Dalam Proses') return <span className="badge-pill-blue">{text}</span>;
  if (text === 'Sudah Terbit') return <span className="badge-pill-green">{text}</span>;

  if (text.startsWith('Tahap')) return (
    <span className="badge-outline-orange">
      {text} <Clock size={12} />
    </span>
  );
  if (text === 'Belum registrasi') return <span className="badge-outline-red">{text}</span>;
  if (text === 'Proses Verifikasi') return <span className="badge-outline-blue">{text}</span>;
  if (text === 'Terverifikasi') return <span className="badge-outline-green">{text}</span>;

  return <span>{text}</span>;
};

const MonitoringProgress = ({ onShowToast }) => {

  const data = [
    { id: 1, name: 'Ghaza Zidane', nim: '12345678', sk: 'Belum Terbit', sidang: 'Tahap 1', yudisium: 'Tahap 1' },
    { id: 2, name: 'Ghaza Zidane', nim: '12345678', sk: 'Belum Terbit', sidang: 'Belum registrasi', yudisium: 'Belum registrasi' },
    { id: 3, name: 'Naufal Ari', nim: '12345678', sk: 'Belum Terbit', sidang: 'Proses Verifikasi', yudisium: 'Proses Verifikasi' },
    { id: 4, name: 'Tiara klimantan', nim: '12345678', sk: 'Dalam Proses', sidang: 'Terverifikasi', yudisium: 'Terverifikasi' },
    { id: 5, name: 'meisa laura', nim: '12345678', sk: 'Sudah Terbit', sidang: 'Tahap 4', yudisium: 'Tahap 4' },
  ];

  return (
    <div className="section-card">
      <div className="card-header-custom">
        <div className="title-block">
          <h6>Progress Registrasi Mahasiswa Bimbingan</h6>
        </div>
      </div>

      <div className="table-scroll-wrap">
        <table className="simta-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '46px' }}>No</th>
              <th className="text-center">Mahasiswa</th>
              <th className="text-center">Status SK</th>
              <th className="text-center">Status Registrasi Sidang</th>
              <th className="text-center">Status Registrasi Yudisium</th>
              <th className="text-center">Detail</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="text-center fw-semibold" style={{ color: 'var(--text-muted)' }}>{item.id}</td>
                <td className="text-center">
                  <div className="mahasiswa-info">
                    <div className="name">{item.name}</div>
                    <div className="nim-prodi">NIM: {item.nim}</div>
                  </div>
                </td>
                <td className="text-center"><StatusBadge text={item.sk} /></td>
                <td className="text-center"><StatusBadge text={item.sidang} /></td>
                <td className="text-center"><StatusBadge text={item.yudisium} /></td>
                <td className="text-center">
                  <button 
                    className="btn-open-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowToast(`Membuka Detail <strong>${item.name}</strong>...`, <FileText size={14} />, 'info');
                    }}
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="page-info">Menampilkan <strong>5</strong> dari <strong>128</strong></span>
        <div className="flex gap-2">
          <button className="btn-paging" onClick={() => onShowToast('Navigasi ke halaman: <strong>Sebelumnya</strong>', <ChevronLeft size={14} />, 'info')}>
            <ChevronLeft size={14} />
          </button>
          <button className="btn-paging" onClick={() => onShowToast('Navigasi ke halaman: <strong>Selanjutnya</strong>', <ChevronRight size={14} />, 'info')}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardDosen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts]           = useState([]);

  const showToast = (message, icon, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onShowToast={showToast} />
      <div id="main-content">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand">SIMTA</div>
          <div className="topbar-right">
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold">Purwanto</div>
                <div className="text-xs text-muted">Dosen Pembimbing</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-info flex items-center justify-center text-white font-bold text-xs">
                DS
              </div>
            </div>
          </div>
        </header>
        <main className="page-body">
          <div className="welcome-card">
            <h5>Halo Purwanto! 👋</h5>
            <p>Selamat datang kembali. Berikut adalah progress dari registrasi mahasiswa bimbingan anda</p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <MonitoringProgress onShowToast={showToast} />
          </div>
        </main>
        <footer className="page-footer">
          Telkom University Purwokerto &mdash; Divisi Akademik dan Sistem Informasi
        </footer>
        <div className="toast-container-custom">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div key={toast.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className={`simta-toast ${toast.type}`}>
                <span className="toast-icon">{toast.icon}</span>
                <span className="toast-msg" dangerouslySetInnerHTML={{ __html: toast.message }} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default DashboardDosen;
