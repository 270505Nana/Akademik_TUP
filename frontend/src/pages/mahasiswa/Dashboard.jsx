import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Calendar, GraduationCap, SquarePen, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../dashboard.css';
import illustration from "../../assets/karakter-dashboard.png";
import { useAuth }    from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';

import {getSKTARequest, getSKTAResponse, getSktaResponseUploadByStudentId, getSidangPeriods, getYudisiumPeriods, getSidangRegistrationByStudentId, getSidangRegistrationResponse, getSidangRegistrationUploads, downloadSK } from '../../service/api';
import {determineSkStatus,unwrapResponse,STATUS_SK,} from '../../components/common/skStatusHelper';
import { STATUS_SIDANG, SIDANG_STATUS_CONFIG, determineSidangStatus} from '../../components/admin/sidang/sidangStatusHelper';

const pickActiveRegistration = (registrations) => {
  if (!Array.isArray(registrations) || registrations.length === 0) return null;
  const sorted = [...registrations].sort((a, b) => b.id - a.id);
  const submitted = sorted.find(r => r.isDraft === false);
  if (submitted) return submitted;
  const filledDraft = sorted.find(r => r.isDraft === true && r.programType !== null);
  if (filledDraft) return filledDraft;
  return null;
};

const toRowBadge = (cfg) => ({
  bg    : cfg.bg,
  border: cfg.border,
  color : cfg.color,
  label : cfg.label,
});

const SIDANG_KETERANGAN_LABEL = {
  [STATUS_SIDANG.BELUM_DAFTAR]         : 'Belum Mengisi Formulir',
  [STATUS_SIDANG.DRAFT]                : 'Proses Registrasi',
  [STATUS_SIDANG.DALAM_PROSES]         : 'Menunggu Verifikasi',
  [STATUS_SIDANG.PERLU_REVISI]         : 'Berkas Perlu Diperbaiki',
  [STATUS_SIDANG.REVISI_DIPERBARUI]    : 'Menunggu Reverifikasi',
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA] : 'Menunggu Jadwal Aktif',
  [STATUS_SIDANG.SIAP_SIDANG]          : 'Periode Sidang Aktif',
};

const getSidangKeteranganBadge = (status) => {
  const cfg = SIDANG_STATUS_CONFIG[status];
  if (!cfg) return { bg: '#F3F4F6', border: '#9CA3AF', color: '#6B7280', label: '—' };
  return {
    bg    : cfg.bg,
    border: cfg.border,
    color : cfg.color,
    label : SIDANG_KETERANGAN_LABEL[status] ?? cfg.label,
  };
};

const LOCKED_BADGE = { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E', label: 'Selesaikan Proses Registrasi Sebelumnya' };

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


const PeriodeCard = ({ icon, title, periode, isLoading }) => {
  const stateConfig = {
    aktif     : { badge: 'Aktif',     bg: '#22C55E', text: '#fff' },
    mendatang : { badge: 'Mendatang', bg: '#3B82F6', text: '#fff' },
    selesai   : { badge: 'Selesai',   bg: '#9CA3AF', text: '#fff' },
  };
  const cfg = periode ? (stateConfig[periode.state] || stateConfig.selesai) : null;

  return (
    <div className="CardAtas4">
      <div className="CardAtas4-header">
        <div className="CardAtas4-icon">{icon}</div>
        {!isLoading && cfg && (
          <span className="CardAtas4-badge" style={{ background: cfg.bg, color: cfg.text }}>
            {cfg.badge}
          </span>
        )}
      </div>
      <div className="CardAtas4-body">
        <div className="CardAtas4-label">{title}</div>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Memuat...</span>
          </div>
        ) : periode ? (
          <div
            className="CardAtas4-value"
            dangerouslySetInnerHTML={{
              __html: `${periode.name}<br/><span class='text-sm font-normal text-gray-500'>${formatDateRange(periode.startDate, periode.endDate)}</span>`,
            }}
          />
        ) : (
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Tidak ada periode aktif</div>
        )}
      </div>
      <div className="CardAtas4-footer">
        <div className="CardAtas4-divider" />
        <div className="CardAtas4-sub">
          {periode ? `Berlaku hingga ${formatDateShort(periode.endDate)}` : '—'}
        </div>
      </div>
    </div>
  );
};

