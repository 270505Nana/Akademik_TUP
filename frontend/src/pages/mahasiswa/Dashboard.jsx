import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../dashboard.css';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import api, { downloadSK } from '../../service/api';
import { determineSkStatus, STATUS_SK } from '../../components/common/Skstatushelper';
import { STATUS_SIDANG, SIDANG_STATUS_CONFIG, determineSidangStatus } from '../../components/admin/sidang/Sidangstatushelper';

const extractData = (res) => {
  if (!res) return {};
  if (res.data && res.data.data) return res.data.data;
  if (res.data) return res.data;
  return res;
};

const normalizeRegistration = (raw) => {
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
};

const toRowBadge = (cfg) => ({
  bg: cfg.badgeBg,
  color: cfg.badgeColor,
  label: cfg.label,
});

const SIDANG_KETERANGAN_LABEL = {
  [STATUS_SIDANG.BELUM_DAFTAR]: 'Selesaikan pengisian formulir pendaftaran.',
  [STATUS_SIDANG.PROSES_REGISTRASI]: 'Lanjutkan dan selesaikan unggah berkas.',
  [STATUS_SIDANG.DALAM_PROSES]: 'Menunggu validasi dokumen oleh admin.',
  [STATUS_SIDANG.PERLU_REVISI]: 'Terdapat berkas yang harus kamu perbaiki.',
  [STATUS_SIDANG.REVISI_DIPERBARUI]: 'Menunggu ulang verifikasi admin.',
};

const getSidangKeteranganText = (status, assignedPeriode) => {
  const cfg = SIDANG_STATUS_CONFIG[status];
  if (!cfg) return '—';

  if (status === STATUS_SIDANG.PENDAFTARAN_DITERIMA) {
    return `Pendaftaran diterima. Kamu dijadwalkan pada ${assignedPeriode?.name ?? 'periode ini'}.`;
  }

  if (status === STATUS_SIDANG.SIAP_SIDANG) {
    return `Kamu siap sidang! Dijadwalkan pada ${assignedPeriode?.name ?? 'periode ini'}.`;
  }

  return SIDANG_KETERANGAN_LABEL[status] ?? cfg.label;
};

const LOCKED_BADGE = { bg: '#F3F4F6', color: '#6B7280', label: 'TERKUNCI' };

const formatDateRange = (start, end) => {
  const fmt = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const formatDateShort = (d) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const pickRelevantPeriod = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return null;
  
  const open = list.find(p => p.isOpen === true);
  if (open) return { ...open, state: 'aktif' };
  
  const now = new Date();
  const upcoming = list
    .filter(p => new Date(p.startDate) > now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  if (upcoming.length > 0) return { ...upcoming[0], state: 'mendatang' };
  
  const past = [...list].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
  return past.length > 0 ? { ...past[0], state: 'selesai' } : null;
};

const skBadgeStyle = (status) => {
  const map = {
    [STATUS_SK.SUDAH_TERBIT]: { bg: '#D1FAE5', color: '#059669', label: 'DISETUJUI' },
    [STATUS_SK.BELUM_TERBIT]: { bg: '#FEF3C7', color: '#D97706', label: 'PERLU REVISI' },
    [STATUS_SK.DALAM_PROSES]: { bg: '#DBEAFE', color: '#1D4ED8', label: 'DIVERIFIKASI' },
    [STATUS_SK.EXPIRED]: { bg: '#EDE9FE', color: '#5B21B6', label: 'KADALUARSA' },
    null: { bg: '#F3F4F6', color: '#6B7280', label: 'TERKUNCI' },
  };
  return map[status] ?? map[null];
};

const skKeteranganText = (status) => {
  if (status === STATUS_SK.SUDAH_TERBIT) return 'Dokumen SK TA telah terbit dan lengkap.';
  if (status === STATUS_SK.DALAM_PROSES) return 'Menunggu validasi dokumen SK TA oleh admin.';
  if (status === STATUS_SK.EXPIRED) return 'Masa berlaku SK TA telah habis, harap perpanjang.';
  if (status === STATUS_SK.BELUM_TERBIT) return 'Terdapat kesalahan pada pengajuan SK TA kamu.';
  return 'Selesaikan pengajuan SK TA terlebih dahulu.';
};

const RowBadge = ({ style: s, isTextOnly = false }) => (
  <span 
    className={`badge-prog ${isTextOnly ? 'text-only' : 'solid'}`} 
    style={{ background: isTextOnly ? 'transparent' : s.bg, color: s.color }}
  >
    {s.label}
  </span>
);

const TextLinkAction = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontSize: '13px',
      fontWeight: 800,
      background: 'none',
      border: 'none',
      color: disabled ? '#9CA3AF' : '#C0182A',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: 0,
      textDecoration: 'none',
      transition: 'color 0.2s',
    }}
    onMouseEnter={(e) => !disabled && (e.currentTarget.style.color = '#8B0F1E')}
    onMouseLeave={(e) => !disabled && (e.currentTarget.style.color = '#C0182A')}
  >
    {children}
  </button>
);

