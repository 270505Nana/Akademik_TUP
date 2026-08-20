import React, { useState } from 'react';
import { Users, Calendar, ClipboardEdit, CalendarDays, Clock, MapPin, AlertCircle, Menu, HelpCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import '../dashboard.css';

// Mock data sementara untuk dashboard dosen.
// Nanti diganti dengan response API.
const MOCK_DOSEN = {
  nama: 'Dr. Purwono',
  inisial: 'P',
};

const MOCK_STATISTIK = [
  { label: 'Total Mahasiswa Bimbingan', nilai: 24, icon: 'users' },
  { label: 'Mahasiswa Siap Sidang di Prodi', nilai: 8, icon: 'calendar' },
  { label: 'Nilai yang Belum Diinput', nilai: 3, icon: 'edit' },
];

const MOCK_JADWAL_SIDANG = [
  {
    id: 1,
    nama: 'Ahmad Fauzi',
    nim: '1301204001',
    prodi: 'S1 Informatika',
    peran: 'Penguji 1',
    hari: 'Senin, 18 November 2024',
    jam: '10:00 - 12:00',
    ruangan: 'Ruang A302, Gedung IoT',
    isUrgent: false,
  },
  {
    id: 2,
    nama: 'Nina Kirana',
    nim: '1301204002',
    prodi: 'S1 Informatika',
    peran: 'Pembimbing 1',
    hari: 'Selasa, 20 November 2024',
    jam: '10:00 - 12:00',
    ruangan: 'Ruang A302, Gedung IoT',
    isUrgent: false,
  },
  {
    id: 3,
    nama: 'Dino Septiawan',
    nim: '1301204003',
    prodi: 'S1 Informatika',
    peran: 'Pembimbing 2',
    hari: 'Selasa, 20 November 2024',
    jam: '10:00 - 12:00',
    ruangan: 'Ruang A302, Gedung IoT',
    isUrgent: false,
  },
];

const MOCK_INPUT_NILAI = [
  {
    id: 1,
    nama: 'Ahmad Fauzi',
    nim: '1301204001',
    prodi: 'S1 Informatika',
    jatuhTempo: 'Jatuh tempo hari ini',
    isUrgent: true,
  },
  {
    id: 2,
    nama: 'Dewi Lestari',
    nim: '1301204002',
    prodi: 'S1 Informatika',
    jatuhTempo: 'Jatuh tempo 2 hari lagi',
    isUrgent: false,
  },
  {
    id: 3,
    nama: 'Rizky Ananda',
    nim: '1301204003',
    prodi: 'S1 Informatika',
    jatuhTempo: 'Jatuh tempo 3 hari lagi',
    isUrgent: false,
  },
];

// Pemetaan warna badge peran dosen dalam sidang
const PERAN_STYLE = {
  'Penguji 1': { bg: '#FEF3C7', color: '#92400E' },
  'Penguji 2': { bg: '#FEF3C7', color: '#92400E' },
  'Pembimbing 1': { bg: '#FEE2E2', color: '#991B1B' },
  'Pembimbing 2': { bg: '#FEE2E2', color: '#991B1B' },
};

// Icon statistik sesuai tipe
const StatIcon = ({ tipe }) => {
  const base = { color: '#C0182A' };
  if (tipe === 'users') return <Users size={26} style={base} />;
  if (tipe === 'calendar') return <Calendar size={26} style={base} />;
  if (tipe === 'edit') return <ClipboardEdit size={26} style={base} />;
  return null;
};

// Menampilkan 3 kartu statistik ringkasan dosen
const StatCards = () => (
  <div className="stat-grid">
    {MOCK_STATISTIK.map((item, idx) => (
      <div className="CardAtas4" key={idx}>
        <div className="CardAtas4-header">
          <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StatIcon tipe={item.icon} />
          </div>
        </div>
        <div className="CardAtas4-label">{item.label}</div>
        <div className="CardAtas4-value">{item.nilai}</div>
      </div>
    ))}
  </div>
);

// Menampilkan jadwal sidang terdekat yang melibatkan dosen
const JadwalSidangSection = () => (
  <div className="section-card" style={{ flex: 1, minWidth: 0 }}>
    <div className="card-header-custom" style={{ alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CalendarDays size={18} color="#C0182A" />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Jadwal Sidang Terdekat</span>
      </div>
      <a href="#" style={{ fontSize: 13, color: '#C0182A', fontWeight: 600, textDecoration: 'none' }}>Lihat Semua</a>
    </div>

    <div style={{ padding: '4px 0' }}>
      {MOCK_JADWAL_SIDANG.map((item, idx) => {
        const peranStyle = PERAN_STYLE[item.peran] || { bg: '#F3F4F6', color: '#374151' };
        return (
          <div
            key={item.id}
            style={{
              padding: '16px 20px',
              borderBottom: idx < MOCK_JADWAL_SIDANG.length - 1 ? '1px solid #F1F5F9' : 'none',
              borderLeft: '3px solid #C0182A',
              marginLeft: 20,
              marginRight: 20,
              marginTop: idx === 0 ? 12 : 0,
              marginBottom: idx < MOCK_JADWAL_SIDANG.length - 1 ? 12 : 12,
              borderRadius: 8,
              background: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.nama}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{item.nim} &bull; {item.prodi}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                borderRadius: 6, background: peranStyle.bg, color: peranStyle.color,
                whiteSpace: 'nowrap', marginLeft: 8,
              }}>
                {item.peran}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#C0182A', fontWeight: 600 }}>
                <CalendarDays size={13} />
                {item.hari}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                <Clock size={13} />
                {item.jam}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                <MapPin size={13} />
                {item.ruangan}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// Menampilkan status input nilai sidang beserta reminder batas waktu
const StatusInputNilaiSection = ({ onShowToast, onInputNilai }) => (
  <div className="section-card" style={{ flex: 1, minWidth: 0 }}>
    <div className="card-header-custom">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClipboardEdit size={18} color="#C0182A" />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Status Input Nilai Sidang</span>
      </div>
    </div>

    <div style={{ padding: '12px 20px 4px' }}>
      {/* Reminder batas waktu */}
      <div style={{
        background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
        padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
        marginBottom: 16,
      }}>
        <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 2 }}>Batas Waktu Penginputan</div>
          <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>
            Nilai sidang wajib diinputkan maksimal 24 jam setelah pelaksanaan sidang.
          </div>
        </div>
      </div>

      {/* Daftar mahasiswa yang perlu dinilai */}
      {MOCK_INPUT_NILAI.map((item, idx) => (
        <div
          key={item.id}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px',
            marginBottom: idx < MOCK_INPUT_NILAI.length - 1 ? 8 : 12,
            borderRadius: 8,
            border: item.isUrgent ? '1px solid #FECACA' : '1px solid #E5E7EB',
            background: item.isUrgent ? '#FFF5F5' : '#FAFAFA',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{item.nama}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{item.nim} &bull; {item.prodi}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: item.isUrgent ? '#C0182A' : '#6B7280' }}>
              <AlertCircle size={12} />
              {item.jatuhTempo}
            </div>
          </div>
          <button
            onClick={() => onInputNilai(item)}
            style={{
              padding: '8px 14px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginLeft: 12,
              border: item.isUrgent ? 'none' : '1.5px solid #D1D5DB',
              background: item.isUrgent ? '#C0182A' : '#fff',
              color: item.isUrgent ? '#fff' : '#374151',
              transition: 'all 0.2s',
            }}
          >
            Input Nilai
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Halaman Dashboard utama untuk role Dosen
const DashboardDosen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const showToast = (message, icon, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Top bar maroon dengan icon bantuan dan notifikasi */}
        <header className="topbar topbar-dosen">
          <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Beranda</div>
          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Bantuan" aria-label="Bantuan">
              <HelpCircle size={20} />
            </button>
            <button className="topbar-icon-btn" title="Notifikasi" aria-label="Notifikasi">
              <Bell size={20} />
            </button>
          </div>
        </header>

        <main className="page-body">
          {/* Welcome Card */}
          <div className="welcome-card">
            <h5>Halo, {MOCK_DOSEN.nama}! 👋</h5>
            <p>Berikut informasi jadwal sidang dan tugas yang perlu Anda tindak lanjuti.</p>
          </div>

          {/* 3 Kartu Statistik */}
          <StatCards />

          {/* Jadwal Sidang + Status Input Nilai dalam 2 kolom */}
          <div className="dosen-bottom-grid">
            <JadwalSidangSection />
            <StatusInputNilaiSection
              onShowToast={showToast}
              onInputNilai={(item) => navigate(`/dosen/input-nilai/${item.nim}`, { state: { mahasiswa: item } })}
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
