import React, { useState } from 'react';
import { Menu, HelpCircle, Bell, ArrowLeft, Save, CalendarDays, Clock, Building2 } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import '../dashboard.css';

// Mock data mahasiswa yang menunggu input nilai.
// Struktur ini sejajar dengan MOCK_INPUT_NILAI di dashboard dan mudah diganti API response.
const MOCK_GRADE_ENTRIES = [
  {
    nim: '1301204001',
    nama: 'Ahmad Fauzi',
    prodi: 'S1 Informatika',
    jatuhTempo: 'Jatuh tempo hari ini',
    isUrgent: true,
  },
  {
    nim: '1301204002',
    nama: 'Dewi Lestari',
    prodi: 'S1 Informatika',
    jatuhTempo: 'Jatuh tempo 2 hari lagi',
    isUrgent: false,
  },
  {
    nim: '1301204003',
    nama: 'Rizky Ananda',
    prodi: 'S1 Informatika',
    jatuhTempo: 'Jatuh tempo 3 hari lagi',
    isUrgent: false,
  },
];

// Komponen input nilai untuk satu komponen penilaian.
const NilaiInput = ({ label, sublabel, value, onChange, min = 0, max = 100 }) => (
  <div style={{
    background: '#F8FAFC', border: '1px solid #E9EDF5',
    borderRadius: 10, padding: '16px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 2 }}>{label}</div>
      {sublabel && <div style={{ fontSize: 12, color: '#6B7280' }}>{sublabel}</div>}
    </div>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: 80, padding: '8px 12px', textAlign: 'center',
        border: '1.5px solid #E9EDF5', borderRadius: 8,
        fontSize: 16, fontWeight: 700, color: '#C0182A',
        outline: 'none', background: '#fff',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => { e.target.style.borderColor = '#C0182A'; }}
      onBlur={e => { e.target.style.borderColor = '#E9EDF5'; }}
    />
  </div>
);

// Halaman form Input Nilai Sidang.
// Prototype frontend dengan local state — tidak terhubung ke API.
const InputNilaiSidang = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id }    = useParams();

  // Mengambil data mahasiswa berdasarkan NIM dari dynamic route.
  // Prioritas: location.state (dari navigasi card Jadwal), lalu lookup mock data (dari Dashboard).
  const mahasiswaFromState = location.state?.mahasiswa;
  const mahasiswaFromMock  = MOCK_GRADE_ENTRIES.find(m => m.nim === id);
  const mahasiswa          = mahasiswaFromState || mahasiswaFromMock || null;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts]           = useState([]);
  const [submitted, setSubmitted]     = useState(false);

  // State nilai per komponen penilaian
  const [nilai, setNilai] = useState({
    penguasaanMateri: '',
    metodologi:       '',
    presentasi:       '',
    tanyaJawab:       '',
    kerapianLaporan:  '',
  });

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Hitung nilai rata-rata dari semua komponen yang sudah diisi
  const nilaiTerisi  = Object.values(nilai).filter(v => v !== '');
  const rataRata     = nilaiTerisi.length > 0
    ? Math.round(nilaiTerisi.reduce((acc, v) => acc + Number(v), 0) / nilaiTerisi.length)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const kosong = Object.values(nilai).some(v => v === '');
    if (kosong) {
      showToast('Harap isi semua komponen nilai sebelum menyimpan.', 'warning');
      return;
    }
    // Simulasi submit — data hanya disimpan di local state (prototype).
    setSubmitted(true);
    showToast(`Nilai untuk ${mahasiswa.nama} berhasil disimpan.`, 'success');
    setTimeout(() => navigate('/dosen/jadwal-nilai-sidang'), 2500);
  };

  const setNilaiField = (field) => (val) => {
    const clamped = Math.min(100, Math.max(0, Number(val)));
    setNilai(prev => ({ ...prev, [field]: clamped === 0 && val === '' ? '' : String(clamped) }));
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Tampilkan not-found state jika studentId tidak dikenali di mock data manapun */}
      {!mahasiswa ? (
        <div id="main-content">
          <header className="topbar topbar-dosen">
            <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="topbar-brand topbar-brand-dosen">Input Nilai Sidang</div>
          </header>
          <main className="page-body" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)' }}>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 8 }}>
                Data mahasiswa tidak ditemukan
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                NIM <strong>{id}</strong> tidak terdaftar dalam daftar input nilai.
              </div>
              <button
                onClick={() => navigate('/dosen/jadwal-nilai-sidang')}
                className="btn-verif"
                style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                Kembali ke Jadwal &amp; Nilai Sidang
              </button>
            </div>
          </main>
          <FooterDosen />
        </div>
      ) : (

      <div id="main-content">
        {/* Top bar maroon */}
        <header className="topbar topbar-dosen">
          <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Input Nilai Sidang</div>
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
          {/* Breadcrumb / back navigation */}
          <button
            onClick={() => navigate('/dosen/jadwal-nilai-sidang')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#C0182A', fontSize: 13, fontWeight: 600, padding: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <ArrowLeft size={15} />
            Kembali ke Jadwal &amp; Nilai Sidang
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
            {/* Form input nilai */}
            <form onSubmit={handleSubmit}>
              <div className="section-card" style={{ overflow: 'visible' }}>
                <div className="card-header-custom">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>
                      Form Input Nilai Sidang
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      Isi semua komponen penilaian (0–100) lalu simpan.
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <NilaiInput
                    label="Penguasaan Materi"
                    sublabel="Kemampuan menjawab pertanyaan dan pemahaman topik"
                    value={nilai.penguasaanMateri}
                    onChange={setNilaiField('penguasaanMateri')}
                  />
                  <NilaiInput
                    label="Metodologi Penelitian"
                    sublabel="Ketepatan metode yang digunakan dalam penelitian"
                    value={nilai.metodologi}
                    onChange={setNilaiField('metodologi')}
                  />
                  <NilaiInput
                    label="Kualitas Presentasi"
                    sublabel="Penyampaian, slide, dan komunikasi verbal"
                    value={nilai.presentasi}
                    onChange={setNilaiField('presentasi')}
                  />
                  <NilaiInput
                    label="Tanya Jawab"
                    sublabel="Kemampuan merespons pertanyaan penguji"
                    value={nilai.tanyaJawab}
                    onChange={setNilaiField('tanyaJawab')}
                  />
                  <NilaiInput
                    label="Kerapian Laporan"
                    sublabel="Format penulisan dan kelengkapan dokumen"
                    value={nilai.kerapianLaporan}
                    onChange={setNilaiField('kerapianLaporan')}
                  />
                </div>

                <div style={{ padding: '16px 20px', borderTop: '1px solid #E9EDF5', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="btn-detail"
                    style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13 }}
                    onClick={() => navigate('/dosen/jadwal-nilai-sidang')}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-verif"
                    disabled={submitted}
                    style={{
                      padding: '10px 24px', borderRadius: 8, fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 7,
                      opacity: submitted ? 0.7 : 1, cursor: submitted ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Save size={14} />
                    {submitted ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </div>
              </div>
            </form>

            {/* Panel info mahasiswa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="section-card">
                <div className="card-header-custom" style={{ paddingBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Informasi Mahasiswa</div>
                </div>
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{mahasiswa.nama}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>NIM: {mahasiswa.nim}</div>
                    <div style={{ fontSize: 12, color: '#C0182A', fontWeight: 600, fontStyle: 'italic', marginTop: 4 }}>{mahasiswa.prodi}</div>
                  </div>
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <CalendarDays size={13} color="#C0182A" />
                      {mahasiswa.tanggal}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <Clock size={13} color="#6B7280" />
                      {mahasiswa.waktu}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                      <Building2 size={13} color="#6B7280" />
                      {mahasiswa.ruangan}
                    </div>
                  </div>
                  <div style={{
                    background: '#FEF3C7', borderRadius: 8, padding: '8px 12px',
                    fontSize: 12, color: '#92400E', fontWeight: 600,
                    display: 'inline-block',
                  }}>
                    Peran: {mahasiswa.peran}
                  </div>
                </div>
              </div>

              {/* Preview nilai rata-rata */}
              {rataRata !== null && (
                <div style={{
                  background: '#fff', border: '1px solid #E9EDF5',
                  borderRadius: 12, padding: '20px', textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Nilai Rata-rata Sementara
                  </div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#C0182A', lineHeight: 1 }}>
                    {rataRata}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                    dari {nilaiTerisi.length} komponen terisi
                  </div>
                </div>
              )}
            </div>
          </div>
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
      )}
    </>
  );
};

export default InputNilaiSidang;
