import React, { useState } from 'react';
import { 
  CalendarCheck, FileText, Printer, 
  Filter, Download, MoreVertical, Activity, Clock, 
  AlertCircle, ArrowRightCircle, ChevronLeft, ChevronRight,
  Eye, CheckCircle2, Menu, Users, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarDosen from '../../components/sidebar/SidebarDosen';
import '../dashboard.css';

const StatusBadge = ({ text }) => {
  const t = text.toLowerCase();
  
  if (t === 'belum terbit') return <span className="badge-pill-red">{text}</span>;
  if (t === 'dalam proses') return <span className="badge-pill-blue">{text}</span>;
  if (t === 'sudah terbit') return <span className="badge-pill-green">{text}</span>;

  if (text.startsWith('Tahap')) return (
    <span className="badge-outline-orange">
      {text} <Clock size={12} className="inline ml-1" />
    </span>
  );
  
  if (t === 'belum registrasi') return <span className="badge-outline-red">{text}</span>;
  if (t === 'revisi dokumen') return <span className="badge-outline-red">{text}</span>;
  if (t === 'proses verifikasi') return <span className="badge-outline-blue">{text}</span>;
  if (t === 'terverifikasi') return <span className="badge-outline-green">{text}</span>;
  if (t === 'on progress') return <span className="badge-outline-dark">{text}</span>;

  return <span>{text}</span>;
};

const MonitoringProgress = ({ onShowToast }) => {

  const data = [
    { id: 1, name: 'Ghaza Zidane',     nim: '12345678',    sk: 'Dalam proses',    sidang: 'Belum registrasi', yudisium: 'Belum registrasi' },
    { id: 2, name: 'Mei sari',         nim: '12345678',    sk: 'Belum Terbit',    sidang: 'Belum registrasi', yudisium: 'Belum registrasi' },
    { id: 3, name: 'Naufal Ari',       nim: '12345678',    sk: 'Sudah Terbit',    sidang: 'Terverifikasi',    yudisium: 'Proses Verifikasi' },
    { id: 4, name: 'Tiara klimantan',  nim: '12345678',    sk: 'Sudah Terbit',    sidang: 'Terverifikasi',    yudisium: 'Revisi Dokumen' },
    { id: 5, name: 'Prajna P',         nim: '2311104016', sk: 'Sudah Terbit',    sidang: 'Terverifikasi',    yudisium: 'On Progress' },
  ];

  return (
    <div className="section-card">
      <div className="card-header-custom">
        <div className="title-block">
          <h4 className="font-bold text-xl">Progres Registrasi Mahasiswa Bimbingan</h4>
        </div>
      </div>

      <div className="table-scroll-wrap">
        <table className="simta-table">
          <thead>
            <tr>
              <th className="text-center">Mahasiswa</th>
              <th className="text-center">NIM</th>
              <th className="text-center">Status SK</th>
              <th className="text-center">Status Registrasi Sidang</th>
              <th className="text-center">status registrasi yudisum</th>
              <th className="text-center">Draft TA</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <User size={18} />
                    </div>
                    <div className="font-bold text-sm">{item.name}</div>
                  </div>
                </td>
                <td className="text-center">
                  <div className="text-sm">NIM: {item.nim}</div>
                </td>
                <td className="text-center"><StatusBadge text={item.sk} /></td>
                <td className="text-center"><StatusBadge text={item.sidang} /></td>
                <td className="text-center"><StatusBadge text={item.yudisium} /></td>
                <td className="text-center">
                  <button 
                    className="btn-open-file"
                    style={{ background: '#C0182A' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowToast(`Membuka Berkas <strong>${item.name}</strong>...`, <FileText size={14} />, 'info');
                    }}
                  >
                    Buka Berkas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="page-info">Menampilkan <strong>1</strong> dari <strong>1</strong></span>
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
