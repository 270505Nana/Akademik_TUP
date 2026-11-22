import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {ArrowLeft,Calendar,Clock,RefreshCw,Search,Users,CheckCircle2,Hourglass,AlertCircle,GraduationCap,Eye,Menu,} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import { getAllSidangRegistrations, getStudyPrograms } from '../../service/api';
import '../../style/css/admin/aturperiode.css';
import '../../style/css/admin/detailmhsperiode.css';

const STATUS_TABS = [
  'Semua',
  'Dalam Proses',
  'Perlu Revisi',
  'Revisi Diajukan',
  'Siap Sidang',
  'Pendaftaran Diterima',
];

const JALUR_KEYS = ['Reguler', 'Capstone', 'Non-Sidang'];

const extractArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.data)) return raw.data.data;
  return [];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const clean = String(dateStr).slice(0, 10);
  const parsed = new Date(`${clean}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const resolveJalurSidang = (item) => {
  const jalurNon = (
    item?.jalurNonSidangFinal ||
    item?.jalurNonSidang ||
    item?.nonSidangPath ||
    ''
  )
    .toString()
    .trim();

  if (jalurNon) return 'Non-Sidang';

  const rawSkema = (
    item?.skemaSidangFinal ||
    item?.skemaSidang ||
    item?.jalurSidang ||
    item?.jalur ||
    ''
  )
    .toString()
    .trim();

  const lower = rawSkema.toLowerCase();
  if (!lower) return 'Reguler';
  if (
    lower.includes('non') ||
    lower.includes('jurnal') ||
    lower.includes('hki') ||
    lower.includes('publikasi')
  ) {
    return 'Non-Sidang';
  }
  if (lower.includes('capstone')) return 'Capstone';
  if (lower.includes('reguler')) return 'Reguler';
  return rawSkema;
};

const resolveSkemaLabel = (item) => {
  const val =
    item?.skemaSidangFinal ||
    item?.skemaSidang ||
    item?.jalurNonSidangFinal ||
    item?.jalurNonSidang ||
    '-';
  return String(val).trim() || '-';
};

const resolveProdiName = (item, prodiMap) => {
  const direct =
    item?.studyProgram?.name ||
    item?.studyProgramName ||
    item?.prodi?.name ||
    item?.prodiName ||
    item?.mahasiswa?.studyProgram?.name ||
    item?.mahasiswa?.prodi?.name ||
    '';

  if (direct) return String(direct).trim();

  const pid =
    item?.studyProgramId ||
    item?.prodiId ||
    item?.mahasiswa?.studyProgramId ||
    item?.mahasiswa?.prodiId ||
    '';

  if (pid && prodiMap[pid]) return prodiMap[pid];
  return 'Prodi Tidak Tercatat';
};

const resolveMahasiswaInfo = (item) => {
  const mhs = item?.mahasiswa || item?.student || item?.user || {};
  const name = mhs?.name || mhs?.fullName || item?.mahasiswaName || item?.studentName || '-';
  const nim = mhs?.nim || mhs?.studentIdNumber || item?.nim || '-';
  return { name, nim };
};

const resolvePeriodeSidangText = (item, fallbackName) => {
  return (
    item?.sidangPeriod?.name ||
    item?.sidangRegistrationPeriod?.name ||
    item?.periodName ||
    fallbackName ||
    '-'
  );
};

const resolveTanggalText = (item) => {
  const rawDate = item?.submittedAt || item?.createdAt || item?.updatedAt || '';
  return formatDate(rawDate);
};

const getJalurBadgeClass = (jalur) => {
  const lower = String(jalur).toLowerCase();
  if (lower === 'capstone') return 'capstone';
  if (lower.includes('non')) return 'nonsidang';
  if (lower === 'reguler') return 'reguler';
  return 'other';
};

const getStatusBadgeClass = (status) => {
  const lower = String(status || '').toLowerCase();
  if (lower.includes('siap') || lower.includes('diterima') || lower.includes('lolos')) {
    return 'ready';
  }
  if (lower.includes('revisi')) return 'revision';
  if (lower.includes('proses') || lower.includes('menunggu') || lower.includes('diajukan')) {
    return 'process';
  }
  return 'neutral';
};

const DetailMahasiswaPeriodeSidang = ({
  periodGroup: propPeriodGroup = null,
  onBack: propOnBack = null,
  onSelectStudent: propOnSelectStudent = null,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [prodiMap, setProdiMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('Semua');
  const [selectedProdi, setSelectedProdi] = useState('Semua');
  const [selectedJalur, setSelectedJalur] = useState('Semua');

  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  }, []);

  const periodContext = useMemo(() => {
    if (propPeriodGroup) return propPeriodGroup;

    const historyState =
      window.history?.state?.usr?.periodGroup || window.history?.state?.periodGroup;
    if (historyState) return historyState;

    const params = new URLSearchParams(window.location.search);
    const sidangPeriodId = params.get('sidangPeriodId') || params.get('periodId') || '';
    const registrationPeriodId = params.get('registrationPeriodId') || '';
    const name = params.get('name') || '';
    const period = params.get('period') || '';

    if (sidangPeriodId || registrationPeriodId || name || period) {
      return {
        id: sidangPeriodId || registrationPeriodId,
        period,
        sidang: sidangPeriodId ? { id: sidangPeriodId, name } : null,
        pendaftaran: registrationPeriodId ? { id: registrationPeriodId, name } : (name ? { name } : null),
      };
    }

    return null;
  }, [propPeriodGroup]);

  const periodTitle = useMemo(() => {
    if (!periodContext) return 'Semua Periode Sidang';
    const custom = (
      periodContext.sidang?.name ||
      periodContext.pendaftaran?.name ||
      periodContext.name ||
      ''
    ).trim();
    if (custom) return custom;
    if (periodContext.semester && periodContext.semester !== 'Umum') {
      return `Semester ${periodContext.semester} ${periodContext.period || ''}`.trim();
    }
    return periodContext.period ? `Tahun Ajaran ${periodContext.period}` : 'Detail Periode Sidang';
  }, [periodContext]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const candidateIds = Array.from(
        new Set(
          [
            periodContext?.sidang?.id,
            periodContext?.pendaftaran?.id,
            periodContext?.sidangPeriodId,
          ].filter(Boolean)
        )
      );

      const regRequests =
        candidateIds.length > 0
          ? candidateIds.map((pid) =>
              getAllSidangRegistrations({ limit: 'all', sidangPeriodId: pid })
            )
          : [getAllSidangRegistrations({ limit: 'all' })];

      const [regResults, prodiRaw] = await Promise.all([
        Promise.all(regRequests),
        getStudyPrograms().catch(() => []),
      ]);

      const mergedMap = new Map();
      regResults.forEach((rawRes) => {
        const list = extractArray(rawRes);
        list.forEach((item, idx) => {
          const key = item?.id || `${item?.mahasiswaId || idx}-${item?.createdAt || idx}`;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          }
        });
      });

      let regList = Array.from(mergedMap.values());

      if (candidateIds.length > 0) {
        regList = regList.filter((item) => {
          const assignedSidangPeriodId =
            item?.sidangPeriodId || item?.sidangPeriod?.id || '';
          return assignedSidangPeriodId && candidateIds.includes(assignedSidangPeriodId);
        });
      }

      const prodiList = extractArray(prodiRaw);
      const nextProdiMap = {};
      prodiList.forEach((p) => {
        if (p?.id && p?.name) {
          nextProdiMap[p.id] = p.name;
        }
      });

      setProdiMap(nextProdiMap);
      setRegistrations(regList);
    } catch (err) {
      showAlert(
        'error',
        'Gagal Memuat Data',
        err?.response?.data?.message || 'Gagal memuat data pendaftaran mahasiswa pada periode ini.'
      );
    } finally {
      setLoading(false);
    }
  }, [periodContext, showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = useMemo(() => {
    return registrations.map((item, index) => {
      const mhs = resolveMahasiswaInfo(item);
      const prodi = resolveProdiName(item, prodiMap);
      const jalur = resolveJalurSidang(item);
      const skema = resolveSkemaLabel(item);
      const status = item?.status || 'Dalam Proses';
      const periodeLabel = resolvePeriodeSidangText(item, periodTitle);
      const tanggalLabel = resolveTanggalText(item);

      return {
        id: item?.id || index,
        raw: item,
        nim: mhs.nim,
        mahasiswaName: mhs.name,
        prodi,
        jalur,
        skema,
        status,
        periodeLabel,
        tanggalLabel,
      };
    });
  }, [registrations, prodiMap, periodTitle]);

  const metrics = useMemo(() => {
    const total = rows.length;
    let siapSidang = 0;
    let menungguVerifikasi = 0;
    let perluRevisi = 0;

    rows.forEach((r) => {
      const st = String(r.status || '').toLowerCase();
      if (st.includes('siap sidang') || st.includes('diterima')) {
        siapSidang += 1;
      } else if (st.includes('perlu revisi')) {
        perluRevisi += 1;
      } else if (st.includes('proses') || st.includes('diajukan')) {
        menungguVerifikasi += 1;
      }
    });

    const pctReady = total > 0 ? Math.round((siapSidang / total) * 100) : 0;
    const pctPending = total > 0 ? Math.round((menungguVerifikasi / total) * 100) : 0;
    const pctRevision = total > 0 ? Math.round((perluRevisi / total) * 100) : 0;

    return {
      total,
      siapSidang,
      menungguVerifikasi,
      perluRevisi,
      pctReady,
      pctPending,
      pctRevision,
    };
  }, [rows]);

  const prodiDistribution = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      map[r.prodi] = (map[r.prodi] || 0) + 1;
    });

    const total = rows.length || 1;
    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const jalurDistribution = useMemo(() => {
    const counts = {
      Reguler: 0,
      Capstone: 0,
      'Non-Sidang': 0,
    };

    rows.forEach((r) => {
      if (JALUR_KEYS.includes(r.jalur)) {
        counts[r.jalur] += 1;
      } else {
        counts[r.jalur] = (counts[r.jalur] || 0) + 1;
      }
    });

    const total = rows.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [rows]);

  const statusCounts = useMemo(() => {
    const map = { Semua: rows.length };
    STATUS_TABS.slice(1).forEach((tab) => {
      map[tab] = rows.filter(
        (r) => String(r.status).toLowerCase() === tab.toLowerCase()
      ).length;
    });
    return map;
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (activeStatus !== 'Semua') {
        if (String(r.status).toLowerCase() !== activeStatus.toLowerCase()) {
          return false;
        }
      }
      if (selectedProdi !== 'Semua' && r.prodi !== selectedProdi) {
        return false;
      }
      if (selectedJalur !== 'Semua' && r.jalur !== selectedJalur) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = String(r.mahasiswaName).toLowerCase().includes(q);
        const matchNim = String(r.nim).toLowerCase().includes(q);
        const matchProdi = String(r.prodi).toLowerCase().includes(q);
        if (!matchName && !matchNim && !matchProdi) return false;
      }
      return true;
    });
  }, [rows, activeStatus, selectedProdi, selectedJalur, searchQuery]);

  const handleBack = () => {
    if (typeof propOnBack === 'function') {
      propOnBack();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/akademik/atur-periode/sidang';
    }
  };

  const handleViewStudent = (row) => {
    if (typeof propOnSelectStudent === 'function') {
      propOnSelectStudent(row.raw);
      return;
    }
    showAlert(
      'success',
      row.mahasiswaName,
      `NIM: ${row.nim} • Jalur: ${row.jalur} • Status: ${row.status}`
    );
  };

  const hasActiveBreakdownFilter = selectedProdi !== 'Semua' || selectedJalur !== 'Semua';

  return (
    <div
      className={`dmp-page-root dmp-compact-layout ${
        sidebarHidden ? 'dmp-sidebar-hidden' : ''
      }`}
    >
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dmp-main-content">
        <div className="dmp-mobile-bar">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="dmp-mobile-menu-btn"
          >
            <Menu size={22} />
          </button>
          <span className="dmp-mobile-brand">SIMTA</span>
        </div>

        <div className="dmp-zoom-wrapper">
          <div className="dmp-top-bar-red">
            <div className="dmp-top-bar-left">
              <button
                type="button"
                className="dmp-burger-btn"
                onClick={() => setSidebarHidden((prev) => !prev)}
                title={sidebarHidden ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'}
                aria-label={sidebarHidden ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'}
              >
                <Menu size={18} />
              </button>
              <h1>Detail Mahasiswa Periode Sidang</h1>
            </div>
            <span className="dmp-top-bar-pill">{periodTitle}</span>
          </div>

          <div className="dmp-content-container">
            <div className="dmp-breadcrumb">
              <span>Kelola Periode Sidang</span>
              <span>/</span>
              <span className="current">Detail Mahasiswa</span>
            </div>

            <div className="dmp-period-banner">
              <div className="dmp-period-left">
                <div className="dmp-period-title-row">
                  <button type="button" className="dmp-btn-back" onClick={handleBack}>
                    <ArrowLeft size={14} /> Kembali
                  </button>
                  <h2 className="dmp-period-title">{periodTitle}</h2>
                </div>

                <div className="dmp-period-meta">
                  {periodContext?.period && (
                    <span className="dmp-meta-item">
                      <GraduationCap size={13} /> TA {periodContext.period}
                    </span>
                  )}
                  {periodContext?.pendaftaran && (
                    <span className="dmp-meta-item">
                      <Calendar size={13} /> Pendaftaran:{' '}
                      {formatDate(periodContext.pendaftaran.startDate)} –{' '}
                      {formatDate(periodContext.pendaftaran.endDate)}
                    </span>
                  )}
                  {periodContext?.sidang && (
                    <span className="dmp-meta-item">
                      <Clock size={13} /> Pelaksanaan Sidang:{' '}
                      {formatDate(periodContext.sidang.startDate)} –{' '}
                      {formatDate(periodContext.sidang.endDate)}
                    </span>
                  )}
                </div>
              </div>

              <div className="dmp-period-actions">
                <button
                  type="button"
                  className="dmp-btn-refresh"
                  onClick={fetchData}
                  disabled={loading}
                >
                  <RefreshCw size={13} /> {loading ? 'Memuat...' : 'Refresh Data'}
                </button>
              </div>
            </div>

            <div className="dmp-kpi-grid">
              <div className="dmp-kpi-card">
                <div className="dmp-kpi-top">
                  <span className="dmp-kpi-label">TOTAL PENDAFTAR</span>
                  <span className="dmp-kpi-icon total">
                    <Users size={15} />
                  </span>
                </div>
                <div className="dmp-kpi-value">{metrics.total}</div>
                <div className="dmp-kpi-sub">Mahasiswa terdaftar pada periode</div>
              </div>

              <div className="dmp-kpi-card">
                <div className="dmp-kpi-top">
                  <span className="dmp-kpi-label">SIAP SIDANG / DITERIMA</span>
                  <span className="dmp-kpi-icon verified">
                    <CheckCircle2 size={15} />
                  </span>
                </div>
                <div className="dmp-kpi-value">{metrics.siapSidang}</div>
                <div className="dmp-kpi-sub green">
                  {metrics.pctReady}% dari total pendaftar
                </div>
              </div>

              <div className="dmp-kpi-card">
                <div className="dmp-kpi-top">
                  <span className="dmp-kpi-label">MENUNGGU VERIFIKASI</span>
                  <span className="dmp-kpi-icon pending">
                    <Hourglass size={15} />
                  </span>
                </div>
                <div className="dmp-kpi-value">{metrics.menungguVerifikasi}</div>
                <div className="dmp-kpi-sub amber">
                  {metrics.pctPending}% dalam proses / revisi diajukan
                </div>
              </div>

              <div className="dmp-kpi-card">
                <div className="dmp-kpi-top">
                  <span className="dmp-kpi-label">PERLU REVISI</span>
                  <span className="dmp-kpi-icon revision">
                    <AlertCircle size={15} />
                  </span>
                </div>
                <div className="dmp-kpi-value">{metrics.perluRevisi}</div>
                <div className="dmp-kpi-sub red">
                  {metrics.pctRevision}% memerlukan perbaikan berkas
                </div>
              </div>
            </div>

            <div className="dmp-distribution-grid">
              <div className="dmp-dist-card">
                <div className="dmp-dist-header">
                  <div>
                    <h3 className="dmp-dist-title">Sebaran Mahasiswa per Prodi</h3>
                    <p className="dmp-dist-subtitle">
                      Klik salah satu prodi untuk memfilter tabel pendaftaran di bawah.
                    </p>
                  </div>
                  {hasActiveBreakdownFilter && (
                    <button
                      type="button"
                      className="dmp-btn-clear-filter"
                      onClick={() => {
                        setSelectedProdi('Semua');
                        setSelectedJalur('Semua');
                      }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>

                {prodiDistribution.length === 0 ? (
                  <div className="dmp-empty-box">
                    <span className="dmp-empty-title">Belum ada data sebaran prodi.</span>
                  </div>
                ) : (
                  <div className="dmp-prodi-list">
                    {prodiDistribution.map((item) => {
                      const isSelected = selectedProdi === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          className={`dmp-breakdown-item ${isSelected ? 'is-selected' : ''}`}
                          onClick={() =>
                            setSelectedProdi((prev) => (prev === item.name ? 'Semua' : item.name))
                          }
                        >
                          <div className="dmp-breakdown-top">
                            <span className="dmp-breakdown-name" title={item.name}>
                              {item.name}
                            </span>
                            <span className="dmp-breakdown-count">
                              {item.count} mhs ({item.percent}%)
                            </span>
                          </div>
                          <div className="dmp-progress-track">
                            <div
                              className="dmp-progress-fill prodi"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="dmp-dist-card">
                <div className="dmp-dist-header">
                  <div>
                    <h3 className="dmp-dist-title">Sebaran Mahasiswa per Jalur</h3>
                    <p className="dmp-dist-subtitle">
                      Pengelompokan berdasarkan jalur Reguler, Capstone, dan Non-Sidang.
                    </p>
                  </div>
                </div>

                <div className="dmp-jalur-stack">
                  {jalurDistribution.map((item) => {
                    const isSelected = selectedJalur === item.name;
                    const barClass = getJalurBadgeClass(item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`dmp-breakdown-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() =>
                          setSelectedJalur((prev) => (prev === item.name ? 'Semua' : item.name))
                        }
                      >
                        <div className="dmp-breakdown-top">
                          <span className="dmp-breakdown-name">{item.name}</span>
                          <span className="dmp-breakdown-count">{item.count} Mahasiswa</span>
                        </div>
                        <div className="dmp-progress-track">
                          <div
                            className={`dmp-progress-fill ${barClass}`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        <div className="dmp-breakdown-meta">
                          <span>Jalur Sidang</span>
                          <span>{item.percent}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="dmp-filter-panel">
              <div className="dmp-toolbar-row">
                <div className="dmp-search-wrap">
                  <Search className="dmp-search-icon" size={14} />
                  <input
                    type="text"
                    className="dmp-search-input"
                    placeholder="Cari nama atau NIM mahasiswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="dmp-select-filter"
                  value={selectedProdi}
                  onChange={(e) => setSelectedProdi(e.target.value)}
                >
                  <option value="Semua">Prodi: Semua</option>
                  {prodiDistribution.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  className="dmp-select-filter"
                  value={selectedJalur}
                  onChange={(e) => setSelectedJalur(e.target.value)}
                >
                  <option value="Semua">Jalur: Semua</option>
                  {jalurDistribution.map((j) => (
                    <option key={j.name} value={j.name}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dmp-status-tabs">
                {STATUS_TABS.map((tab) => {
                  const isActive = activeStatus === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      className={`dmp-status-tab ${isActive ? 'is-active' : ''}`}
                      onClick={() => setActiveStatus(tab)}
                    >
                      <span>{tab}</span>
                      <span className="dmp-tab-badge">{statusCounts[tab] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="dmp-table-wrap">
              {loading ? (
                <div className="dmp-empty-box">
                  <span className="dmp-empty-title">Memuat data registrasi mahasiswa...</span>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="dmp-empty-box">
                  <GraduationCap size={28} color="#94A3B8" />
                  <span className="dmp-empty-title">
                    Tidak ada data pendaftaran mahasiswa yang sesuai dengan filter.
                  </span>
                </div>
              ) : (
                <table className="dmp-table">
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>MAHASISWA</th>
                      <th>PRODI</th>
                      <th>JALUR SIDANG</th>
                      <th>SKEMA</th>
                      <th>STATUS</th>
                      <th>PERIODE SIDANG</th>
                      <th>TANGGAL</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr key={row.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="dmp-student-name">{row.mahasiswaName}</div>
                          <div className="dmp-student-nim">{row.nim}</div>
                        </td>
                        <td>{row.prodi}</td>
                        <td>
                          <span className={`dmp-jalur-badge ${getJalurBadgeClass(row.jalur)}`}>
                            {row.jalur}
                          </span>
                        </td>
                        <td>{row.skema}</td>
                        <td>
                          <span className={`dmp-status-badge ${getStatusBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.periodeLabel}</td>
                        <td>{row.tanggalLabel}</td>
                        <td>
                          <button
                            type="button"
                            className="dmp-btn-detail-row"
                            onClick={() => handleViewStudent(row)}
                            title="Lihat Detail Pendaftaran"
                          >
                            <Eye size={13} /> Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="dmp-alert-floating"
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetailMahasiswaPeriodeSidang;