import React, { useState, useEffect } from 'react';
import {CalendarCheck, FileText, Printer, Filter, Download, MoreVertical, Activity, Clock, AlertCircle, ArrowRightCircle, ChevronLeft, ChevronRight,Eye, CheckCircle2, Menu, Users, Loader} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import VerifikasiBerkasModal from '../../components/admin/sidang/VerifikasiBerkasModal';
import { useAuth } from '../../context/AuthContext';
import {getSidangPeriods,getAllSidangRegistrations,getAllSktaRequests,} from '../../service/api';
import {determineSidangStatus,STATUS_SIDANG,SIDANG_STATUS_CONFIG,} from '../../components/admin/sidang/Sidangstatushelper';
import '../dashboard.css';

const MONITORING_PAGE_SIZE = 25;
const ACTIVITY_LIMIT = 5;

const ACTIVITY_COLORS = [
  'linear-gradient(135deg,#667EEA,#764BA2)',
  'linear-gradient(135deg,#4FACFE,#00F2FE)',
  'linear-gradient(135deg,#FA709A,#FEE140)',
  'linear-gradient(135deg,#43E97B,#38F9D7)',
  'linear-gradient(135deg,#FF9A9E,#FAD0C4)',
];

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatActivityTime = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const MONITORING_SORT_PRIORITY = {
  TAHAP_1: 0,
  [STATUS_SIDANG.DALAM_PROSES]: 1,
  [STATUS_SIDANG.SIAP_SIDANG]: 2,
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA]: 3,
  [STATUS_SIDANG.PERLU_REVISI]: 4,
  [STATUS_SIDANG.REVISI_DIPERBARUI]: 5,
};

const pickPrimaryRegistrationPerStudent = (registrations = []) => {
  const grouped = {};
  registrations.forEach((r) => {
    const sid = r.mahasiswaId;
    if (!grouped[sid]) grouped[sid] = [];
    grouped[sid].push(r);
  });

  return Object.values(grouped).map((group) => {
    const withSubmission = group.filter((r) => r.thesisTitleId);
    if (withSubmission.length > 0) {
      return withSubmission.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];
    }
    return group.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
  });
};

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

const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.setHours(23, 59, 59, 999) - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

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
      <div className="CardAtas4-sub">{sub}</div>
    </div>
  </div>
);

const StatusRegistBadge = ({ statusKey, statusLabel }) => {
  if (!statusKey) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        fontSize: 10, fontWeight: 700, padding: '3px 10px',
        borderRadius: 9999, background: '#F1F5F9',
        border: '1.5px solid #E2E8F0', color: '#64748B', whiteSpace: 'nowrap',
      }}>
        {statusLabel}
      </span>
    );
  }
  const cfg = SIDANG_STATUS_CONFIG[statusKey];
  if (!cfg) return <span style={{ fontSize: 10, color: '#9CA3AF' }}>{statusLabel}</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999, background: cfg.badgeBg,
      border: `1.5px solid ${cfg.borderColor}`, color: cfg.badgeColor, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const MonitoringProgress = ({ onShowToast }) => {
  const { profile } = useAuth();

  const [rows, setRows]               = useState([]);
  const [periodMap, setPeriodMap]     = useState({});
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReg, setSelectedReg] = useState(null);

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const [allRegsRaw, allPeriods] = await Promise.all([
        getAllSidangRegistrations(),
        getSidangPeriods().catch(() => []),
      ]);

      const allRegs = allRegsRaw ?? [];

      const prdMap = {};
      (allPeriods ?? []).forEach((p) => { prdMap[p.id] = p; });
      setPeriodMap(prdMap);

      const primaryList = pickPrimaryRegistrationPerStudent(allRegs);

      const computedRows = primaryList.map((r) => {
        const hasSubmitted = !!r.thesisTitleId;
        const prodiName = r.student?.studyProgram?.name ?? '-';

        if (!hasSubmitted) {
          return {
            id: r.id,
            mahasiswaId: r.mahasiswaId,
            name: r.student?.name || `Mahasiswa #${r.mahasiswaId}`,
            nim: r.student?.nim || '-',
            prodi: prodiName,
            tahap: 'Tahap 1',
            percent: 50,
            statusKey: null,
            statusLabel: 'Proses Registrasi',
            sortDate: r.createdAt,
            registration: r,
          };
        }

        const period    = r.sidangPeriodId ? prdMap[r.sidangPeriodId] : null;
        const statusKey = determineSidangStatus(r, null, period);

        return {
          id: r.id,
          mahasiswaId: r.mahasiswaId,
          name: r.student?.name || `Mahasiswa #${r.mahasiswaId}`,
          nim: r.student?.nim || '-',
          prodi: prodiName,
          tahap: 'Tahap 2',
          percent: 100,
          statusKey,
          statusLabel: SIDANG_STATUS_CONFIG[statusKey]?.label ?? statusKey,
          sortDate: r.updatedAt || r.createdAt,
          registration: r,
        };
      });
      computedRows.sort((a, b) => {
        const priorityKeyA = a.statusKey ?? 'TAHAP_1';
        const priorityKeyB = b.statusKey ?? 'TAHAP_1';
        const priorityA = MONITORING_SORT_PRIORITY[priorityKeyA] ?? 99;
        const priorityB = MONITORING_SORT_PRIORITY[priorityKeyB] ?? 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(b.sortDate) - new Date(a.sortDate);
      });
      setRows(computedRows);
    } catch (err) {
      console.error('Gagal fetch data monitoring:', err);
      onShowToast?.('Gagal memuat data monitoring progres sidang.', <AlertCircle size={14} />, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMonitoringData(); }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / MONITORING_PAGE_SIZE));
  const paginated  = rows.slice(
    (currentPage - 1) * MONITORING_PAGE_SIZE,
    currentPage * MONITORING_PAGE_SIZE
  );

  const handleModalSaved = () => {
    setSelectedReg(null);
    fetchMonitoringData();
    onShowToast?.('Verifikasi berkas berhasil disimpan.', <CheckCircle2 size={14} />, 'success');
  };

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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '52px 0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Loader size={22} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Memuat data monitoring...</span>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '52px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  Belum ada data mahasiswa.
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center fw-semibold" style={{ color: 'var(--text-muted)' }}>
                    {(currentPage - 1) * MONITORING_PAGE_SIZE + idx + 1}
                  </td>
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
                      <div className="progres-badge">{item.tahap}</div>
                      <div className="progres-bar-wrap">
                        <div
                          className="progres-bar-fill"
                          style={{
                            width: `${item.percent}%`,
                            background: item.percent === 100 ? 'linear-gradient(90deg,#22C55E,#16A34A)' : undefined,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <StatusRegistBadge statusKey={item.statusKey} statusLabel={item.statusLabel} />
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {item.statusKey ? (
                        <button
                          className="btn-detail"
                          onClick={(e) => { e.stopPropagation(); setSelectedReg(item.registration); }}
                        >
                          Detail
                        </button>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: 12 }}>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="page-info">
          Menampilkan <strong>{paginated.length === 0 ? 0 : (currentPage - 1) * MONITORING_PAGE_SIZE + 1}–{Math.min(currentPage * MONITORING_PAGE_SIZE, rows.length)}</strong> dari <strong>{rows.length}</strong>
        </span>
        <div className="flex gap-2">
          <button
            className="btn-paging"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn-paging"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {selectedReg && (
          <VerifikasiBerkasModal
            registration={selectedReg}
            academicStaffId={profile?.id}
            periodMap={periodMap}
            onClose={() => setSelectedReg(null)}
            onSaved={handleModalSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        getAllSktaRequests(),
        getAllSidangRegistrations(),
      ]);
      const [skResult, sidangResult] = results;

      const combined = [];
      if (skResult.status === 'fulfilled') {
        const raw = skResult.value;
        const sktaList = raw?.data ?? raw ?? [];
        (Array.isArray(sktaList) ? sktaList : []).forEach((r) => {
          const name = r.student?.name || `Mahasiswa #${r.mahasiswaId}`;

          const submittedAt =
            r.sktaRequestUploads?.[0]?.createdAt ??
            r.createdAt ??
            r.updatedAt ??
            null;

          if (!submittedAt) {
            console.warn('[Aktivitas] SK request tanpa timestamp yang bisa dipakai:', r);
            return;
          }

          combined.push({
            key: `sk-${r.id}`,
            name,
            action: 'mengajukan SK Pembimbing Tugas Akhir.',
            time: submittedAt,
          });
        });
      } else {
        console.error('Gagal fetch skta requests (aktivitas):', skResult.reason);
      }
      if (sidangResult.status === 'fulfilled') {
        const list = sidangResult.value ?? [];
        list.filter((r) => r.thesisTitleId).forEach((r) => {
          const name = r.student?.name || `Mahasiswa #${r.mahasiswaId}`;
          combined.push({
            key: `sidang-${r.id}`,
            name,
            action: 'mendaftar Sidang Tugas Akhir.',
            time: r.createdAt,
          });
        });
      } else {
        console.error('Gagal fetch sidang registrations (aktivitas):', sidangResult.reason);
      }

      combined.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivities(combined.slice(0, ACTIVITY_LIMIT));
      setLoading(false);
    };

    fetchActivities();
  }, []);

  return (
    <div className="activity-card mt-0">
      <div className="ac-header">
        <h6><Activity size={14} className="inline mr-2" style={{ color: 'var(--primary)' }} />Aktivitas</h6>
        <a href="#">Semua</a>
      </div>
      <div className="activity-list">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Loader size={18} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
            Belum ada aktivitas terbaru.
          </div>
        ) : (
          activities.map((act, idx) => (
            <div className="activity-item" key={act.key}>
              <div className="act-avatar" style={{ background: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length] }}>
                {getInitials(act.name)}
              </div>
              <div>
                <div className="act-text"><strong>{act.name}</strong> {act.action}</div>
                <div className="act-time"><Clock size={10} className="inline mr-1" /> {formatActivityTime(act.time)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const DashboardAkademik = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts]           = useState([]);

  const [periodeAktif, setPeriodeAktif]     = useState(null);
  const [totalPendaftar, setTotalPendaftar] = useState(null);
  const [jumlahSK, setJumlahSK]             = useState(null);

  const [loadingCards, setLoadingCards] = useState({
    periode: true,
    pendaftar: true,
    sk: true,
  });

  useEffect(() => {
    const fetchSummaryCards = async () => {
      const results = await Promise.allSettled([
        getSidangPeriods(),
        getAllSidangRegistrations(),
        getAllSktaRequests(),
      ]);

      const [periodeResult, pendaftarResult, skResult] = results;

      // Card 1: Periode Aktif
      if (periodeResult.status === 'fulfilled') {
        const periods = periodeResult.value ?? [];
        setPeriodeAktif(pickRelevantPeriod(periods));
      } else {
        console.error('Gagal fetch sidang periods:', periodeResult.reason);
      }
      setLoadingCards(prev => ({ ...prev, periode: false }));

      if (pendaftarResult.status === 'fulfilled') {
        const registrations = pendaftarResult.value ?? [];
        setTotalPendaftar(registrations.length);
      } else {
        console.error('Gagal fetch sidang registrations:', pendaftarResult.reason);
      }
      setLoadingCards(prev => ({ ...prev, pendaftar: false }));

      // Card 3: Jumlah Pengajuan SK
      if (skResult.status === 'fulfilled') {
        const raw = skResult.value;
        const sktaList = raw?.data ?? raw ?? [];
        setJumlahSK(Array.isArray(sktaList) ? sktaList.length : 0);
      } else {
        console.error('Gagal fetch skta requests:', skResult.reason);
      }
      setLoadingCards(prev => ({ ...prev, sk: false }));
    };

    fetchSummaryCards();
  }, []);

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
          <div className="topbar-brand" style={{ background: '#C0182A', color: '#fff', padding: '6px 14px', borderRadius: 8 }}>Beranda</div>
        </header>
        <main className="page-body">
          <div className="welcome-card">
            <h5>Selamat Datang Kembali 👋</h5>
          </div>

          <div className="stat-grid mb-6">
            {/* Card 1: Periode Aktif */}
            <CardAtas4
              icon={<CalendarCheck size={24} />}
              label="Periode Aktif"
              badge={
                loadingCards.periode ? null :
                periodeAktif
                  ? (periodeAktif.state === 'aktif' ? 'Aktif' : periodeAktif.state === 'mendatang' ? 'Mendatang' : 'Selesai')
                  : null
              }
              badgeColor={
                periodeAktif?.state === 'aktif'
                  ? { bg: '#22C55E', text: '#fff' }
                  : periodeAktif?.state === 'mendatang'
                    ? { bg: '#3B82F6', text: '#fff' }
                    : { bg: '#9CA3AF', text: '#fff' }
              }
              value={
                loadingCards.periode
                  ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : periodeAktif ? periodeAktif.name : 'Tidak Ada Periode'
              }
              sub={
                loadingCards.periode
                  ? 'Memuat...'
                  : periodeAktif
                    ? `Berakhir dlm ${getDaysRemaining(periodeAktif.endDate)} Hari`
                    : 'Belum ada periode sidang yang dibuat'
              }
            />

            {/* Card 2: Total Pendaftar Sidang */}
            <CardAtas4
              icon={<Users size={24} />}
              label="Total Pendaftar Sidang"
              value={
                loadingCards.pendaftar
                  ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : `${totalPendaftar ?? 0} Mahasiswa`
              }
              sub={periodeAktif ? periodeAktif.name : 'Seluruh periode'}
            />

            {/* Card 3: Jumlah Pengajuan SK */}
            <CardAtas4
              icon={<Printer size={24} />}
              label="Jumlah Pengajuan SK"
              value={
                loadingCards.sk
                  ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : `${jumlahSK ?? 0} Mahasiswa`
              }
              sub="Total seluruh pengajuan SK"
            />
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
              <RecentActivity />
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