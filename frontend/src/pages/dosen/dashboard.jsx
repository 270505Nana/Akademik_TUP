import React, { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, ClipboardEdit, CalendarDays, Clock, MapPin, AlertCircle, Menu, HelpCircle, Bell, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import { useAuth } from '../../context/AuthContext';
import { getDosenDashboard } from '../../service/api';
import '../dashboard.css';
import '../../components/dosen/dashboard/dashboard.css';

const PERAN_CLASS = {
  'Penguji 1': 'badge-penguji',
  'Penguji 2': 'badge-penguji',
  'Pembimbing 1': 'badge-pembimbing',
  'Pembimbing 2': 'badge-pembimbing',
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const formatJam = (jam) => {
  if (!jam || jam === '-') return '-';
  const formattedJam = jam.replace('.', ':');
  return `Pukul ${formattedJam} WIB`;
};

const StatIcon = ({ tipe }) => {
  const color = '#C0182A';
  if (tipe === 'users') return <Users size={26} color={color} />;
  if (tipe === 'calendar') return <Calendar size={26} color={color} />;
  if (tipe === 'edit') return <ClipboardEdit size={26} color={color} />;
  return null;
};

const StatCards = ({ data, loading, error, onRetry }) => {
  const statistik = [
    {
      label: 'Total Mahasiswa Bimbingan',
      nilai: data?.totalMahasiswaBimbingan ?? 0,
      icon: 'users',
    },
    {
      label: 'Mahasiswa yang Perlu Diuji',
      nilai: data?.totalMahasiswaSiapSidang ?? 0,
      icon: 'calendar',
    },
    {
      label: 'Nilai yang Belum Diinput',
      nilai: data?.totalNilaiBelumDiinput ?? 0,
      icon: 'edit',
    },
  ];

  return (
    <div className="stat-grid">
      {statistik.map((item, idx) => (
        <div className="CardAtas4" key={idx}>
          <div className="CardAtas4-header">
            <div className="CardAtas4-icon-wrap">
              <StatIcon tipe={item.icon} />
            </div>
          </div>
          <div className="CardAtas4-label">{item.label}</div>
          <div className="CardAtas4-value">
            {loading ? (
              <Loader size={20} color="#C0182A" className="spin-icon" />
            ) : error ? (
              <button
                type="button"
                onClick={onRetry}
                title="Muat ulang"
                className="stat-retry-btn"
              >
                <AlertCircle size={14} />
                Coba lagi
              </button>
            ) : (
              item.nilai
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Menampilkan jadwal sidang terdekat yang melibatkan dosen
const JadwalSidangSection = ({ jadwalSidang = [], loading, error, onRetry, onNavigateAll }) => (
  <div className="section-card section-flex">
    <div className="card-header-custom" style={{ alignItems: 'center' }}>
      <div className="card-header-title">
        <CalendarDays size={18} color="#C0182A" />
        <span className="card-header-text">Jadwal Sidang Terdekat</span>
      </div>
      <button type="button" onClick={onNavigateAll} className="link-btn">
        Lihat Semua
      </button>
    </div>

    <div className="list-body">
      {loading ? (
        <div className="loading-wrap">
          <Loader size={22} color="#C0182A" className="spin-icon" />
        </div>
      ) : error ? (
        <div className="error-block">
          <AlertCircle size={28} color="#C0182A" className="error-icon-large" />
          <div className="error-text">
            Gagal memuat jadwal sidang.
          </div>
        </div>
      ) : jadwalSidang.length === 0 ? (
        <div className="empty-state">
          Belum ada jadwal sidang terdekat.
        </div>
      ) : (
        jadwalSidang.map((item, idx) => {
          const peran = item.position || item.peran || 'Penguji';
          const peranClass = PERAN_CLASS[peran] || 'badge-default';
          const isUrgent = isToday(item.tglSidang);
          const isLast = idx === jadwalSidang.length - 1;

          const itemClassName = [
            'jadwal-item',
            !isLast ? 'has-border-bottom' : '',
            idx === 0 ? 'is-first' : '',
            isUrgent ? 'jadwal-item--urgent' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={item.id || idx} className={itemClassName}>
              <div className="jadwal-item-head">
                <div>
                  <div className="jadwal-item-name">{item.name || item.nama}</div>
                  <div className="jadwal-item-sub">{item.nim} &bull; {item.studyProgram || item.prodi}</div>
                </div>
                <div className="jadwal-badges">
                  {isUrgent && (
                    <span className="badge badge-urgent">
                      Hari Ini
                    </span>
                  )}
                  <span className={`badge ${peranClass}`}>
                    {peran}
                  </span>
                </div>
              </div>
              <div className="jadwal-item-details">
                <div className="detail-row detail-row--highlight">
                  <CalendarDays size={13} />
                  {item.hari}
                </div>
                <div className="detail-row">
                  <Clock size={13} />
                  {formatJam(item.jam)}
                </div>
                <div className="detail-row">
                  <MapPin size={13} />
                  {item.ruangan}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// Menampilkan status input nilai sidang beserta reminder batas waktu
const StatusInputNilaiSection = ({ onShowToast, onInputNilai, inputNilaiList = [] }) => (
  <div className="section-card section-flex">
    <div className="card-header-custom">
      <div className="card-header-title">
        <ClipboardEdit size={18} color="#C0182A" />
        <span className="card-header-text">Status Input Nilai Sidang</span>
      </div>
    </div>

    <div className="nilai-body">
      <div className="warning-banner">
        <AlertCircle size={16} color="#D97706" className="warning-icon" />
        <div>
          <div className="warning-title">Batas Waktu Penginputan</div>
          <div className="warning-desc">
            Nilai sidang wajib diinputkan maksimal 24 jam setelah pelaksanaan sidang.
          </div>
        </div>
      </div>

      {/* TODO: BE belum menyediakan field untuk status input nilai sidang */}
      {inputNilaiList.length === 0 ? (
        <div className="empty-state">
          Belum ada data nilai yang perlu diinput
        </div>
      ) : (
        /* Daftar mahasiswa yang perlu dinilai */
        inputNilaiList.map((item, idx) => {
          const isLast = idx === inputNilaiList.length - 1;
          const nilaiItemClassName = [
            'nilai-item',
            isLast ? 'is-last' : '',
            item.isUrgent ? 'nilai-item--urgent' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={item.id || idx} className={nilaiItemClassName}>
              <div>
                <div className="nilai-item-name">{item.nama || item.name}</div>
                <div className="nilai-item-sub">{item.nim} &bull; {item.prodi || item.studyProgram}</div>
                <div className={`nilai-item-due ${item.isUrgent ? 'nilai-item-due--urgent' : ''}`}>
                  <AlertCircle size={12} />
                  {item.jatuhTempo}
                </div>
              </div>
              <button
                onClick={() => onInputNilai(item)}
                className={`btn-input-nilai ${item.isUrgent ? 'btn-input-nilai--urgent' : ''}`}
              >
                Input Nilai
              </button>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// Halaman Dashboard utama untuk role Dosen
const DashboardDosen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const namaDisplay = profile?.name || user?.name || user?.username || 'Dosen';

  const showToast = (message, icon, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDosenDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Gagal mengambil data dashboard dosen:', err);
      setError(err.response?.data?.message || 'Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Top bar */}
        <header className="topbar topbar-dosen">
          <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Beranda</div>
        </header>

        <main className="page-body">
          {/* Welcome Card */}
          <div className="welcome-card">
            <h5>Halo, {namaDisplay}! 👋</h5>
            <p>Berikut informasi jadwal sidang dan tugas yang perlu Anda tindak lanjuti.</p>
          </div>

          {/* Banner Error jika Fetch Gagal */}
          {error && (
            <div className="dashboard-error-banner">
              <div className="dashboard-error-left">
                <AlertCircle size={18} color="#C0182A" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="dashboard-error-btn"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* 3 Kartu Statistik */}
          <StatCards data={dashboardData} loading={loading} error={error} onRetry={fetchDashboardData} />
          <div className="dosen-bottom-grid">
            <JadwalSidangSection
              jadwalSidang={dashboardData?.jadwalSidang || []}
              loading={loading}
              error={error}
              onRetry={fetchDashboardData}
              onNavigateAll={() => navigate('/dosen/jadwal-nilai-sidang')}
            />
            <StatusInputNilaiSection
              onShowToast={showToast}
              onInputNilai={(item) => navigate(`/dosen/input-nilai/${item.id || item.nim}`, { state: { mahasiswa: item } })}
              inputNilaiList={[]}
            />
          </div>
        </main>

        <FooterDosen />

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

export default DashboardDosen;