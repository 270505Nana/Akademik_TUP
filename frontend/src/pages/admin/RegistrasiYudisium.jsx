import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronLeft, ChevronRight, Menu, GraduationCap, CheckCircle2, RefreshCw, Loader, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { getAllYudisiumRegistrations, getYudisiumPeriods } from '../../service/api';
import { determineYudisiumStatus, STATUS_YUDISIUM, YUDISIUM_STATUS_CONFIG } from '../../components/admin/yudisium/Yudisiumstatushelper';
import VerifikasiYudisiumModal from '../../components/admin/yudisium/VerifikasiYudisiumModal';
import '../../components/admin/sidang/RegistrasiSidang.css'; 

const FILTER_TABS = [
  { key: '',                                   label: 'Semua'                },
  { key: STATUS_YUDISIUM.DALAM_PROSES,         label: 'Dalam Proses'         },
  { key: STATUS_YUDISIUM.PERLU_REVISI,         label: 'Perlu Revisi'         },
  { key: STATUS_YUDISIUM.REVISI_DIPERBARUI,    label: 'Revisi Diperbarui'    },
  { key: STATUS_YUDISIUM.SIAP_YUDISIUM,        label: 'Siap Yudisium'        },
  { key: STATUS_YUDISIUM.PENDAFTARAN_DITERIMA, label: 'Pendaftaran Diterima' },
];

const STATUS_SORT_ORDER = {
  [STATUS_YUDISIUM.DALAM_PROSES]         : 1,
  [STATUS_YUDISIUM.REVISI_DIPERBARUI]    : 2,
  [STATUS_YUDISIUM.PERLU_REVISI]         : 3,
  [STATUS_YUDISIUM.SIAP_YUDISIUM]        : 4,
  [STATUS_YUDISIUM.PENDAFTARAN_DITERIMA] : 5,
};

const PAGE_SIZE = 8;

const PRODI_LIST = [
  'S1 Informatika', 'S1 Rekayasa Perangkat Lunak (Software Engineering)', 'S1 Sains Data (Data Science)',
  'S1 Teknik Telekomunikasi', 'S1 Teknik Elektro', 'S1 Teknik Biomedis', 'S1 Teknik Industri',
  'S1 Sistem Informasi', 'S1 Teknik Logistik', 'S1 Teknologi Pangan', 'S1 Desain Komunikasi Visual (DKV)',
  'S1 Desain Produk', 'S1 Bisnis Digital', 'D3 Teknologi Telekomunikasi',
];

const StatusBadge = ({ status }) => {
  const cfg = YUDISIUM_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999, background: cfg.badgeBg, border: `1.5px solid ${cfg.borderColor}`,
      color: cfg.badgeColor, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const ProgramBadge = ({ program }) => {
  if (!program) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>-</span>;
  const isReguler = program.toLowerCase() === 'reguler';
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
      background: isReguler ? '#F0FDF4' : '#FFF7ED',
      border: `1.5px solid ${isReguler ? '#BBF7D0' : '#FED7AA'}`,
      color: isReguler ? '#166534' : '#92400E', whiteSpace: 'nowrap',
    }}>
      {program}
    </span>
  );
};

const CumlaudeBadge = ({ cumlaude }) => {
  if (!cumlaude || cumlaude === "Non Cumlaude") return <span style={{ color: '#9CA3AF', fontSize: 12 }}>Tidak</span>;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
      background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#991B1B', whiteSpace: 'nowrap',
    }}>
      {cumlaude}
    </span>
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
    setPanelPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
  }, []);

  const handleToggleOpen = () => {
    if (!open) computePosition();
    setOpen(o => !o);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!btnWrapRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const reposition = () => computePosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => { window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true); };
  }, [open, computePosition]);

  const isActive = selected.length > 0;

  return (
    <div className="vs-prodi-filter" ref={btnWrapRef}>
      <button type="button" className={`vs-tab ${isActive ? 'active' : ''}`} onClick={handleToggleOpen}>
        Prodi {isActive && <span className="vs-tab-count">({selected.length})</span>} <ChevronDown size={12} style={{ marginLeft: 2 }} />
      </button>
      {open && createPortal(
        <div className="vs-prodi-panel" ref={panelRef} style={{ position: 'fixed', top: panelPos.top, right: panelPos.right }}>
          {options.length === 0 ? (
            <div className="vs-prodi-empty">Belum ada data prodi.</div>
          ) : (
            <div className="vs-prodi-options-grid">
              {options.map((prodi) => (
                <label key={prodi} className="vs-prodi-option">
                  <input type="checkbox" checked={selected.includes(prodi)} onChange={() => onToggle(prodi)} />
                  <span>{prodi}</span>
                </label>
              ))}
            </div>
          )}
          {isActive && <div className="vs-prodi-clear" onClick={onClear}>Hapus filter prodi</div>}
        </div>,
        document.body
      )}
    </div>
  );
};

