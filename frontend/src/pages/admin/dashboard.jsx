import React, { useState } from 'react';
import { 
  CalendarCheck, FileText, Printer, 
  Filter, Download, MoreVertical, Activity, Clock, 
  AlertCircle, ArrowRightCircle, ChevronLeft, ChevronRight,
  Eye, CheckCircle2, Menu, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import '../dashboard.css';

const CardAtas4 = ({ icon, label, value, sub, badge, badgeColor }) => (
  <div className="CardAtas4">
    <div className="CardAtas4-header">
      <div className="CardAtas4-icon">{icon}</div>
      {badge && (
        <span className="CardAtas4-badge" style={badgeColor ? { background: badgeColor.bg, color: badgeColor.text } : {}}>
          {badge}
        </span>
      )}
    </div>
    <div className="CardAtas4-body">
      <div className="CardAtas4-label">{label}</div>
      <div className="CardAtas4-value">{value}</div>
    </div>
    <div className="CardAtas4-footer">
      <div className="CardAtas4-divider"></div>
      <div className="CardAtas4-sub" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  </div>
);

const MonitoringProgress = ({ onShowToast }) => {

 const data = [
  { id: 1, name: 'Jeremy Cristo',    nim: '21040110',  prodi: 'S1 Informatika', progres_sidang: 'Tahap 1', percent: 50,  status: 'on-progress' },
  { id: 2, name: 'Stella',           nim: '21040160',  prodi: 'S1 Informatika', progres_sidang: 'Tahap 2', percent: 100, status: 'terverifikasi' },
  { id: 3, name: 'Dika Hutagaol',    nim: '21040110',  prodi: 'S1 Informatika', progres_sidang: 'Tahap 1', percent: 50,  status: 'on-progress' },
  { id: 4, name: 'Siti Aminah',      nim: '21040110',  prodi: 'S1 Informatika', progres_sidang: 'Tahap 1', percent: 50,  status: 'on-progress' },
  { id: 5, name: 'Budi Santoso',     nim: '21040110',  prodi: 'S1 Informatika', progres_sidang: 'Tahap 2', percent: 100, status: 'proses-verifikasi' },
  { id: 6, name: 'Prajna paramitha', nim: '231110406', prodi: 'S1 Informatika', progres_sidang: 'Tahap 2', percent: 100, status: 'terverifikasi' },
];

  return (
    <div className="section-card">
      <div className="card-header-custom">
        <div className="title-block">
          <h6>Monitoring Progres Sidang</h6>
          <p>Daftar mahasiswa yang sedang dalam proses tugas akhir.</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={() => onShowToast('Mengekspor data ke Excel… Harap tunggu.', <Download size={14} />, 'success')}>
            <Download size={14} /> Eksport
          </button>
        </div>
      </div>

      <div className="table-scroll-wrap">
       <table className="simta-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '46px' }}>No</th>
              <th className="text-center">Mahasiswa</th>
              <th className="text-center">Prodi</th>
              <th className="text-center">Progres Regist Sidang</th>
              <th className="text-center">Status Regist Sidang</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="text-center fw-semibold" style={{ color: 'var(--text-muted)' }}>{item.id}</td>
                <td className="text-center">
                  <div className="mahasiswa-info">
                    <div className="name">{item.name}</div>
                    <div className="nim-prodi">{item.nim}</div>
                  </div>
                </td>
                <td className="text-center">
                  <div className="text-gray-600 font-medium">{item.prodi}</div>
                </td>
                <td className="text-center">
                  <div className="flex flex-col items-center">
                    <div className="progres-badge">{item.progres_sidang}</div>
                    <div className="progres-bar-wrap">
                      <div
                        className="progres-bar-fill"
                        style={{
                          width: `${item.percent}%`,
                          background: (item.status === 'terverifikasi' || item.percent === 100) ? 'linear-gradient(90deg,#22C55E,#16A34A)' : undefined
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <span className={`badge-status ${item.status}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="text-center">
                  {/* <div className="flex items-center justify-center gap-1">
                    {item.status === 'terverifikasi' ? (
                      <button className="btn-detail" onClick={(e) => { e.stopPropagation(); onShowToast(`Membuka detail berkas <strong>${item.name}</strong>…`, <Eye size={12} />, 'info'); }}>
                        Detail
                      </button>
                    ) : (
                      <button className="btn-verif" onClick={(e) => { e.stopPropagation(); onShowToast(`Verifikasi berkas <strong>${item.name}</strong> berhasil diproses.`, <CheckCircle2 size={12} />, 'success'); }}>
                        Verif
                      </button>
                    )}
                  </div> */}

                  <div className="flex items-center justify-center gap-1">
                    
                      <button className="btn-detail" onClick={(e) => { e.stopPropagation(); onShowToast(`Membuka detail berkas <strong>${item.name}</strong>…`, <Eye size={12} />, 'info'); }}>
                        Detail
                      </button>
                  
                  </div>
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

const DashboardAkademik = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts]           = useState([]);

  const showToast = (message, icon, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  return (
    <>
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onShowToast={showToast} />
      <div id="main-content">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand">Beranda</div>
          <div className="topbar-right">
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold">Budiono</div>
                <div className="text-xs text-muted">Administrator</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                AD
              </div>
            </div>
          </div>
        </header>
        <main className="page-body">
          <div className="welcome-card">
            <h5>Selamat Datang Kembali, Pak Budiono! 👋</h5>
          </div>

          <div className="stat-grid mb-6">
            <CardAtas4 icon={<CalendarCheck size={24} />} label="Periode Aktif" badge="Aktif" value="Sidang Periode Genap" sub="2025/2026 Berakhir dlm 12 Hari" />
            <CardAtas4 icon={<Users size={24} />} label="Total Pendaftar Sidang" value="1000 Mahasiswa" sub="Periode Genap 2025/2026" />
            <CardAtas4 icon={<Printer size={24} />} label="Jumlah Pengajuan SK" value="45 Mahasiswa" sub="Berkas menunggu verifikasi" />
          </div>

          <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6">
            <div className="xl:col-span-9">
              <div className="deadline-card mb-4">
                <div className="dl-header">
                  <div className="dl-icon"><AlertCircle size={14} /></div>
                  <div className="dl-title">Batas Waktu</div>
                </div>
                <p className="dl-desc">Sisa <strong>2 hari</strong> verifikasi berkas pendaftaran sidang.</p>
              </div>
              <MonitoringProgress onShowToast={showToast} />
            </div>

            <div className="xl:col-span-3">
              <div className="activity-card mt-0">
                <div className="ac-header">
                  <h6><Activity size={14} className="inline mr-2" style={{ color: 'var(--primary)' }} />Aktivitas</h6>
                  <a href="#">Semua</a>
                </div>
                <div className="activity-list">
                  {[
                    { initial: 'ME', name: 'Meisari', action: 'upload Berkas Yudisium.', time: '10:00 AM' },
                    { initial: 'DP', name: 'Dosen', action: 'tambah nilai Naufal Ari.', time: '09:40 AM', color: 'linear-gradient(135deg,#667EEA,#764BA2)' },
                    { initial: 'DH', name: 'Dika', action: 'upload Berkas Sidang', time: '09:40 AM', color: 'linear-gradient(135deg,#4FACFE,#00F2FE)' },
                  ].map((act, idx) => (
                    <div className="activity-item" key={idx}>
                      <div className="act-avatar" style={act.color ? { background: act.color } : {}}>{act.initial}</div>
                      <div>
                        <div className="act-text"><strong>{act.name}</strong> {act.action}</div>
                        <div className="act-time"><Clock size={10} className="inline mr-1" /> {act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="page-footer">© 2026 SIMTA &mdash; Telkom University Purwokerto</footer>
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

export default DashboardAkademik;