const skBadgeStyle = (status) => {
  const map = {
    [STATUS_SK.SUDAH_TERBIT] : { bg: '#D1FAE5', border: '#10B981', color: '#059669', label: 'Sudah Terbit'    },
    [STATUS_SK.BELUM_TERBIT] : { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E', label: 'Belum Terbit'    },
    [STATUS_SK.DALAM_PROSES] : { bg: '#DBEAFE', border: '#3B82F6', color: '#1D4ED8', label: 'Dalam Proses'    },
    [STATUS_SK.EXPIRED]      : { bg: '#EDE9FE', border: '#8B5CF6', color: '#5B21B6', label: 'Kadaluarsa'      },
    null                     : { bg: '#F3F4F6', border: '#9CA3AF', color: '#6B7280', label: 'Belum Mengajukan' },
  };
  return map[status] ?? map[null];
};

const skKeteranganStyle = (status) => {
  if (status === STATUS_SK.SUDAH_TERBIT) return { bg: '#D1FAE5', border: '#10B981', color: '#059669', label: 'Dokumen Sudah Lengkap' };
  if (status === STATUS_SK.DALAM_PROSES) return { bg: '#DBEAFE', border: '#3B82F6', color: '#1D4ED8', label: 'Menunggu Verifikasi'   };
  if (status === STATUS_SK.EXPIRED)      return { bg: '#EDE9FE', border: '#8B5CF6', color: '#5B21B6', label: 'Perlu Diperbaharui'    };
  if (status === STATUS_SK.BELUM_TERBIT) return { bg: '#FEF3C7', border: '#F59E0B', color: '#92400E', label: 'Perlu Perbaikan'       };
  return { bg: '#F3F4F6', border: '#9CA3AF', color: '#6B7280', label: '—' };
};

const RowBadge = ({ style: s }) => (
  <span style={{
    fontSize: '10px', fontWeight: 700, padding: '3px 14px',
    borderRadius: '9999px', background: s.bg,
    border: `1.5px solid ${s.border}`, color: s.color,
  }}>
    {s.label}
  </span>
);

const BtnOutline = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{ fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '9999px', background: '#fff', border: '1.5px solid #9CA3AF', color: '#374151', cursor: 'pointer' }}
  >
    {children}
  </button>
);

const BtnRed = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      fontSize: '10px', fontWeight: 700, padding: '4px 14px',
      borderRadius: '9999px',
      background: disabled ? '#9CA3AF' : '#C0182A',
      border: `1.5px solid ${disabled ? '#9CA3AF' : '#C0182A'}`,
      color: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
    }}
  >
    {children}
  </button>
);