const DashboardMahasiswa = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useAuth();
  const { student } = useStudent();
  const activeStudentId = student?.mahasiswaId || student?.id || user?.id;

  const namaDisplay = student?.namaLengkap || user?.username || 'Mahasiswa';
  const nimDisplay = student?.nim || null;
  const prodiDisplay = student?.studyProgramNama || null;
  const kelasDisplay = student?.kelas || null;
  const angkatanDisplay = student?.angkatan || null;
  const dosenWaliDisplay = student?.dosenWaliNama || null;

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  
  const [skStatus, setSkStatus] = useState(null);
  const [sktaRequest, setSktaRequest] = useState(null);

  const [sidangRegStatus, setSidangRegStatus] = useState(null);
  const [sidangAssignedPeriode, setSidangAssignedPeriode] = useState(null);
  const [sidangResponse, setSidangResponse] = useState(null);

  // Pemisahan Periode Pendaftaran vs Pelaksanaan
  const [sidangPeriode, setSidangPeriode] = useState(null);
  const [sidangPelaksanaan, setSidangPelaksanaan] = useState(null);
  const [yudisiumPeriode, setYudisiumPeriode] = useState(null);
  const [yudisiumPelaksanaan, setYudisiumPelaksanaan] = useState(null);

  const [downloadingSk, setDownloadingSk] = useState(false);

  const handleUnduhSK = async () => {
    if (!sktaRequest?.id) return;
    setDownloadingSk(true);
    try {
      const blob = await downloadSK(sktaRequest.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = blob.filename || `SKTA_${namaDisplay}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Gagal unduh SK:', err);
      alert('Gagal mengunduh SK. Coba lagi.');
    } finally {
      setDownloadingSk(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!activeStudentId) {
      setLoadingDashboard(false);
      return;
    }

    setLoadingDashboard(true);
    try {
      const res = await api.get('/api/mahasiswa/dashboard');
      const payload = extractData(res);

      const skta = payload.sktaRequest || null;
      setSktaRequest(skta);
      const computedSkStatus = determineSkStatus(skta);
      setSkStatus(computedSkStatus);

      // PROSES DATA PERIODE (Berdasarkan Kategori) 
      const sidangPeriodsRaw = payload.sidangPeriods || [];
      const yudisiumPeriodsRaw = payload.yudisiumPeriods || [];

      const sDaftar = pickRelevantPeriod(sidangPeriodsRaw.filter(p => p.category?.toLowerCase() === 'pendaftaran sidang'));
      const sPelaksanaan = pickRelevantPeriod(sidangPeriodsRaw.filter(p => p.category?.toLowerCase() === 'sidang'));
      
      const yDaftar = pickRelevantPeriod(yudisiumPeriodsRaw.filter(p => p.category?.toLowerCase() === 'pendaftaran yudisium'));
      const yPelaksanaan = pickRelevantPeriod(yudisiumPeriodsRaw.filter(p => p.category?.toLowerCase() === 'yudisium'));

      setSidangPeriode(sDaftar);
      setSidangPelaksanaan(sPelaksanaan);
      setYudisiumPeriode(yDaftar);
      setYudisiumPelaksanaan(yPelaksanaan);

      if (computedSkStatus !== STATUS_SK.SUDAH_TERBIT) {
        setSidangRegStatus(STATUS_SIDANG.BELUM_DAFTAR);
        setSidangAssignedPeriode(null);
        setSidangResponse(null);
      } else {
        const rawSidangReg = payload.sidangRegistrations || [];
        const registration = normalizeRegistration(rawSidangReg);
        setSidangResponse(registration);

        if (!registration) {
          setSidangRegStatus(determineSidangStatus(null, null, null));
          setSidangAssignedPeriode(null);
        } else {
          const assignedPeriode = registration.sidangPeriodId
            ? sidangPeriodsRaw.find(p => p.id === registration.sidangPeriodId) ?? null
            : null;

          const status = determineSidangStatus(registration, null, assignedPeriode);
          setSidangRegStatus(status);
          setSidangAssignedPeriode(assignedPeriode);
        }
      }

    } catch (err) {
      console.error("Gagal memuat data dashboard:", err);
      setSkStatus(null);
      setSidangRegStatus(null);
    } finally {
      setLoadingDashboard(false);
    }
  }, [activeStudentId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const skTanggal = sktaRequest?.createdAt ? formatDateShort(sktaRequest.createdAt) : null;
  const deadlineSidang = sidangPeriode ? formatDateShort(sidangPeriode.endDate) : null;
  const skSudahTerbit = skStatus === STATUS_SK.SUDAH_TERBIT;

  const renderKeteranganSidang = () => {
    if (loadingDashboard) return <span style={{ color: '#9CA3AF' }}>—</span>;
    if (!skSudahTerbit) return <span style={{ color: '#9CA3AF' }}>Selesaikan pengajuan SK TA terlebih dahulu.</span>;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ color: '#4B5563', fontWeight: 500 }}>{getSidangKeteranganText(sidangRegStatus, sidangAssignedPeriode)}</span>
        {sidangRegStatus === STATUS_SIDANG.PERLU_REVISI && sidangResponse?.message && (
          <span style={{ color: '#C0182A', fontWeight: 700 }}>Catatan: {sidangResponse.message}</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-[#F4F6FB] min-h-screen">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content" className="flex-1 flex flex-col">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand text-white">Beranda</div>
        </header>

        <main className="page-body px-6 py-8 md:px-10 md:py-10" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>

          {/* Halo User Card */}
          <div className="dash-card-clean dash-welcome">
            <h2 className="dash-welcome-title">
              Halo {namaDisplay}! <span style={{ display: 'inline-block', transformOrigin: 'bottom right', animation: 'bounce 1s infinite' }}>👋</span>
            </h2>
            <div className="dash-welcome-meta">
              {nimDisplay && <span style={{ color: '#374151' }}>NIM: {nimDisplay}</span>}
              {prodiDisplay && <><span style={{ color: '#D1D5DB' }}>•</span><span style={{ color: '#374151' }}>{prodiDisplay}</span></>}
              {kelasDisplay && <><span style={{ color: '#D1D5DB' }}>•</span><span style={{ color: '#374151' }}>Kelas {kelasDisplay}</span></>}
              {angkatanDisplay && <><span style={{ color: '#D1D5DB' }}>•</span><span style={{ color: '#374151' }}>Angkatan {angkatanDisplay}</span></>}
            </div>
            
            {dosenWaliDisplay && (
              <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '20px' }}>
                Dosen Wali: <span style={{ fontWeight: 600, color: '#1F2937' }}>{dosenWaliDisplay}</span>
              </p>
            )}
            
            <p className="dash-welcome-desc">
              Semangat pengerjaan Tugas Akhirnya! Pastikan semua berkas persyaratanmu sudah
              lengkap dan tervalidasi
              {deadlineSidang ? (
                <>
                  {' '}sebelum <span style={{ fontWeight: 700, color: '#C0182A' }}>{deadlineSidang}</span>
                </>
              ) : ''}
              {' '}agar kamu bisa mengikuti jadwal sidang.
            </p>
          </div>

          {/* Timeline Card */}
          <div className="dash-card-clean dash-timeline">
            <div className="dash-timeline-header">
              <div>
                <div className="dash-timeline-overline">Timeline Pendaftaran Sidang TA & Yudisium</div>
                <h3 className="dash-timeline-title">
                  Periode Aktif: {sidangPeriode?.name || yudisiumPeriode?.name || 'Belum Tersedia'}
                </h3>
                <p className="dash-timeline-subtitle">Jadwal penting untuk pelaksanaan sidang semester ini.</p>
              </div>
              <div>
                <span className="dash-timeline-status">
                  {loadingDashboard ? 'MEMUAT...' : (sidangPeriode?.state === 'aktif' || yudisiumPeriode?.state === 'aktif' ? 'SEDANG BERLANGSUNG' : 'BELUM TERSEDIA')}
                </span>
              </div>
            </div>

            <div className="dash-timeline-grid">
              {/* Pendaftaran Sidang */}
              <div className="dash-timeline-item">
                <p className="dash-timeline-label">PENDAFTARAN SIDANG</p>
                {loadingDashboard ? (
                   <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p className="dash-timeline-val highlight">
                     {sidangPeriode ? `Maks. ${formatDateShort(sidangPeriode.endDate)}` : <span className="empty" style={{ fontSize: '13px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>

              {/* Pelaksanaan Sidang */}
              <div className="dash-timeline-item">
                <p className="dash-timeline-label">PELAKSANAAN SIDANG</p>
                {loadingDashboard ? (
                   <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p className="dash-timeline-val">
                     {sidangPelaksanaan ? formatDateRange(sidangPelaksanaan.startDate, sidangPelaksanaan.endDate) : <span className="empty" style={{ fontSize: '13px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>

              {/* Yudisium */}
              <div className="dash-timeline-item">
                <p className="dash-timeline-label">PENDAFTARAN YUDISIUM</p>
                {loadingDashboard ? (
                   <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p className="dash-timeline-val">
                     {yudisiumPeriode ? `Maks. ${formatDateShort(yudisiumPeriode.endDate)}` : <span className="empty" style={{ fontSize: '13px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>

              {/* Sidang Yudisium */}
              <div className="dash-timeline-item">
                <p className="dash-timeline-label">PELAKSANAAN YUDISIUM</p>
                {loadingDashboard ? (
                   <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p className="dash-timeline-val">
                     {yudisiumPelaksanaan ? formatDateRange(yudisiumPelaksanaan.startDate, yudisiumPelaksanaan.endDate) : <span className="empty" style={{ fontSize: '13px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabel Progres */}
          <div className="dash-progress">
            <div className="dash-progress-header">
              <h4 className="dash-progress-title">Detail Progres Registrasi</h4>
              <span className="dash-progress-meta">Terakhir diperbarui: {formatDateShort(new Date())}</span>
            </div>

            <div className="dash-card-clean">
              <div className="prog-table-wrap">
                <table className="prog-table">
                  <thead>
                    <tr>
                      <th className="col-tahapan">Tahapan</th>
                      <th className="col-status">Status</th>
                      <th className="col-ket">Keterangan / Revisi</th>
                      <th className="col-aksi">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Pengajuan SK */}
                    <tr>
                      <td>
                         <div className="prog-tahapan-title">Pengajuan SK TA</div>
                         <div className="prog-tahapan-sub">
                           {loadingDashboard ? 'Memuat...' : skTanggal ? `Diajukan: ${skTanggal}` : 'Belum diajukan'}
                         </div>
                      </td>
                      <td className="col-status">
                        {loadingDashboard ? <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} /> : <RowBadge style={skBadgeStyle(skStatus)} />}
                      </td>
                      <td className="col-ket">
                        {loadingDashboard ? <span style={{ color: '#9CA3AF' }}>—</span> : <RowBadge isTextOnly style={{ color: '#4B5563', label: skKeteranganText(skStatus) }} />}
                      </td>
                      <td className="col-aksi">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                          {loadingDashboard ? (
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
                          ) : skStatus === null ? (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pengajuan-sk')}>Mulai Pengajuan</TextLinkAction>
                          ) : skStatus === STATUS_SK.EXPIRED ? (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pengajuan-sk')}>Perpanjang SK</TextLinkAction>
                          ) : skStatus === STATUS_SK.SUDAH_TERBIT ? (
                            <>
                              <TextLinkAction onClick={() => navigate('/mahasiswa/pengajuan-sk')}>Lihat Detail</TextLinkAction>
                              {sktaRequest?.sktaDownloadUrl && (
                                <TextLinkAction onClick={handleUnduhSK}>Unduh SK</TextLinkAction>
                              )}
                            </>
                          ) : (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pengajuan-sk')}>Lihat Detail</TextLinkAction>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Pendaftaran Sidang */}
                    <tr>
                      <td>
                         <div className="prog-tahapan-title">Pendaftaran Sidang</div>
                         <div className="prog-tahapan-sub">
                           {sidangPeriode ? `Periode: ${formatDateRange(sidangPeriode.startDate, sidangPeriode.endDate)}` : 'Belum ada periode'}
                         </div>
                      </td>
                      <td className="col-status">
                        {loadingDashboard ? (
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                        ) : !skSudahTerbit ? (
                          <RowBadge style={LOCKED_BADGE} />
                        ) : (
                          <RowBadge style={toRowBadge(SIDANG_STATUS_CONFIG[sidangRegStatus] ?? SIDANG_STATUS_CONFIG[STATUS_SIDANG.BELUM_DAFTAR])} />
                        )}
                      </td>
                      <td className="col-ket">
                        {renderKeteranganSidang()}
                      </td>
                      <td className="col-aksi">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                          {loadingDashboard ? (
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
                          ) : !skSudahTerbit ? (
                            <TextLinkAction disabled>Daftar</TextLinkAction>
                          ) : sidangRegStatus === STATUS_SIDANG.BELUM_DAFTAR ? (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>Daftar</TextLinkAction>
                          ) : sidangRegStatus === STATUS_SIDANG.PROSES_REGISTRASI ? (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>Upload Berkas</TextLinkAction>
                          ) : sidangRegStatus === STATUS_SIDANG.PERLU_REVISI ? (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>Perbaiki Berkas</TextLinkAction>
                          ) : (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>Lihat Detail</TextLinkAction>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Pendaftaran Yudisium */}
                    <tr>
                      <td>
                         <div className="prog-tahapan-title">Pendaftaran Yudisium</div>
                         <div className="prog-tahapan-sub">
                           {yudisiumPeriode ? `Periode: ${formatDateRange(yudisiumPeriode.startDate, yudisiumPeriode.endDate)}` : 'Belum ada periode'}
                         </div>
                      </td>
                      <td className="col-status">
                        {loadingDashboard ? (
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                        ) : !skSudahTerbit || ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                          <RowBadge style={LOCKED_BADGE} />
                        ) : (
                          <RowBadge style={{ bg: '#DBEAFE', color: '#1E40AF', label: 'SIAP DAFTAR' }} />
                        )}
                      </td>
                      <td className="col-ket">
                        {loadingDashboard ? (
                          <span style={{ color: '#9CA3AF' }}>—</span>
                        ) : !skSudahTerbit || ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                          <RowBadge isTextOnly style={{ color: '#9CA3AF', label: 'Selesaikan Pendaftaran Sidang terlebih dahulu.' }} />
                        ) : (
                          <RowBadge isTextOnly style={{ color: '#4B5563', label: 'Silakan lengkapi berkas yudisium kamu.' }} />
                        )}
                      </td>
                      <td className="col-aksi">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                          {loadingDashboard ? (
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>—</span>
                          ) : !skSudahTerbit || ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) || !yudisiumPeriode?.isOpen ? (
                            <TextLinkAction disabled>Daftar</TextLinkAction>
                          ) : (
                            <TextLinkAction onClick={() => navigate('/mahasiswa/pendaftaran-yudisium')}>Daftar Yudisium</TextLinkAction>
                          )}
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>

        <footer className="page-footer" style={{ borderTop: '1px solid #E9EDF5', background: '#fff', padding: '16px', marginTop: 'auto' }}>
          <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', fontWeight: 600, margin: 0 }}>Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardMahasiswa;