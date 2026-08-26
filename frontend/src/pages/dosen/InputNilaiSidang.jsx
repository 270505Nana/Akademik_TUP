import React, { useState, useMemo, useEffect } from 'react';
import {
  Menu, HelpCircle, Bell, ArrowLeft, Save,
  CalendarDays, Clock, Building2, User, AlertCircle, CheckCircle, Award, BookOpen, AlertTriangle
} from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import { getRubrikCloByProdi } from '../../requirement/rubrikCloSidang';
import '../dashboard.css';

// Master mock data mahasiswa untuk fallback pengetesan input nilai sidang
const MOCK_MAHASISWA_LIST = [
  {
    id: '1301204001',
    nim: '1301204001',
    nama: 'Ahmad Fauzi',
    prodi: 'S1 Informatika',
    peran: 'Penguji 1',
    tanggal: 'Senin, 18 November 2024',
    waktu: '10:00 - 12:00 WIB',
    ruangan: 'Ruang A302, Gedung IoT',
    jatuhTempo: 'Jatuh tempo hari ini',
    isUrgent: true,
  },
  {
    id: '1102190045',
    nim: '1102190045',
    nama: 'Budi Santoso',
    prodi: 'S1 Sistem Informasi',
    peran: 'Pembimbing 1',
    tanggal: 'Rabu, 14 November 2024',
    waktu: '13:00 - 15:00 WIB',
    ruangan: 'Gedung DSP - 201',
    jatuhTempo: 'Jatuh tempo 2 hari lagi',
    isUrgent: false,
  },
  {
    id: '1102190088',
    nim: '1102190088',
    nama: 'Citra Lestari',
    prodi: 'S1 Rekayasa Perangkat Lunak',
    peran: 'Penguji 2',
    tanggal: 'Jumat, 08 November 2024',
    waktu: '10:00 - 12:00 WIB',
    ruangan: 'Ruang Rapat Gedung DC',
    jatuhTempo: 'Sudah dinilai',
    isUrgent: false,
  },
];

// Helper konversi nilai angka ke indeks huruf & predikat mutu
const getGradeInfo = (score) => {
  if (score >= 80) return { grade: 'A', status: 'Sangat Memuaskan', color: '#16A34A', bg: '#DCFCE7' };
  if (score >= 70) return { grade: 'AB', status: 'Memuaskan', color: '#2563EB', bg: '#DBEAFE' };
  if (score >= 65) return { grade: 'B', status: 'Baik', color: '#0D9488', bg: '#CCFBF1' };
  if (score >= 60) return { grade: 'BC', status: 'Cukup Baik', color: '#D97706', bg: '#FEF3C7' };
  if (score >= 50) return { grade: 'C', status: 'Cukup', color: '#EA580C', bg: '#FFEDD5' };
  if (score >= 40) return { grade: 'D', status: 'Kurang', color: '#DC2626', bg: '#FEE2E2' };
  return { grade: 'E', status: 'Tidak Lulus', color: '#991B1B', bg: '#FEE2E2' };
};

// Halaman form Input Nilai Sidang Berbasis Rubrik CLO per Prodi (FE-Only)
const InputNilaiSidang = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const rawMahasiswa = location.state?.mahasiswa ||
    MOCK_MAHASISWA_LIST.find(m => String(m.id) === String(id) || String(m.nim) === String(id)) ||
    MOCK_MAHASISWA_LIST[0];

  const mahasiswa = rawMahasiswa ? {
    ...rawMahasiswa,
    nama: rawMahasiswa.nama || 'Mahasiswa',
    nim: rawMahasiswa.nim || id,
    prodi: rawMahasiswa.prodi || 'S1 Informatika',
    peran: rawMahasiswa.peran || 'Penguji 1',
    tanggal: rawMahasiswa.tanggal || rawMahasiswa.hari || 'Senin, 18 November 2024',
    waktu: rawMahasiswa.waktu || rawMahasiswa.jam || '10:00 - 12:00 WIB',
    ruangan: rawMahasiswa.ruangan || 'Ruang A302, Gedung IoT',
  } : null;

  // Mengambil rubrik CLO dinamis berdasarkan program studi mahasiswa
  const rubrikProdi = useMemo(() => {
    return mahasiswa?.prodi ? getRubrikCloByProdi(mahasiswa.prodi) : null;
  }, [mahasiswa?.prodi]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // State nilai per baris rubrik CLO (key: kriteria.id, value: string/number)
  const [nilaiMap, setNilaiMap] = useState({});

  // Reset nilai ketika rubrik prodi berubah
  useEffect(() => {
    if (rubrikProdi?.kriteria) {
      const initialMap = {};
      rubrikProdi.kriteria.forEach((item) => {
        initialMap[item.id] = '';
      });
      setNilaiMap(initialMap);
    } else {
      setNilaiMap({});
    }
  }, [rubrikProdi]);

  const showToast = (message, type = 'info', icon = null) => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3500);
  };

  // Handler input nilai komponen (0–100)
  const handleScoreChange = (kriteriaId, rawValue) => {
    if (rawValue === '') {
      setNilaiMap(prev => ({ ...prev, [kriteriaId]: '' }));
      return;
    }
    const num = Number(rawValue);
    if (!isNaN(num)) {
      const clamped = Math.min(100, Math.max(0, num));
      setNilaiMap(prev => ({ ...prev, [kriteriaId]: String(clamped) }));
    }
  };

  // Kalkulasi Nilai Akhir berbobot: SUM(nilaiKomponen * bobot / 100)
  const calculationResult = useMemo(() => {
    if (!rubrikProdi?.kriteria) {
      return { totalTerisi: 0, totalKriteria: 0, nilaiAkhir: null, isLengkap: false };
    }

    const kriteriaList = rubrikProdi.kriteria;
    let totalWeightedScore = 0;
    let filledCount = 0;

    kriteriaList.forEach(item => {
      const val = nilaiMap[item.id];
      if (val !== undefined && val !== '' && !isNaN(Number(val))) {
        filledCount += 1;
        totalWeightedScore += (Number(val) * Number(item.bobot)) / 100;
      }
    });

    const isLengkap = filledCount === kriteriaList.length && kriteriaList.length > 0;
    const finalScore = filledCount > 0 ? Math.round(totalWeightedScore * 100) / 100 : null;

    return {
      totalTerisi: filledCount,
      totalKriteria: kriteriaList.length,
      nilaiAkhir: finalScore,
      isLengkap,
    };
  }, [rubrikProdi, nilaiMap]);

  const gradeInfo = calculationResult.nilaiAkhir !== null ? getGradeInfo(calculationResult.nilaiAkhir) : null;

  // Submit penilaian sidang (FE-Only)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rubrikProdi?.kriteria) {
      showToast('Rubrik penilaian belum tersedia untuk program studi ini.', 'warning', <AlertTriangle size={18} color="#D97706" />);
      return;
    }

    if (!calculationResult.isLengkap) {
      showToast(`Harap lengkapi semua nilai (${calculationResult.totalTerisi}/${calculationResult.totalKriteria} kriteria terisi).`, 'warning', <AlertCircle size={18} color="#D97706" />);
      return;
    }

    // Payload hasil penilaian sidang
    const payload = {
      mahasiswaId: mahasiswa.id,
      nim: mahasiswa.nim,
      prodi: mahasiswa.prodi,
      nilaiAkhir: calculationResult.nilaiAkhir,
      rincianNilai: Object.entries(nilaiMap).map(([kriteriaId, skor]) => ({
        kriteriaId,
        skor: Number(skor),
      })),
      submittedAt: new Date().toISOString(),
    };

    // NOTE: Titik ini adalah tempat integrasi API simpan nilai setelah endpoint BE siap
    console.log('[SIMTA] Hasil Input Nilai Sidang (FE-Only):', payload);

    setSubmitted(true);
    showToast(`Nilai akhir (${calculationResult.nilaiAkhir}) untuk ${mahasiswa.nama} berhasil disimpan.`, 'success', <CheckCircle size={18} color="#16A34A" />);
    setTimeout(() => navigate('/dosen/jadwal-nilai-sidang'), 2200);
  };

  const peranStyle = mahasiswa?.peran?.toLowerCase().includes('pembimbing')
    ? { bg: '#FEE2E2', color: '#991B1B' }
    : { bg: '#FEF3C7', color: '#92400E' };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Topbar Maroon Dosen */}
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
          {/* Navigasi Kembali */}
          <div>
            <button
              onClick={() => navigate('/dosen/jadwal-nilai-sidang')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#374151',
                fontSize: 13,
                fontWeight: 600,
                padding: '8px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#C0182A';
                e.currentTarget.style.borderColor = '#FECACA';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
            >
              <ArrowLeft size={16} />
              Kembali ke Jadwal &amp; Nilai Sidang
            </button>
          </div>

          {/* Layout Grid 2 Kolom Responsif */}
          <div className="input-nilai-grid">
            {/* Kolom Kiri: Tabel Form Rubrik CLO */}
            <div>
              <form onSubmit={handleSubmit}>
                <div className="section-card" style={{ overflow: 'hidden' }}>
                  {/* Header Card */}
                  <div className="card-header-custom" style={{ padding: '20px 24px', background: '#fff' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={18} color="#C0182A" />
                        Form Penilaian Sidang Berbasis Rubrik CLO
                      </div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        Program Studi: <strong style={{ color: '#C0182A' }}>{mahasiswa.prodi}</strong>
                      </div>
                    </div>
                    {rubrikProdi?.kriteria && (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: calculationResult.isLengkap ? '#DCFCE7' : '#FEF3C7',
                        color: calculationResult.isLengkap ? '#15803D' : '#92400E',
                      }}>
                        {calculationResult.totalTerisi}/{calculationResult.totalKriteria} Komponen Terisi
                      </span>
                    )}
                  </div>

                  {/* Body: Tabel Rubrik CLO atau Placeholder jika prodi belum ada */}
                  {!rubrikProdi ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <AlertTriangle size={36} color="#F59E0B" style={{ margin: '0 auto 12px', display: 'block' }} />
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', marginBottom: 6 }}>
                        Rubrik Penilaian Belum Tersedia
                      </div>
                      <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.6 }}>
                        Rubrik penilaian CLO untuk program studi <strong>{mahasiswa.prodi}</strong> saat ini sedang dalam proses penyusunan oleh tim akademik.
                      </p>
                      <div style={{
                        display: 'inline-block',
                        background: '#FEF3C7',
                        color: '#92400E',
                        padding: '6px 16px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        Status: Placeholder Rubrik (TODO)
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="table-scroll-wrap" style={{ maxHeight: 'none', borderTop: '1px solid #E5E7EB' }}>
                        <table className="simta-table" style={{ minWidth: 720 }}>
                          <thead>
                            <tr>
                              <th style={{ width: '20%', textAlign: 'left', paddingLeft: 20 }}>CLO</th>
                              <th style={{ width: '22%', textAlign: 'left' }}>Sub CLO</th>
                              <th style={{ width: '32%', textAlign: 'left' }}>Jenis Asesmen</th>
                              <th style={{ width: '12%', textAlign: 'center' }}>Bobot</th>
                              <th style={{ width: '14%', textAlign: 'center', paddingRight: 20 }}>Nilai [0-100]</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rubrikProdi.kriteria.map((item, idx) => {
                              const scoreVal = nilaiMap[item.id] || '';
                              const isFilled = scoreVal !== '' && !isNaN(Number(scoreVal));

                              return (
                                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                  {/* Kolom CLO */}
                                  <td style={{ textAlign: 'left', verticalAlign: 'top', paddingLeft: 20, paddingTop: 16, paddingBottom: 16 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 2 }}>
                                      {item.clo}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.45 }}>
                                      {item.cloDesc}
                                    </div>
                                  </td>

                                  {/* Kolom Sub CLO */}
                                  <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: 16, paddingBottom: 16 }}>
                                    {item.subClo ? (
                                      <>
                                        <div style={{ fontWeight: 600, fontSize: 12.5, color: '#1F2937', marginBottom: 2 }}>
                                          {item.subClo}
                                        </div>
                                        {item.subCloDesc && (
                                          <div style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>
                                            {item.subCloDesc}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                                        Tidak diuraikan ke Sub-CLO
                                      </span>
                                    )}
                                  </td>

                                  {/* Kolom Jenis Asesmen — mendukung string biasa atau array of string (bulleted list) */}
                                  <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: 16, paddingBottom: 16 }}>
                                    {Array.isArray(item.jenisAsesmen) ? (
                                      <div>
                                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', marginBottom: 4, lineHeight: 1.4 }}>
                                          {item.jenisAsesmen[0]}
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: '#4B5563', lineHeight: 1.5 }}>
                                          {item.jenisAsesmen.slice(1).map((subPoint, pIdx) => (
                                            <li key={pIdx} style={{ marginBottom: 2 }}>{subPoint}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', lineHeight: 1.4 }}>
                                        {item.jenisAsesmen}
                                      </div>
                                    )}
                                  </td>

                                  {/* Kolom Bobot */}
                                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                    <span style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      padding: '3px 10px',
                                      borderRadius: 6,
                                      background: '#F1F5F9',
                                      color: '#475569',
                                      display: 'inline-block',
                                    }}>
                                      {item.bobot}%
                                    </span>
                                  </td>

                                  {/* Kolom Input Nilai */}
                                  <td style={{ textAlign: 'center', verticalAlign: 'middle', paddingRight: 20 }}>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      placeholder="0"
                                      value={scoreVal}
                                      onChange={(e) => handleScoreChange(item.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                                      }}
                                      style={{
                                        width: 68,
                                        padding: '8px 10px',
                                        textAlign: 'center',
                                        border: `1.5px solid ${isFilled ? '#C0182A' : '#CBD5E1'}`,
                                        borderRadius: 8,
                                        fontSize: 15,
                                        fontWeight: 800,
                                        color: '#C0182A',
                                        outline: 'none',
                                        background: '#fff',
                                        transition: 'all 0.2s',
                                      }}
                                      onFocus={e => {
                                        e.target.style.borderColor = '#C0182A';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(192, 24, 42, 0.12)';
                                      }}
                                      onBlur={e => {
                                        e.target.style.borderColor = isFilled ? '#C0182A' : '#CBD5E1';
                                        e.target.style.boxShadow = 'none';
                                      }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {/* Footer Total Tabel */}
                          <tfoot>
                            <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                              <td colSpan={3} style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 800, fontSize: 13, color: '#1E293B' }}>
                                Total Bobot &amp; Nilai Akhir Terhitung:
                              </td>
                              <td style={{ textAlign: 'center', padding: '14px 10px', fontWeight: 800, fontSize: 13, color: '#1E293B' }}>
                                {rubrikProdi.totalBobot}%
                              </td>
                              <td style={{ textAlign: 'center', padding: '14px 20px', paddingRight: 20 }}>
                                <span style={{
                                  fontWeight: 900,
                                  fontSize: 16,
                                  color: calculationResult.nilaiAkhir !== null ? '#C0182A' : '#9CA3AF',
                                }}>
                                  {calculationResult.nilaiAkhir !== null ? calculationResult.nilaiAkhir : '-'}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Footer Aksi Form */}
                      <div style={{
                        padding: '18px 24px',
                        borderTop: '1px solid #E9EDF5',
                        background: '#FAFAFA',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>
                          * Nilai Akhir dihitung otomatis berdasarkan bobot persentase masing-masing komponen.
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
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
                              padding: '10px 24px',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              opacity: submitted ? 0.7 : 1,
                              cursor: submitted ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Save size={15} />
                            {submitted ? 'Menyimpan Nilai...' : 'Simpan Nilai Sidang'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Kolom Kanan: Detail Mahasiswa & Ringkasan Nilai Akhir */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Informasi Mahasiswa */}
              <div className="section-card">
                <div className="card-header-custom" style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={16} color="#C0182A" />
                    Informasi Mahasiswa
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: peranStyle.bg,
                    color: peranStyle.color,
                  }}>
                    {mahasiswa.peran}
                  </span>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>
                      {mahasiswa.nama}
                    </div>
                    <div style={{ fontSize: 13, color: '#4B5563', marginTop: 2 }}>
                      NIM: <strong>{mahasiswa.nim}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#C0182A', fontWeight: 600, marginTop: 4 }}>
                      {mahasiswa.prodi}
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151' }}>
                      <CalendarDays size={15} color="#C0182A" style={{ flexShrink: 0 }} />
                      <span>{mahasiswa.tanggal}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6B7280' }}>
                      <Clock size={15} color="#6B7280" style={{ flexShrink: 0 }} />
                      <span>{mahasiswa.waktu}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6B7280' }}>
                      <Building2 size={15} color="#6B7280" style={{ flexShrink: 0 }} />
                      <span>{mahasiswa.ruangan}</span>
                    </div>
                  </div>

                  {/* Kotak Info Batas Waktu */}
                  <div style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}>
                    <AlertCircle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 11.5, color: '#92400E', lineHeight: 1.45 }}>
                      <strong>Batas Waktu:</strong> Nilai sidang wajib diinput maksimal 24 jam setelah pelaksanaan sidang.
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Nilai Akhir Terhitung */}
              <div style={{
                background: '#fff',
                border: '1px solid #E9EDF5',
                borderRadius: 12,
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}>
                  Nilai Akhir Sidang
                </div>

                {calculationResult.nilaiAkhir !== null ? (
                  <div>
                    <div style={{ fontSize: 52, fontWeight: 900, color: '#C0182A', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {calculationResult.nilaiAkhir}
                    </div>

                    {/* Badge Predikat Nilai Huruf */}
                    {gradeInfo && (
                      <div style={{ marginTop: 12 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 14px',
                          borderRadius: 20,
                          background: gradeInfo.bg,
                          color: gradeInfo.color,
                          fontSize: 12,
                          fontWeight: 800,
                        }}>
                          <Award size={14} />
                          Grade: {gradeInfo.grade} ({gradeInfo.status})
                        </span>
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10 }}>
                      Terhitung dari <strong>{calculationResult.totalTerisi}</strong> dari {calculationResult.totalKriteria} kriteria bobot
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>
                    Belum ada nilai yang diinputkan.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <FooterDosen />

        {/* Toast Notification Container */}
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
                {toast.icon && <span className="toast-icon">{toast.icon}</span>}
                <span className="toast-msg">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default InputNilaiSidang;