const DashboardMahasiswa = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user }    = useAuth();
  const { student } = useStudent();

  const namaDisplay      = student?.namaLengkap      || user?.username || 'Mahasiswa';
  const nimDisplay       = student?.nim              || null;
  const prodiDisplay     = student?.studyProgramNama || null;
  const kelasDisplay     = student?.kelas            || null;
  const angkatanDisplay  = student?.angkatan         || null;
  const dosenWaliDisplay = student?.dosenWaliNama    || null;

  const [skStatus,    setSkStatus]    = useState(null);
  const [skUploads,   setSkUploads]   = useState([]);
  const [sktaRequest, setSktaRequest] = useState(null);
  const [loadingSk,   setLoadingSk]   = useState(true);

  const [sidangRegStatus,  setSidangRegStatus]  = useState(null);
  const [loadingSidangReg, setLoadingSidangReg] = useState(false);

  const [sidangPeriode,   setSidangPeriode]   = useState(null);
  const [yudisiumPeriode, setYudisiumPeriode] = useState(null);
  const [loadingPeriode,  setLoadingPeriode]  = useState(true);

  // download SK
  const [downloadingSk, setDownloadingSk] = useState(false);

  // axios download sk
  const handleUnduhSK = async () => {
    const uploadId = skUploads?.[0]?.id;
    if (!uploadId) return;
    setDownloadingSk(true);
    try {
      const blob = await downloadSK(uploadId);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `SK_TA_${namaDisplay}_${new Date().toISOString().slice(0, 10)}.pdf`;
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

  const fetchSkStatus = useCallback(async () => {
    const studentId = student?.studentId;
    if (!studentId) { setLoadingSk(false); return; }
    setLoadingSk(true);
    try {
      const request = await getSKTARequest(studentId);
      if (!request) { setSkStatus(null); setLoadingSk(false); return; }
      setSktaRequest(request);
      const [rawResponse, uploadsRaw] = await Promise.all([
        getSKTAResponse(request.id).catch(() => null),
        getSktaResponseUploadByStudentId(studentId).catch(() => null),
      ]);
      const unwrapped = unwrapResponse(rawResponse);
      const uploads   = uploadsRaw?.data ?? uploadsRaw ?? [];
      setSkUploads(uploads);
      setSkStatus(determineSkStatus(unwrapped, uploads));
    } catch (err) {
      console.error('Gagal fetch SK status:', err);
      setSkStatus(null);
    } finally {
      setLoadingSk(false);
    }
  }, [student?.studentId]);

  useEffect(() => { fetchSkStatus(); }, [fetchSkStatus]);

  useEffect(() => {
    const fetchSidangRegStatus = async () => {
      const studentId = student?.studentId;

      if (!studentId || skStatus !== STATUS_SK.SUDAH_TERBIT) {
        setSidangRegStatus(STATUS_SIDANG.BELUM_DAFTAR);
        setLoadingSidangReg(false);
        return;
      }

      setLoadingSidangReg(true);
      try {
        const rawRegistrations = await getSidangRegistrationByStudentId(studentId);
        const registrationsArray = Array.isArray(rawRegistrations)
          ? rawRegistrations
          : (rawRegistrations ? [rawRegistrations] : []);

        const registration = pickActiveRegistration(registrationsArray);

        if (!registration) {
          setSidangRegStatus(determineSidangStatus(null, null, null, []));
          return;
        }

        const [response, uploadsRaw] = await Promise.all([
          getSidangRegistrationResponse(registration.id).catch(() => null),
          getSidangRegistrationUploads(registration.id).catch(() => []),
        ]);

        const uploads = Array.isArray(uploadsRaw) ? uploadsRaw : [];
        const status  = determineSidangStatus(registration, response, null, uploads);
        setSidangRegStatus(status);

      } catch (err) {
        console.error('Gagal fetch sidang registration status:', err);
        setSidangRegStatus(null);
      } finally {
        setLoadingSidangReg(false);
      }
    };

    if (!loadingSk) fetchSidangRegStatus();
  }, [skStatus, loadingSk, student?.studentId]);

  useEffect(() => {
    const fetchPeriode = async () => {
      setLoadingPeriode(true);
      try {
        const [sidangList, yudisiumList] = await Promise.all([
          getSidangPeriods().catch(() => []),
          getYudisiumPeriods().catch(() => []),
        ]);
        setSidangPeriode(pickRelevantPeriod(sidangList));
        setYudisiumPeriode(pickRelevantPeriod(yudisiumList));
      } catch (err) {
        console.error('Gagal fetch periode:', err);
      } finally {
        setLoadingPeriode(false);
      }
    };
    fetchPeriode();
  }, []);

  const skTanggal = sktaRequest?.sktaRequestUploads?.[0]?.createdAt
    ? formatDateShort(sktaRequest.sktaRequestUploads[0].createdAt)
    : null;
  const deadlineSidang = sidangPeriode
    ? new Date(sidangPeriode.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const rowSidangLoading = loadingSk || loadingSidangReg;
  const skSudahTerbit    = skStatus === STATUS_SK.SUDAH_TERBIT;

  return (
    <div className="flex bg-[#F4F6FB] min-h-screen">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content" className="flex-1">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand">Beranda</div>
        </header>

        <main className="page-body">

          {/* Welcome Banner */}
          <div className="section-card p-0 shadow-sm border-none overflow-hidden mb-6 bg-white">
            <div className="grid xl:grid-cols-12 gap-0">
              <div
                className="xl:col-span-4 bg-[#FAFBFD] p-4 flex items-center justify-center border-r border-gray-100"
                style={{ maxHeight: '280px', overflow: 'hidden' }}
              >
                <div className="relative w-full max-w-[240px]">
                  <img
                    src={illustration}
                    alt="Dashboard Illustration"
                    style={{ width: '100%', height: 'auto', maxHeight: '220px', objectFit: 'contain' }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="xl:col-span-8 p-8 md:p-10">
                <h2 className="text-2xl font-extrabold text-[#C0182A] mb-4">
                  Selamat Datang di SIMTA
                </h2>
                <div className="w-16 h-1 bg-primary mb-6 rounded-full" />
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  SIMTA (Sistem Informasi Manajemen Tugas Akhir) adalah platform utama bagi mahasiswa
                  untuk mengelola seluruh rangkaian tugas akhir secara digital dan terintegrasi. Menu
                  Status TA/PA Mahasiswa merupakan sub-menu dari kategori Daftar TA/PA yang berfungsi
                  sebagai dasbor interaktif untuk memantau progres akademik kamu secara real-time.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Melalui menu ini, kamu dapat melihat dan menyelesaikan tahapan pengambilan TA/PA
                  secara sistematis, mulai dari pengajuan proposal dokumen, pemilihan dosen pembimbing,
                  hingga memantau validasi Surat Keputusan (SK).
                </p>
              </div>
            </div>
          </div>

          {/* Halo User */}
          <div className="section-card p-8 bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex flex-col gap-2 max-w-2xl text-right ml-auto">
              <h3 className="text-xl font-bold text-gray-900 flex items-center justify-end gap-2">
                Halo {namaDisplay}! <span className="animate-bounce">👋</span>
              </h3>
              <div className="flex items-center justify-end gap-2 flex-wrap mb-1">
                {nimDisplay && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    NIM: {nimDisplay}
                  </span>
                )}
                {prodiDisplay && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {prodiDisplay}
                  </span>
                )}
                {kelasDisplay && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    Kelas {kelasDisplay}
                  </span>
                )}
                {angkatanDisplay && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    Angkatan {angkatanDisplay}
                  </span>
                )}
              </div>
              {dosenWaliDisplay && (
                <p className="text-xs text-gray-400 mb-2">
                  Dosen Wali:{' '}
                  <span className="font-semibold text-gray-600">{dosenWaliDisplay}</span>
                </p>
              )}
              <p className="text-sm text-gray-600 leading-relaxed mb-2">
                Semangat pengerjaan Tugas Akhirnya! Pastikan semua berkas persyaratanmu sudah
                lengkap dan tervalidasi
                {deadlineSidang ? (
                  <>
                    {' '}sebelum{' '}
                    <span className="font-bold text-primary underline decoration-2 underline-offset-4">
                      {deadlineSidang}
                    </span>
                    {' '}agar kamu bisa mengikuti jadwal sidang.
                  </>
                ) : ' agar proses administrasimu berjalan lancar.'}
              </p>
            </div>
            <div className="hidden lg:block text-[#D66E79]/10 ml-8">
              <GraduationCap size={140} strokeWidth={1} />
            </div>
          </div>

          {/* Periode Cards */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6 border-l-4 border-primary pl-3">
              Jadwal Periode Sidang Terkini
            </h4>
            <div className="stat-grid">
              <PeriodeCard
                icon={<Calendar size={28} color="#C0182A" />}
                title="Pendaftaran Sidang"
                periode={sidangPeriode}
                isLoading={loadingPeriode}
              />
              <PeriodeCard
                icon={<SquarePen size={28} color="#C0182A" />}
                title="Pendaftaran Yudisium"
                periode={yudisiumPeriode}
                isLoading={loadingPeriode}
              />
              <div className="CardAtas4">
                <div className="CardAtas4-header">
                  <div className="CardAtas4-icon">
                    <div style={{
                      width: 28, height: 28, background: '#C0182A', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 900, fontStyle: 'italic', fontSize: 16,
                    }}>L</div>
                  </div>
                </div>
                <div className="CardAtas4-body">
                  <div className="CardAtas4-label">Pelaksanaan Sidang</div>
                  <div className="CardAtas4-value">
                    {loadingPeriode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Memuat...</span>
                      </div>
                    ) : sidangPeriode ? (
                      <div dangerouslySetInnerHTML={{
                        __html: `Pelaksanaan Sidang<br/><span class='text-sm font-normal text-gray-500'>${formatDateRange(sidangPeriode.startDate, sidangPeriode.endDate)}</span>`,
                      }} />
                    ) : (
                      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Belum dijadwalkan</div>
                    )}
                  </div>
                </div>
                <div className="CardAtas4-footer">
                  <div className="CardAtas4-divider" />
                  <div className="CardAtas4-sub">Jadwal dapat berubah sewaktu-waktu</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Progres */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-2 border-l-4 border-primary pl-3">
              Progres Registrasi Kamu
            </h4>
            <p className="text-xs text-muted mb-6 pl-3">
              Lacak setiap tahapan administrasi tugas akhirmu secara real-time.
            </p>

            <div className="section-card border border-gray-100 shadow-sm" style={{ overflow: 'visible' }}>
              <div className="table-scroll-wrap">
                <table className="simta-table">
                  <thead>
                    <tr>
                      <th className="w-16">No</th>
                      <th className="min-w-[200px]">Tahap Pendaftaran</th>
                      <th className="w-48">Status</th>
                      <th className="min-w-[240px]">Keterangan</th>
                      <th className="min-w-[220px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Pengajuan SK */}
                    <tr style={{ background: '#fff' }}>
                      <td className="py-5 px-4 text-center font-bold text-gray-500 border border-gray-200">1</td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">Pengajuan SK</span>
                          <span className="text-[10px] text-gray-400">
                            {loadingSk
                              ? 'Memuat...'
                              : skTanggal
                                ? `Diajukan pada: ${skTanggal}`
                                : 'Belum diajukan'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {loadingSk
                            ? <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                            : <RowBadge style={skBadgeStyle(skStatus)} />
                          }
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {loadingSk
                            ? <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                            : <RowBadge style={skKeteranganStyle(skStatus)} />
                          }
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                          {loadingSk ? (
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                          ) : skStatus === null ? (
                            <BtnRed onClick={() => navigate('/mahasiswa/pengajuan-sk')}>
                              &gt; Ajukan SK TA
                            </BtnRed>
                          ) : skStatus === STATUS_SK.EXPIRED ? (
                            <BtnRed onClick={() => navigate('/mahasiswa/pengajuan-sk')}>
                              &gt; Perbarui SK
                            </BtnRed>
                          ) : skStatus === STATUS_SK.SUDAH_TERBIT ? (
                            <>
                              <BtnOutline onClick={() => navigate('/mahasiswa/pengajuan-sk')}>
                                Lihat Respon
                              </BtnOutline>
                              {skUploads?.[0]?.id && (
                                <BtnRed
                                  onClick={handleUnduhSK}
                                  disabled={downloadingSk}
                                >
                                  {downloadingSk ? 'Mengunduh...' : 'Unduh SK'}
                                </BtnRed>
                              )}
                            </>
                          ) : (
                            <BtnOutline onClick={() => navigate('/mahasiswa/pengajuan-sk')}>
                              Lihat Respon
                            </BtnOutline>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Pendaftaran Sidang */}
                    <tr style={{ background: '#fff' }}>
                      <td className="py-5 px-4 text-center font-bold text-gray-500 border border-gray-200">2</td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">Pendaftaran Sidang</span>
                          <span className="text-[10px] text-gray-400">
                            {sidangPeriode
                              ? `Periode: ${formatDateRange(sidangPeriode.startDate, sidangPeriode.endDate)}`
                              : 'Belum ada periode aktif'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {rowSidangLoading ? (
                            <Loader size={14} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                          ) : !skSudahTerbit ? (
                            <RowBadge style={LOCKED_BADGE} />
                          ) : (
                            <RowBadge style={toRowBadge(
                              SIDANG_STATUS_CONFIG[sidangRegStatus]
                              ?? SIDANG_STATUS_CONFIG[STATUS_SIDANG.BELUM_DAFTAR]
                            )} />
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {rowSidangLoading ? (
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                          ) : !skSudahTerbit ? (
                            <RowBadge style={LOCKED_BADGE} />
                          ) : (
                            <RowBadge style={getSidangKeteranganBadge(sidangRegStatus)} />
                          )}
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {rowSidangLoading ? (
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                          ) : !skSudahTerbit ? (
                            <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>
                              Selesaikan SK terlebih dahulu
                            </span>
                          ) : sidangRegStatus === STATUS_SIDANG.BELUM_DAFTAR ? (
                            <BtnRed onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>
                              &gt; Daftar Sidang
                            </BtnRed>
                          ) : sidangRegStatus === STATUS_SIDANG.DRAFT ? (
                            <BtnRed onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>
                              &gt; Lanjutkan Form
                            </BtnRed>
                          ) : (
                            <BtnOutline onClick={() => navigate('/mahasiswa/pendaftaran-sidang')}>
                              Lihat Status
                            </BtnOutline>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Pendaftaran Yudisium */}
                    <tr style={{ background: '#fff' }}>
                      <td className="py-5 px-4 text-center font-bold text-gray-500 border border-gray-200">3</td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">Pendaftaran Yudisium</span>
                          <span className="text-[10px] text-gray-400">
                            {yudisiumPeriode
                              ? `Periode: ${formatDateRange(yudisiumPeriode.startDate, yudisiumPeriode.endDate)}`
                              : 'Belum ada periode aktif'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {!skSudahTerbit ? (
                            <RowBadge style={LOCKED_BADGE} />
                            
                          ) : ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                            <RowBadge style={LOCKED_BADGE} />
                          ) : (
                            <RowBadge style={{ bg: '#DBEAFE', border: '#93C5FD', color: '#1E40AF', label: 'Siap Daftar' }} />
                          )}
                        </div>
                      </td>

                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {!skSudahTerbit ? (
                            <RowBadge style={LOCKED_BADGE} />
                            
                          ) : ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                            <RowBadge style={{ bg: '#FEF3C7', border: '#F59E0B', color: '#92400E', label: 'Selesaikan Sidang dulu' }} />
                          ) : (
                            <RowBadge style={{ bg: '#DCFCE7', border: '#86EFAC', color: '#166534', label: 'Siap Mendaftar' }} />
                          )}
                        </div>
                      </td>

                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          {!skSudahTerbit || ![STATUS_SIDANG.PENDAFTARAN_DITERIMA, STATUS_SIDANG.SIAP_SIDANG].includes(sidangRegStatus) ? (
                            <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>
                              {!skSudahTerbit
                                ? 'Selesaikan SK terlebih dahulu'
                                : 'Selesaikan Pendaftaran Sidang dahulu'}
                            </span>
                          ) : yudisiumPeriode?.isOpen ? (
                            <BtnRed onClick={() => navigate('/mahasiswa/pendaftaran-yudisium')}>
                              &gt; Lanjutkan Pendaftaran
                            </BtnRed>
                          ) : (
                            <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>
                              Belum ada periode aktif
                            </span>
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

        <footer className="page-footer">
          Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi
        </footer>
      </div>
    </div>
  );
};

export default DashboardMahasiswa;