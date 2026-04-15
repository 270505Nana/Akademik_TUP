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

const StatCard = ({ icon, label, value, sub, badge, badgeColor }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <div className="stat-icon">{icon}</div>
      {badge && (
        <span className="stat-badge" style={badgeColor ? { background: badgeColor.bg, color: badgeColor.text } : {}}>
          {badge}
        </span>
      )}
    </div>
    <div className="stat-body">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
    <div className="stat-footer">
      <div className="stat-divider"></div>
      <div className="stat-sub" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  </div>
);

const MonitoringTable = ({ onShowToast }) => {
  const [selectedRow, setSelectedRow] = useState(null);

  const data = [
    { id: 1,  name: 'Jeremy Cristo',           nim: '21040110', prodi: 'Teknik Informatika',  initial: 'JC', progres: 'Tahap 1',     step: '1/3', percent: 33,  status: 'revisi' },
    { id: 2,  name: 'Aulia Ahmad Ghaus Adzam', nim: '21040160', prodi: 'Software Engineering', initial: 'AA', progres: 'Lengkap',     step: '5/5', percent: 100, status: 'lengkap', color: 'linear-gradient(135deg,#667EEA,#764BA2)' },
    { id: 3,  name: 'Dika Hutagaol',           nim: '21040110', prodi: 'Sistem Informasi',    initial: 'DH', progres: 'Tahap 3',     step: '1/3', percent: 33,  status: 'revisi',  color: 'linear-gradient(135deg,#4FACFE,#00F2FE)' },
    { id: 4,  name: 'Siti Aminah',             nim: '21040110', prodi: 'Teknik Industri',     initial: 'SA', progres: 'Tahap 2',     step: '1/3', percent: 33,  status: 'belum',   color: 'linear-gradient(135deg,#F093FB,#F5576C)' },
    { id: 5,  name: 'Budi Santoso',            nim: '21040110', prodi: 'Teknologi Pangan',    initial: 'BS', progres: 'Pendaftaran', step: '1/3', percent: 20,  status: 'belum',   color: 'linear-gradient(135deg,#43E97B,#38F9D7)' },
  ];

  return (
    <div className="section-card">
      <div className="card-header-custom">
        <div className="title-block">
          <h6>Monitoring Progres Sidang</h6>
          <p>Daftar mahasiswa yang sedang dalam proses tugas akhir.</p>
        </div>
        <div className="header-actions">
          <button className="btn-filter" onClick={() => onShowToast('Panel filter akan segera tersedia.', <Filter size={14} />, 'info')}>
            <Filter size={14} /> Filter
          </button>
          <button className="btn-export" onClick={() => onShowToast('Mengekspor data ke Excel… Harap tunggu.', <Download size={14} />, 'success')}>
            <Download size={14} /> Ekspor
          </button>
        </div>
      </div>

      <div className="table-scroll-wrap">
        <table className="simta-table">
          <thead>
            <tr>
              <th style={{ width: '46px' }}>No</th>
              <th>Mahasiswa</th>
              <th>Progres</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className={selectedRow === item.id ? 'selected' : ''}
                onClick={() => setSelectedRow(item.id === selectedRow ? null : item.id)}
              >
                <td className="text-center fw-semibold" style={{ color: 'var(--text-muted)' }}>{item.id}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar-sm" style={item.color ? { background: item.color } : {}}>{item.initial}</div>
                    <div className="mahasiswa-info">
                      <div className="name">{item.name}</div>
                      <div className="nim-prodi">{item.nim}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="progres-badge">{item.progres} ({item.step})</div>
                  <div className="progres-bar-wrap">
                    <div
                      className="progres-bar-fill"
                      style={{
                        width: `${item.percent}%`,
                        background: item.status === 'lengkap' ? 'linear-gradient(90deg,#22C55E,#16A34A)' : undefined
                      }}
                    />
                  </div>
                </td>
                <td>
                  <span className={`badge-status ${item.status}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {item.status === 'lengkap' ? (
                      <button className="btn-detail" onClick={(e) => { e.stopPropagation(); onShowToast(`Membuka detail berkas <strong>${item.name}</strong>…`, <Eye size={12} />, 'info'); }}>
                        Detail
                      </button>
                    ) : (
                      <button className="btn-verif" onClick={(e) => { e.stopPropagation(); onShowToast(`Verifikasi berkas <strong>${item.name}</strong> berhasil diproses.`, <CheckCircle2 size={12} />, 'success'); }}>
                        Verif
                      </button>
                    )}
                  </div>
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
      {/* Sidebar */}
      <SidebarAdmin
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={showToast}
      />

      <div id="main-content">

        <main className="page-body">
          {/* Welcome */}
          <div className="welcome-card">
            <h5>Selamat Datang Kembali, Pak Budiono! 👋</h5>
            <p>Sistem terakhir disinkronkan pada pukul 09:15 hari ini.</p>
          </div>

          <div className="stat-grid mb-6">
            <StatCard
              icon={<CalendarCheck size={24} />}
              label="Periode Aktif"
              badge="Aktif"
              value="Sidang Periode Ganjil"
              sub="2024/2025 &nbsp;&nbsp; Berakhir dlm 12 Hari"
            />
            <StatCard
              icon={<Users size={24} />}
              label="Total Pendaftar"
              value="12"
              sub="Berkas menunggu tinjauan"
            />
            <StatCard
              icon={<FileText size={24} />}
              label="Perlu Verifikasi"
              value="128"
              sub="Mahasiswa TA"
            />
            <StatCard
              icon={<Printer size={24} />}
              label="SK Siap Cetak"
              value="45"
              sub="Dokumen yudisium siap"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8">
              <MonitoringTable onShowToast={showToast} />
            </div>

            <div className="xl:col-span-4">
              {/* akti baru */}
              <div className="activity-card">
                <div className="ac-header">
                  <h6><Activity size={14} className="inline mr-2" style={{ color: 'var(--primary)' }} />Aktivitas</h6>
                  <a href="#">Semua</a>
                </div>

                {/* data statis, belum aku konekin sama be */}
                <div className="activity-list">
                  {[
                    { initial: 'ME', name: 'Meisari',      action: 'upload Berkas Yudisium.',          time: '10:00 AM' },
                    { initial: 'DP', name: 'Dosen', action: 'tambah nilai Naufal Ari.',     time: '09:40 AM', color: 'linear-gradient(135deg,#667EEA,#764BA2)' },
                    { initial: 'DH', name: 'Dika', action: 'upload Berkas Sidang',            time: '09:40 AM', color: 'linear-gradient(135deg,#4FACFE,#00F2FE)' },
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

              <div className="deadline-card">
                <div className="dl-header">
                  <div className="dl-icon"><AlertCircle size={14} /></div>
                  <div className="dl-title">Batas Waktu</div>
                </div>
                <p className="dl-desc">
                  Sisa <strong>2 hari</strong> verifikasi.
                </p>
                <button className="btn-tindak" onClick={() => showToast('Mengarahkan ke halaman verifikasi…', <ArrowRightCircle size={14} />, 'warning')}>
                  Tindak Lanjuti
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="page-footer">
          © 2026 SIMTA &mdash; Telkom University Purwokerto
        </footer>

        <div className="toast-container-custom">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`simta-toast ${toast.type}`}
              >
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