const SortableHeader = ({ label, field, sort, onSort, style }) => {
  const isActive = sort.field === field;
  return (
    <th style={{ ...style, cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(field)} title="Klik untuk urutkan: A-Z → Z-A → default">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {isActive ? (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} color="#CBD5E1" />}
      </span>
    </th>
  );
};

const RegistrasiYudisium = () => {
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [registrations, setRegistrations] = useState([]);
  const [periodMap,     setPeriodMap]     = useState({});
  const [prodiMap,      setProdiMap]      = useState({});

  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [selectedProdis,  setSelectedProdis]  = useState([]);
  const [sort, setSort] = useState({ field: null, dir: 'asc' });
  const [currentPage,     setCurrentPage]     = useState(1);
  const [alert,           setAlert]           = useState({ show: false, type: '', title: '', message: '' });

  const [selectedReg, setSelectedReg] = useState(null);

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  }, []);

  const handleModalSaved = useCallback(() => {
    setSelectedReg(null);
    fetchAll();
    showAlert('success', 'Berhasil', 'Verifikasi berkas berhasil disimpan.');
  }, [showAlert]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const list    = await getAllYudisiumRegistrations();
      const allList = list ?? [];

      const visible = allList.filter((r) => {
        const hasResponse = !!(r.message || r.isEdit || r.yudisiumPeriodId);
        return !r.isDraft || hasResponse;
      });

      const allPeriods = await getYudisiumPeriods().catch(() => []);
      const prdMap = {};
      (allPeriods ?? []).forEach(p => { prdMap[p.id] = p; });
      setPeriodMap(prdMap);
      
      const prMap = {};
      visible.forEach(r => {
        const m = r.mahasiswa || r.student;
        const name = m?.studyProgram?.name ?? null;
        if (name) prMap[r.mahasiswaId] = name;
      });
      setProdiMap(prMap);

      setRegistrations(visible);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) logout();
      showAlert('error', 'Gagal Memuat Data', 'Tidak dapat mengambil data registrasi yudisium.');
    } finally {
      setLoading(false);
    }
  }, [logout, showAlert]);

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchAll();
  }, [user]);

  const getStatus = useCallback((reg) => {
    const periodId = reg.yudisiumPeriodId ?? null;
    const period   = periodId ? (periodMap[periodId] ?? null) : null;
    return determineYudisiumStatus(reg, null, period);
  }, [periodMap]);

  const getProdiName = useCallback((reg) => {
    const m = reg.mahasiswa || reg.student;
    if (m?.studyProgram?.name) return m.studyProgram.name;
    return prodiMap[reg.mahasiswaId] ?? '-';
  }, [prodiMap]);

  const toggleProdiFilter = useCallback((prodi) => {
    setSelectedProdis(prev => prev.includes(prodi) ? prev.filter(p => p !== prodi) : [...prev, prodi]);
  }, []);

  const clearProdiFilter = useCallback(() => setSelectedProdis([]), []);

  const getSubmitDate = useCallback((reg) =>
    reg.submittedAt ?? reg.yudisiumRegistrationUploads?.[0]?.createdAt ?? reg.createdAt ?? null,
  []);

  const handleSort = useCallback((field) => {
    setSort(prev => {
      if (prev.field !== field) return { field, dir: 'asc' };       
      if (prev.dir === 'asc')   return { field, dir: 'desc' };      
      return { field: null, dir: 'asc' };                            
    });
  }, []);

  const filteredList = useMemo(() => {
    return registrations
      .filter(r => {
        if (!searchDebounced) return true;
        const m = r.mahasiswa || r.student;
        const name = (m?.name || '').toLowerCase();
        const nim  = (m?.nim  || '').toLowerCase();
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
          const ma = a.mahasiswa || a.student;
          const mb = b.mahasiswa || b.student;
          const na = (ma?.name || '').toLowerCase();
          const nb = (mb?.name || '').toLowerCase();
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
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="vs-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="vs-main">
        <div className="vs-mobile-bar">
          <button className="vs-mobile-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="vs-mobile-title">SIMTA</span>
        </div>

        <div className="vs-page-wrapper">
          <div className="vs-topbar"><h1>Verifikasi Yudisium</h1></div>

          <div className="vs-content">
            <h2 className="vs-page-title">Daftar Registrasi Yudisium Mahasiswa</h2>

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
                  <RefreshCw size={14} /> Refresh
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
                      {label} <span className="vs-tab-count">({count})</span>
                    </button>
                  );
                })}
                <ProdiFilterDropdown options={PRODI_LIST} selected={selectedProdis} onToggle={toggleProdiFilter} onClear={clearProdiFilter} />
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
                      <th>PROGRAM</th>
                      <th>CUMLAUDE</th>
                      <th style={{ textAlign: 'center' }}>STATUS</th>
                      <th>PERIODE YUDISIUM</th>
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
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Memuat data registrasi yudisium...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '52px 0', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <GraduationCap size={36} color="#D1D5DB" />
                            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                              {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data registrasi yudisium.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((reg, idx) => {
                        const status    = getStatus(reg);
                        const prodiName = getProdiName(reg);
                        const isVerified = status === STATUS_YUDISIUM.SIAP_YUDISIUM
                                        || status === STATUS_YUDISIUM.PENDAFTARAN_DITERIMA;

                        const m = reg.mahasiswa || reg.student;
                        return (
                          <motion.tr
                            key={reg.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            style={{ background: '#fff' }}
                          >
                            <td className="vs-td-center vs-td-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                            <td>
                              <div className="vs-mhs-name">{m?.name || `Mahasiswa #${reg.mahasiswaId}`}</div>
                              <div className="vs-mhs-nim">{m?.nim || '-'}</div>
                            </td>
                            <td><span className="vs-prodi-text">{prodiName}</span></td>
                            <td><ProgramBadge program={reg.program} /></td>
                            <td><CumlaudeBadge cumlaude={reg.pengajuanCumlaude} /></td>
                            <td className="vs-td-center"><StatusBadge status={status} /></td>
                            <td>
                              {reg.yudisiumPeriodId && periodMap[reg.yudisiumPeriodId]
                                ? <span className="vs-period-text">{periodMap[reg.yudisiumPeriodId].name}</span>
                                : <span className="vs-period-empty">-</span>
                              }
                            </td>
                            <td className="vs-td-date">{fmtDate(getSubmitDate(reg))}</td>
                            <td className="vs-td-center">
                              {isVerified ? (
                                <button className="vs-btn-verified" disabled><CheckCircle2 size={12} />Terverifikasi</button>
                              ) : (
                                <button
                                  className="vs-btn-verif"
                                  onClick={() => setSelectedReg(reg)}
                                >
                                  {status === STATUS_YUDISIUM.REVISI_DIPERBARUI ? 'Tinjau Revisi' : 'Verifikasi'}
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
                    <button className="vs-btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`vs-btn-page ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    ))}
                    <button className="vs-btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
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
          <motion.div className="vs-alert-overlay" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReg && (
          <VerifikasiYudisiumModal
            registration={selectedReg}
            academicStaffId={profile?.id || user?.id}
            periodMap={Object.fromEntries(Object.entries(periodMap).filter(([_, p]) => p.category === 'yudisium'))}
            onClose={() => setSelectedReg(null)}
            onSaved={handleModalSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegistrasiYudisium;