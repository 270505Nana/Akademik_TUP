import React, { useState } from 'react';
import {
  Menu, HelpCircle, Bell,
  CalendarDays, Clock, Building2,
  Search, Filter, CheckCircle2, MoreVertical,
  ClipboardEdit,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import '../dashboard.css';

// Mock data sementara untuk kebutuhan frontend.
// Nantinya akan diganti dengan data dari API penjadwalan sidang.
const MOCK_SIDANG = [
  {
    id: 1,
    nama: 'Ahmad Rizky',
    nim: '1102190012',
    prodi: 'S1 Informatika',
    status: 'Today',
    peran: 'Penguji 1',
    tanggal: 'Senin, 12 November 2024',
    waktu: '09:00 - 11:00 WIB',
    ruangan: 'Gedung IOT - 201',
    sudahDinilai: false,
  },
  {
    id: 2,
    nama: 'Budi Santoso',
    nim: '1102190045',
    prodi: 'S1 Sistem Informasi',
    status: 'Upcoming',
    peran: 'Pembimbing 1',
    tanggal: 'Rabu, 14 November 2024',
    waktu: '13:00 - 15:00 WIB',
    ruangan: 'Gedung DSP - 201',
    sudahDinilai: false,
  },
  {
    id: 3,
    nama: 'Citra Lestari',
    nim: '1102190088',
    prodi: 'S1 Rekayasa Perangkat Lunak',
    status: 'Graded',
    peran: 'Penguji 2',
    tanggal: 'Jumat, 08 November 2024',
    waktu: '10:00 - 12:00 WIB',
    ruangan: 'Ruang Rapat Gedung DC',
    sudahDinilai: true,
  },
];

// Konfigurasi tampilan badge status sidang
const STATUS_CONFIG = {
  Today:    { bg: '#FEE2E2', color: '#991B1B', label: 'Today' },
  Upcoming: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Upcoming' },
  Graded:   { bg: '#D1FAE5', color: '#065F46', label: 'Graded' },
};

// Konfigurasi tampilan badge peran dosen
const PERAN_CONFIG = {
  'Penguji 1':    { bg: '#FEF3C7', color: '#92400E' },
  'Penguji 2':    { bg: '#FEF3C7', color: '#92400E' },
  'Pembimbing 1': { bg: '#FEE2E2', color: '#991B1B' },
  'Pembimbing 2': { bg: '#FEE2E2', color: '#991B1B' },
};

// Card jadwal sidang mahasiswa.
// Menampilkan informasi mahasiswa, jadwal, lokasi, status nilai, dan action.
const SidangCard = ({ item, onInputNilai, onViewGrades }) => {
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Upcoming;
  const peranCfg  = PERAN_CONFIG[item.peran]   || { bg: '#F3F4F6', color: '#374151' };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E9EDF5',
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.09)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
      }}
    >
      {/* Header: badge status + badge peran + menu opsi */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {item.status === 'Graded' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, background: statusCfg.bg, color: statusCfg.color,
            }}>
              <CheckCircle2 size={11} />
              {statusCfg.label}
            </span>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, background: statusCfg.bg, color: statusCfg.color,
            }}>
              {statusCfg.label}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 20, background: peranCfg.bg, color: peranCfg.color,
          }}>
            {item.peran}
          </span>
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, borderRadius: 6 }}
          title="Opsi lainnya"
          aria-label="Opsi lainnya"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Identitas mahasiswa */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>{item.nama}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>NIM: {item.nim}</div>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#C0182A', fontWeight: 600 }}>{item.prodi}</div>
      </div>

      {/* Informasi jadwal: tanggal, waktu, ruangan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
          <CalendarDays size={14} color="#C0182A" style={{ flexShrink: 0 }} />
          {item.tanggal}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
          <Clock size={14} color="#6B7280" style={{ flexShrink: 0 }} />
          {item.waktu}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
          <Building2 size={14} color="#6B7280" style={{ flexShrink: 0 }} />
          {item.ruangan}
        </div>
      </div>

      {/* Action button berdasarkan status nilai */}
      {item.sudahDinilai ? (
        <button
          onClick={() => onViewGrades(item)}
          style={{
            width: '100%', padding: '10px 0',
            border: '1.5px solid #D1D5DB', borderRadius: 8,
            background: '#F9FAFB', color: '#6B7280',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#9CA3AF';
            e.currentTarget.style.background = '#F3F4F6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#D1D5DB';
            e.currentTarget.style.background = '#F9FAFB';
          }}
        >
          View Grades
        </button>
      ) : (
        <button
          onClick={() => onInputNilai(item)}
          className="btn-verif"
          style={{
            width: '100%', padding: '10px 0',
            borderRadius: 8, border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <ClipboardEdit size={14} />
          Input Nilai
        </button>
      )}
    </div>
  );
};

// Halaman utama Jadwal & Nilai Sidang untuk role Dosen.
const JadwalNilaiSidang = () => {
  const navigate      = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts]           = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Filter data sidang berdasarkan input search (nama, NIM, atau prodi).
  const filteredData = MOCK_SIDANG.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(q) ||
      item.nim.toLowerCase().includes(q) ||
      item.prodi.toLowerCase().includes(q)
    );
  });

  const handleInputNilai = (item) => {
    navigate(`/dosen/input-nilai/${item.id}`, { state: { mahasiswa: item } });
  };

  const handleViewGrades = (item) => {
    showToast(`Nilai untuk ${item.nama} sudah diinput.`);
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Top bar maroon dengan judul halaman, icon bantuan dan notifikasi */}
        <header className="topbar topbar-dosen">
          <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Jadwal dan Nilai Sidang</div>
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
          {/* Content header: judul, deskripsi, search, dan tombol filter */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 6 }}>
                Jadwal Sidang Mahasiswa
              </h1>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Kelola sesi sidang yang akan datang dan masukkan nilai.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search input lokal berdasarkan nama, NIM, atau prodi */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 11, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                    border: '1.5px solid #E9EDF5', borderRadius: 8,
                    fontSize: 13, outline: 'none',
                    background: '#fff', color: '#111827',
                    transition: 'border-color 0.2s',
                    width: 200,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#C0182A'; }}
                  onBlur={e => { e.target.style.borderColor = '#E9EDF5'; }}
                />
              </div>

              {/* Tombol filter — UI saja, fitur akan dikembangkan pada tahap berikutnya */}
              <button
                className="btn-detail"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13 }}
                onClick={() => showToast('Fitur filter akan tersedia pada update berikutnya.')}
              >
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>

          {/* Grid card jadwal sidang atau empty state */}
          {filteredData.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {filteredData.map(item => (
                <SidangCard
                  key={item.id}
                  item={item}
                  onInputNilai={handleInputNilai}
                  onViewGrades={handleViewGrades}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: '#fff', borderRadius: 12,
              border: '1px solid #E9EDF5',
            }}>
              <CalendarDays size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
                Tidak ada jadwal sidang ditemukan
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                Coba ubah kata kunci pencarian Anda.
              </div>
            </div>
          )}
        </main>

        <FooterDosen />

        {/* Toast notification */}
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
                <span className="toast-msg">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default JadwalNilaiSidang;
