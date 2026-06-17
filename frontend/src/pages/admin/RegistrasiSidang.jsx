import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Menu,
  GraduationCap, CheckCircle2, RefreshCw, Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert  from '../../components/common/CustomAlert';
import VerifikasiBerkasModal from '../../components/admin/sidang/VerifikasiBerkasModal';
import { useAuth }  from '../../context/AuthContext';
import { getAllSidangRegistrations,getSidangRegistrationResponse,getStudyProgramById,} from '../../service/api';
import { determineSidangStatus,STATUS_SIDANG,SIDANG_STATUS_CONFIG,isAdminVerifiable,} from '../../components/admin/sidang/Sidangstatushelper.js';
import '../../components/admin/sidang/RegistrasiSidang.css';

const FILTER_TABS = [
  { key: '',                                    label: 'Semua'                },
  { key: STATUS_SIDANG.DALAM_PROSES,            label: 'Dalam Proses'         },
  { key: STATUS_SIDANG.PERLU_REVISI,            label: 'Perlu Revisi'         },
  { key: STATUS_SIDANG.REVISI_DIPERBARUI,       label: 'Revisi Diperbarui'    },
  { key: STATUS_SIDANG.SIAP_SIDANG,             label: 'Siap Sidang'          },
  { key: STATUS_SIDANG.PENDAFTARAN_DITERIMA,    label: 'Pendaftaran Diterima' },
];

const STATUS_SORT_ORDER = {
  [STATUS_SIDANG.DALAM_PROSES]         : 1,
  [STATUS_SIDANG.REVISI_DIPERBARUI]    : 2,
  [STATUS_SIDANG.PERLU_REVISI]         : 3,
  [STATUS_SIDANG.SIAP_SIDANG]          : 4,
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA] : 5,
  [STATUS_SIDANG.DRAFT]                : 6,
  [STATUS_SIDANG.BELUM_DAFTAR]         : 7,
};

const StatusBadge = ({ status }) => {
  const cfg = SIDANG_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999,
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

const SchemaBadge = ({ scheme }) => {
  if (!scheme) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>;
  const isNonSidang = scheme.toLowerCase().includes('non');
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999,
      background:  isNonSidang ? '#F5F3FF' : '#DBEAFE',
      border:      `1.5px solid ${isNonSidang ? '#DDD6FE' : '#BFDBFE'}`,
      color:       isNonSidang ? '#5B21B6' : '#1D4ED8',
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

const PAGE_SIZE = 8;

const RegistrasiSidang = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [registrations, setRegistrations] = useState([]);
  const [responseMap,   setResponseMap]   = useState({}); 
  const [prodiMap,      setProdiMap]      = useState({}); 

  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [currentPage,     setCurrentPage]     = useState(1);
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });
  const [modalReg, setModalReg] = useState(null); // registration yang sedang dibuka di modal

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // All registrations
      const raw  = await getAllSidangRegistrations();
      const list = raw?.data ?? raw ?? [];

      // Only non-draft (submitted) registrations
      const submitted = list.filter(r => r.isDraft === false);

      // Responses in parallel
      const respArr = await Promise.all(
        submitted.map(r => getSidangRegistrationResponse(r.id).catch(() => null))
      );
      const rMap = {};
      submitted.forEach((r, i) => { if (respArr[i]) rMap[r.id] = respArr[i]; });
      setResponseMap(rMap);

      const prodiIds = [...new Set(
        submitted.map(r => r.student?.studyProgramId).filter(Boolean)
      )];
      const prodiArr = await Promise.all(
        prodiIds.map(id => getStudyProgramById(id).catch(() => null))
      );
      const prMap = {};
      prodiIds.forEach((id, i) => { if (prodiArr[i]) prMap[id] = prodiArr[i].name ?? '—'; });
      setProdiMap(prMap);

      setRegistrations(submitted);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) logout();
      showAlert('error', 'Gagal Memuat Data', 'Tidak dapat mengambil data registrasi sidang.');
    } finally {
      setLoading(false);
    }
  }, [logout, showAlert]);

  useEffect(() => {
    if (user?.role === 'ACADEMIC_STAFF') fetchAll();
  }, [user]);

  const getStatus = useCallback((reg) => {
    const response = responseMap[reg.id] ?? null;
    // Period HANYA diambil dari response, bukan dari registration.sidangPeriodId
    // Source: response.sidangPeriod (nested) dari GET /api/sidang-registration-responses/registration/{id}
    const uploads  = reg.sidangRegistrationUploads ?? [];
    return determineSidangStatus(reg, response, null, uploads);
  }, [responseMap]);

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
      .sort((a, b) => {
        const sa = getStatus(a);
        const sb = getStatus(b);
        return (STATUS_SORT_ORDER[sa] ?? 99) - (STATUS_SORT_ORDER[sb] ?? 99);
      });
  }, [registrations, searchDebounced, filterStatus, getStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginated  = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchDebounced, filterStatus]);

  const countAll      = registrations.length;
  const countStatus   = (s) => registrations.filter(r => getStatus(r) === s).length;

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  // Tanggal submit: ambil dari upload pertama atau createdAt registrasi
  const getSubmitDate = (reg) =>
    reg.sidangRegistrationUploads?.[0]?.createdAt ?? reg.createdAt ?? null;

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
              </div>

              <div className="vs-table-divider" />

              {/* Table */}
              <div className="vs-table-wrap">
                <table className="vs-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>NO</th>
                      <th>MAHASISWA</th>
                      <th>PRODI</th>
                      <th>JALUR SIDANG</th>
                      <th>SKEMA</th>
                      <th style={{ textAlign: 'center' }}>STATUS</th>
                      <th>TANGGAL</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '52px 0', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <Loader size={24} color="#C0182A" style={{ animation: 'vs-spin 1s linear infinite' }} />
                            <span style={{ fontSize: 13, color: '#6B7280' }}>Memuat data registrasi...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '52px 0', textAlign: 'center' }}>
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
                        const status     = getStatus(reg);
                        const prodiName  = prodiMap[reg.student?.studyProgramId] ?? '—';
                        const canVerify  = isAdminVerifiable(status);
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
                              <div className="vs-mhs-name">{reg.student?.name || `Mahasiswa #${reg.studentId}`}</div>
                              <div className="vs-mhs-nim">{reg.student?.nim  || '—'}</div>
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
                            <td className="vs-td-date">{fmtDate(getSubmitDate(reg))}</td>
                            <td className="vs-td-center">
                              {isVerified ? (
                                <button className="vs-btn-verified" disabled>
                                  <CheckCircle2 size={12} />
                                  Terverifikasi
                                </button>
                              ) : canVerify ? (
                                <button
                                  className="vs-btn-verif"
                                  onClick={() => setModalReg(reg)}
                                >
                                  Verifikasi
                                </button>
                              ) : (
                                <button className="vs-btn-verif" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                                  Verifikasi
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
        {modalReg && (
          <VerifikasiBerkasModal
            registration={modalReg}
            onClose={() => setModalReg(null)}
            onSaved={({ hasBermasalah }) => {
              setModalReg(null);
              showAlert(
                'success',
                hasBermasalah ? 'Revisi Dikirim' : 'Verifikasi Berhasil',
                hasBermasalah
                  ? 'Permintaan revisi berhasil dikirim ke mahasiswa.'
                  : 'Pendaftaran sidang mahasiswa telah diverifikasi.',
              );
              fetchAll(); // refresh list supaya status terupdate
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default RegistrasiSidang;