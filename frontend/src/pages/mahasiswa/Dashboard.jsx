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
    style={{
      background: isTextOnly ? 'transparent' : s.bg,
      color: s.color,
      fontSize: isTextOnly ? '11px' : '8.5px',
      fontWeight: isTextOnly ? 600 : 800,
      padding: isTextOnly ? 0 : '4px 8px',
      borderRadius: '4px',
      textTransform: isTextOnly ? 'none' : 'uppercase',
      letterSpacing: isTextOnly ? 'normal' : '0.04em',
      display: 'inline-block'
    }}
  >
    {s.label}
  </span>
);

const TextLinkAction = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontSize: '11px',
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
  const rowSidangLoading = loadingDashboard;
  const skSudahTerbit = skStatus === STATUS_SK.SUDAH_TERBIT;

  const renderKeteranganSidang = () => {
    if (loadingDashboard) return <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span>;
    if (!skSudahTerbit) return <span style={{ color: '#9CA3AF', fontSize: '11px' }}>Selesaikan pengajuan SK TA terlebih dahulu.</span>;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ color: '#4B5563', fontWeight: 500, fontSize: '11px' }}>{getSidangKeteranganText(sidangRegStatus, sidangAssignedPeriode)}</span>
        {sidangRegStatus === STATUS_SIDANG.PERLU_REVISI && sidangResponse?.message && (
          <span style={{ color: '#C0182A', fontWeight: 700, fontSize: '10.5px' }}>Catatan: {sidangResponse.message}</span>
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
          <button className="topbar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand text-white">Beranda</div>
        </header>

        <main className="page-body px-4 py-6 md:px-8 md:py-8" style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px 30px', border: '1px solid #E9EDF5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Halo {namaDisplay}! <span style={{ display: 'inline-block', transformOrigin: 'bottom right', animation: 'bounce 1s infinite' }}>👋</span>
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#6B7280', marginBottom: '16px', fontWeight: 600 }}>
              {nimDisplay && <span style={{ color: '#374151' }}>NIM: {nimDisplay}</span>}
              {prodiDisplay && <><span style={{ color: '#D1D5DB' }}>•</span><span style={{ color: '#374151' }}>{prodiDisplay}</span></>}
              {kelasDisplay && <><span style={{ color: '#D1D5DB' }}>•</span><span style={{ color: '#374151' }}>Kelas {kelasDisplay}</span></>}
              {angkatanDisplay && <><span style={{ color: '#D1D5DB' }}>•</span><span style={{ color: '#374151' }}>Angkatan {angkatanDisplay}</span></>}
            </div>
            
            {dosenWaliDisplay && (
              <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
                Dosen Wali: <span style={{ fontWeight: 600, color: '#1F2937' }}>{dosenWaliDisplay}</span>
              </p>
            )}
            
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.6, maxWidth: '900px', margin: 0 }}>
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

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E9EDF5', borderLeft: '4px solid #C0182A', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '24px 30px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#C0182A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>Timeline Pendaftaran Sidang TA & Yudisium</div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>
                  Periode Aktif: {sidangPeriode?.name || yudisiumPeriode?.name || 'Belum Tersedia'}
                </h3>
                <p style={{ fontSize: '11.5px', color: '#6B7280', margin: 0 }}>Jadwal penting untuk pelaksanaan sidang semester ini.</p>
              </div>
              <div>
                <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '4px 10px', borderRadius: '9999px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-block' }}>
                  {loadingDashboard ? 'MEMUAT...' : (sidangPeriode?.state === 'aktif' || yudisiumPeriode?.state === 'aktif' ? 'SEDANG BERLANGSUNG' : 'BELUM TERSEDIA')}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: '#FAFBFD', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>PENDAFTARAN SIDANG</p>
                {loadingDashboard ? (
                   <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p style={{ fontSize: '13px', fontWeight: 800, color: '#C0182A', margin: 0 }}>
                     {sidangPeriode ? `Maks. ${formatDateShort(sidangPeriode.endDate)}` : <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>

              <div style={{ background: '#FAFBFD', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>PELAKSANAAN SIDANG</p>
                {loadingDashboard ? (
                   <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.4 }}>
                     {sidangPelaksanaan ? formatDateRange(sidangPelaksanaan.startDate, sidangPelaksanaan.endDate) : <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>

              <div style={{ background: '#FAFBFD', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>PENDAFTARAN YUDISIUM</p>
                {loadingDashboard ? (
                   <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: 0 }}>
                     {yudisiumPeriode ? `Maks. ${formatDateShort(yudisiumPeriode.endDate)}` : <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>

              <div style={{ background: '#FAFBFD', borderRadius: '10px', padding: '16px', border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>PELAKSANAAN YUDISIUM</p>
                {loadingDashboard ? (
                   <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                ) : (
                   <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: 0 }}>
                     {yudisiumPelaksanaan ? formatDateRange(yudisiumPelaksanaan.startDate, yudisiumPelaksanaan.endDate) : <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600 }}>Belum dijadwalkan</span>}
                   </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 6px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>Detail Progres Registrasi</h4>
              <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terakhir diperbarui: {formatDateShort(new Date())}</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E9EDF5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F3F4F6' }}>
                      <th style={{ padding: '14px 24px', fontSize: '9px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', width: '28%' }}>Tahapan</th>
                      <th style={{ padding: '14px 12px', fontSize: '9px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', width: '20%' }}>Status</th>
                      <th style={{ padding: '14px 12px', fontSize: '9px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', width: '37%' }}>Keterangan / Revisi</th>
                      <th style={{ padding: '14px 24px', fontSize: '9px', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', width: '15%', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>

                    <tr style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFBFD'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                         <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Pengajuan SK TA</div>
                         <div style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: 500 }}>
                           {loadingDashboard ? 'Memuat...' : skTanggal ? `Diajukan: ${skTanggal}` : 'Belum diajukan'}
                         </div>
                      </td>
                      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
                        {loadingDashboard ? <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} /> : <RowBadge style={skBadgeStyle(skStatus)} />}
                      </td>
                      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
                        {loadingDashboard ? <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span> : <RowBadge isTextOnly style={{ color: '#4B5563', label: skKeteranganText(skStatus) }} />}
                      </td>
                      <td style={{ padding: '16px 24px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          {loadingDashboard ? (
                            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span>
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

                    <tr style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFBFD'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                         <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Pendaftaran Sidang</div>
                         <div style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: 500 }}>
                           {sidangPeriode ? `Periode: ${formatDateRange(sidangPeriode.startDate, sidangPeriode.endDate)}` : 'Belum ada periode'}
                         </div>
                      </td>
                      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
                        {loadingDashboard ? (
                          <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                        ) : !skSudahTerbit ? (
                          <RowBadge style={LOCKED_BADGE} />
                        ) : (
                          <RowBadge style={toRowBadge(SIDANG_STATUS_CONFIG[sidangRegStatus] ?? SIDANG_STATUS_CONFIG[STATUS_SIDANG.BELUM_DAFTAR])} />
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
                        {renderKeteranganSidang()}
                      </td>
                      <td style={{ padding: '16px 24px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          {loadingDashboard ? (
                            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span>
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

                    <tr style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFBFD'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px', verticalAlign: 'top' }}>
                         <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>Pendaftaran Yudisium</div>
                         <div style={{ fontSize: '10.5px', color: '#6B7280', fontWeight: 500 }}>
                           {yudisiumPeriode ? `Periode: ${formatDateRange(yudisiumPeriode.startDate, yudisiumPeriode.endDate)}` : 'Belum ada periode'}
                         </div>
                      </td>
                      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
                        {loadingDashboard ? (
                          <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                        ) : !skSudahTerbit || ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                          <RowBadge style={LOCKED_BADGE} />
                        ) : (
                          <RowBadge style={{ bg: '#DBEAFE', color: '#1E40AF', label: 'SIAP DAFTAR' }} />
                        )}
                      </td>
                      <td style={{ padding: '16px 12px', verticalAlign: 'top' }}>
                        {loadingDashboard ? (
                          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span>
                        ) : !skSudahTerbit || ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                          <RowBadge isTextOnly style={{ color: '#9CA3AF', label: 'Selesaikan Pendaftaran Sidang terlebih dahulu.' }} />
                        ) : (
                          <RowBadge isTextOnly style={{ color: '#4B5563', label: 'Silakan lengkapi berkas yudisium kamu.' }} />
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          {loadingDashboard ? (
                            <span style={{ color: '#9CA3AF', fontSize: '11px' }}>—</span>
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

        <footer className="page-footer" style={{ borderTop: '1px solid #E9EDF5', background: '#fff', padding: '12px', marginTop: 'auto' }}>
          <p style={{ fontSize: '9.5px', color: '#9CA3AF', textAlign: 'center', fontWeight: 600, margin: 0 }}>Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardMahasiswa;