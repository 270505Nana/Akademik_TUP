import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {Search, ChevronLeft, ChevronRight, Menu,GraduationCap, CheckCircle2, RefreshCw, Loader, ChevronDown,ArrowUp, ArrowDown, ArrowUpDown,} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin          from '../../components/sidebar/SidebarAdmin';
import CustomAlert           from '../../components/common/CustomAlert';
import VerifikasiBerkasModal from '../../components/admin/sidang/VerifikasiBerkasModal';
import { useAuth }           from '../../context/AuthContext';
import {getAllSidangRegistrations,getSidangPeriods,} from '../../service/api';
import {determineSidangStatus,STATUS_SIDANG,SIDANG_STATUS_CONFIG,} from '../../components/admin/sidang/SidangStatusHelper.js';
import '../../components/admin/sidang/RegistrasiSidang.css';

const FILTER_TABS = [
  { key: '',                                 label: 'Semua'                },
  { key: STATUS_SIDANG.DALAM_PROSES,         label: 'Dalam Proses'         },
  { key: STATUS_SIDANG.PERLU_REVISI,         label: 'Perlu Revisi'         },
  { key: STATUS_SIDANG.REVISI_DIPERBARUI,    label: 'Revisi Diperbarui'    },
  { key: STATUS_SIDANG.SIAP_SIDANG,          label: 'Siap Sidang'          },
  { key: STATUS_SIDANG.PENDAFTARAN_DITERIMA, label: 'Pendaftaran Diterima' },
];

const STATUS_SORT_ORDER = {
  [STATUS_SIDANG.DALAM_PROSES]         : 1,
  [STATUS_SIDANG.REVISI_DIPERBARUI]    : 2,
  [STATUS_SIDANG.PERLU_REVISI]         : 3,
  [STATUS_SIDANG.SIAP_SIDANG]          : 4,
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA] : 5,
};

const PAGE_SIZE = 8;

// Master list Program Studi
const PRODI_LIST = [
  'S1 Informatika',
  'S1 Rekayasa Perangkat Lunak (Software Engineering)',
  'S1 Sains Data (Data Science)',
  'S1 Teknik Telekomunikasi',
  'S1 Teknik Elektro',
  'S1 Teknik Biomedis',
  'S1 Teknik Industri',
  'S1 Sistem Informasi',
  'S1 Teknik Logistik',
  'S1 Teknologi Pangan',
  'S1 Desain Komunikasi Visual (DKV)',
  'S1 Desain Produk',
  'S1 Bisnis Digital',
  'D3 Teknologi Telekomunikasi',
];

const StatusBadge = ({ status }) => {
  const cfg = SIDANG_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999,
      background: cfg.badgeBg,
      border: `1.5px solid ${cfg.borderColor}`,
      color: cfg.badgeColor,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const SchemaBadge = ({ scheme }) => {
  if (!scheme) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>-</span>;
  const isNonSidang = scheme.toLowerCase().includes('non');
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999,
      background: isNonSidang ? '#F5F3FF' : '#DBEAFE',
      border:     `1.5px solid ${isNonSidang ? '#DDD6FE' : '#BFDBFE'}`,
      color:      isNonSidang ? '#5B21B6' : '#1D4ED8',
      whiteSpace: 'nowrap',
    }}>
      {scheme}
    </span>
  );
};

const JalurBadge = ({ jalur }) => {
  if (!jalur || jalur.length === 0)
    return <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Reguler</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {jalur.map((j, i) => (
        <span key={i} style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px',
          borderRadius: 9999, background: '#F0FDF4',
          border: '1.5px solid #BBF7D0', color: '#166534',
          whiteSpace: 'nowrap', display: 'inline-block',
        }}>
          {j}
        </span>
      ))}
    </div>
  );
};

const ProdiFilterDropdown = ({ options, selected, onToggle, onClear }) => {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const btnWrapRef = useRef(null);
  const panelRef   = useRef(null);

  const computePosition = useCallback(() => {
    if (!btnWrapRef.current) return;
    const rect = btnWrapRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right), // jangan sampai keluar layar kanan
    });
  }, []);

  const handleToggleOpen = () => {
    if (!open) computePosition();
    setOpen(o => !o);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedButton = btnWrapRef.current?.contains(e.target);
      const clickedPanel   = panelRef.current?.contains(e.target);
      if (!clickedButton && !clickedPanel) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const reposition = () => computePosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, computePosition]);

  const isActive = selected.length > 0;

  return (
    <div className="vs-prodi-filter" ref={btnWrapRef}>
      <button
        type="button"
        className={`vs-tab ${isActive ? 'active' : ''}`}
        onClick={handleToggleOpen}
      >
        Prodi
        {isActive && <span className="vs-tab-count">({selected.length})</span>}
        <ChevronDown size={12} style={{ marginLeft: 2 }} />
      </button>

      {open && createPortal(
        <div
          className="vs-prodi-panel"
          ref={panelRef}
          style={{ position: 'fixed', top: panelPos.top, right: panelPos.right }}
        >
          {options.length === 0 ? (
            <div className="vs-prodi-empty">Belum ada data prodi.</div>
          ) : (
            <div className="vs-prodi-options-grid">
              {options.map((prodi) => (
                <label key={prodi} className="vs-prodi-option">
                  <input
                    type="checkbox"
                    checked={selected.includes(prodi)}
                    onChange={() => onToggle(prodi)}
                  />
                  <span>{prodi}</span>
                </label>
              ))}
            </div>
          )}
          {isActive && (
            <div className="vs-prodi-clear" onClick={onClear}>
              Hapus filter prodi
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

const SortableHeader = ({ label, field, sort, onSort, style }) => {
  const isActive = sort.field === field;
  return (
    <th
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(field)}
      title="Klik untuk urutkan: A-Z → Z-A → default"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isActive ? (
          sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
        ) : (
          <ArrowUpDown size={11} color="#CBD5E1" />
        )}
      </span>
    </th>
  );
};

//  Main Component 

const RegistrasiSidang = () => {
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [registrations, setRegistrations] = useState([]);
  const [periodMap,     setPeriodMap]     = useState({});
  const [prodiMap,      setProdiMap]      = useState({});

  // UI state
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [selectedProdis,  setSelectedProdis]  = useState([]);
  const [sort, setSort] = useState({ field: null, dir: 'asc' }); // field: 'name' | 'date' | null
  const [currentPage,     setCurrentPage]     = useState(1);
  const [alert,           setAlert]           = useState({ show: false, type: '', title: '', message: '' });

  // Modal state
  const [selectedReg, setSelectedReg] = useState(null);

  //  Alert helper 
  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  }, []);

  //  Search debounce 
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  //  Fetch semua data 
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const list    = await getAllSidangRegistrations();
      const allList = list ?? [];

      const visible = allList.filter((r) => {
        const hasResponse = !!(r.message || r.isEdit || r.sidangPeriodId);
        return !r.isDraft || hasResponse;
      });

      const allPeriods = await getSidangPeriods().catch(() => []);
      const prdMap = {};
      (allPeriods ?? []).forEach(p => { prdMap[p.id] = p; });
      setPeriodMap(prdMap);
      const prMap = {};
      visible.forEach(r => {
        const name = r.student?.studyProgram?.name ?? null;
        if (name) prMap[r.mahasiswaId] = name;
      });
      setProdiMap(prMap);

      setRegistrations(visible);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) logout();
      showAlert('error', 'Gagal Memuat Data', 'Tidak dapat mengambil data registrasi sidang.');
    } finally {
      setLoading(false);
    }
  }, [logout, showAlert]);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchAll();
  }, [user]);

  const getStatus = useCallback((reg) => {
    const periodId = reg.sidangPeriodId ?? null;
    const period   = periodId ? (periodMap[periodId] ?? null) : null;
    return determineSidangStatus(reg, null, period);
  }, [periodMap]);

  const getProdiName = useCallback((reg) => {
    if (reg.student?.studyProgram?.name) return reg.student.studyProgram.name;
    return prodiMap[reg.mahasiswaId] ?? '-';
  }, [prodiMap]);

  const prodiOptions = PRODI_LIST;

  const toggleProdiFilter = useCallback((prodi) => {
    setSelectedProdis(prev =>
      prev.includes(prodi) ? prev.filter(p => p !== prodi) : [...prev, prodi]
    );
  }, []);

  const clearProdiFilter = useCallback(() => setSelectedProdis([]), []);

  const getSubmitDate = useCallback((reg) =>
    reg.submittedAt ?? reg.sidangRegistrationUploads?.[0]?.createdAt ?? reg.createdAt ?? null,
  []);

  const handleSort = useCallback((field) => {
    setSort(prev => {
      if (prev.field !== field) return { field, dir: 'asc' };       // kolom baru → mulai asc
      if (prev.dir === 'asc')   return { field, dir: 'desc' };      // klik ke-2 → desc
      return { field: null, dir: 'asc' };                            // klik ke-3 → netral (balik ke default status order)
    });
  }, []);

  //  Filter + sort + paginate 
  const filteredList = useMemo(() => {
    return registrations
      .filter(r => {
        if (!searchDebounced) return true;
        const name = (r.student?.name || '').toLowerCase();
        const nim  = (r.student?.nim  || '').toLowerCase();
        return name.includes(searchDebounced) || nim.includes(searchDebounced);
      })
      .filter(r => {
        if (!filterStatus) return true;
        return getStatus(r) === filterStatus;
      })
      .filter(r => {
        if (selectedProdis.length === 0) return true;
        return selectedProdis.includes(getProdiName(r));
      })
      .sort((a, b) => {
        if (sort.field === 'name') {
          const na = (a.student?.name || '').toLowerCase();
          const nb = (b.student?.name || '').toLowerCase();
          const cmp = na.localeCompare(nb, 'id');
          return sort.dir === 'asc' ? cmp : -cmp;
        }
        if (sort.field === 'date') {
          const da = new Date(getSubmitDate(a) ?? 0).getTime();
          const db = new Date(getSubmitDate(b) ?? 0).getTime();
          return sort.dir === 'asc' ? da - db : db - da;
        }
        const sa = getStatus(a);
        const sb = getStatus(b);
        return (STATUS_SORT_ORDER[sa] ?? 99) - (STATUS_SORT_ORDER[sb] ?? 99);
      });
  }, [registrations, searchDebounced, filterStatus, selectedProdis, sort, getStatus, getProdiName, getSubmitDate]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginated  = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchDebounced, filterStatus, selectedProdis]);

  const countAll    = registrations.length;
  const countStatus = (s) => registrations.filter(r => getStatus(r) === s).length;

  const fmtDate = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleModalSaved = useCallback(() => {
    setSelectedReg(null);
    fetchAll();
    showAlert('success', 'Berhasil', 'Verifikasi berkas berhasil disimpan.');
  }, [fetchAll, showAlert]);

  // 
  return (
    <div className="vs-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="vs-main">
        {/* Mobile topbar */}
        <div className="vs-mobile-bar">
          <button className="vs-mobile-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="vs-mobile-title">SIMTA</span>
        </div>

        <div className="vs-page-wrapper">
          {/* Red header */}
          <div className="vs-topbar"><h1>Verifikasi Sidang</h1></div>

          <div className="vs-content">
            <h2 className="vs-page-title">Daftar Registrasi Sidang Mahasiswa</h2>

            <section className="vs-card">

              {/* Filter bar */}
              <div className="vs-filter-bar">
                <div className="vs-search-wrap">
                  <Search size={15} className="vs-search-icon" />
                  <input
                    type="text"
                    className="vs-search-input"
                    placeholder="Cari nama atau NIM..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button className="vs-btn-refresh" onClick={fetchAll} title="Refresh data">
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              {/* Status tabs */}
              <div className="vs-status-tabs">
                {FILTER_TABS.map(({ key, label }) => {
                  const count = key === '' ? countAll : countStatus(key);
                  return (
                    <button
                      key={key}
                      className={`vs-tab ${filterStatus === key ? 'active' : ''}`}
                      onClick={() => setFilterStatus(key)}
                    >
                      {label}
                      <span className="vs-tab-count">({count})</span>
                    </button>
                  );
                })}

                <ProdiFilterDropdown
                  options={prodiOptions}
                  selected={selectedProdis}
                  onToggle={toggleProdiFilter}
                  onClear={clearProdiFilter}
                />
              </div>

              <div className="vs-table-divider" />

              {/* Table */}
              <div className="vs-table-wrap">
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>NO</th>
                      <SortableHeader label="MAHASISWA" field="name" sort={sort} onSort={handleSort} />
                      <th>PRODI</th>
                      <th>JALUR SIDANG</th>
                      <th>SKEMA</th>
                      <th style={{ textAlign: 'center' }}>STATUS</th>
                      <th>PERIODE SIDANG</th>
                      <SortableHeader label="TANGGAL" field="date" sort={sort} onSort={handleSort} />
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '52px 0', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <Loader size={24} color="#C0182A" style={{ animation: 'vs-spin 1s linear infinite' }} />
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Memuat data registrasi...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '52px 0', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <GraduationCap size={36} color="#D1D5DB" />
                            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                              {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data registrasi sidang.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((reg, idx) => {
                        const status    = getStatus(reg);
                        const prodiName = getProdiName(reg);
                        const isVerified = status === STATUS_SIDANG.SIAP_SIDANG
                                        || status === STATUS_SIDANG.PENDAFTARAN_DITERIMA;

                        return (
                          <motion.tr
                            key={reg.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            style={{ background: '#fff' }}
                          >
                            <td className="vs-td-center vs-td-num">
                              {(currentPage - 1) * PAGE_SIZE + idx + 1}
                            </td>
                            <td>
                              <div className="vs-mhs-name">{reg.student?.name || `Mahasiswa #${reg.mahasiswaId}`}</div>
                              <div className="vs-mhs-nim">{reg.student?.nim  || '-'}</div>
                            </td>
                            <td>
                              <span className="vs-prodi-text">{prodiName}</span>
                            </td>
                            <td>
                              <JalurBadge jalur={reg.jalurNonSidang} />
                            </td>
                            <td>
                              <SchemaBadge scheme={reg.sidangScheme} />
                            </td>
                            <td className="vs-td-center">
                              <StatusBadge status={status} />
                            </td>
                            <td>
                              {reg.sidangPeriodId && periodMap[reg.sidangPeriodId]
                                ? <span className="vs-period-text">{periodMap[reg.sidangPeriodId].name}</span>
                                : <span className="vs-period-empty">-</span>
                              }
                            </td>
                            <td className="vs-td-date">{fmtDate(getSubmitDate(reg))}</td>
                            <td className="vs-td-center">
                              {isVerified ? (
                                <button className="vs-btn-verified" disabled>
                                  <CheckCircle2 size={12} />
                                  Terverifikasi
                                </button>
                              ) : (
                                <button
                                  className="vs-btn-verif"
                                  onClick={() => setSelectedReg(reg)}
                                >
                                  {status === STATUS_SIDANG.REVISI_DIPERBARUI
                                    ? 'Tinjau Revisi'
                                    : 'Verifikasi'}
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredList.length > 0 && (
                <div className="vs-footer">
                  <span className="vs-page-info">
                    Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredList.length)}–{Math.min(currentPage * PAGE_SIZE, filteredList.length)} dari {filteredList.length} data
                  </span>
                  <div className="vs-pagination">
                    <button className="vs-btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`vs-btn-page ${p === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button className="vs-btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Alert toast */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            className="vs-alert-overlay"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: 300, opacity: 0 }}
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Verifikasi Berkas */}
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

export default RegistrasiSidang;