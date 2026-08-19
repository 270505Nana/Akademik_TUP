import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Eye, ChevronLeft, ChevronRight, Menu, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin    from '../../components/sidebar/SidebarAdmin';
import CustomAlert     from '../../components/common/CustomAlert';
import EvidenceModal   from '../../components/admin/permohonanSK/EvidenceModal';
import VerifikasiModal from '../../components/admin/permohonanSK/VerifikasiModal';
import FormulirSKModal from '../../components/admin/permohonanSK/FormulirskModal';
import { determineStatus, unwrapResponse } from '../../components/admin/permohonanSK/skHelpers';

import {
  getAllSktaRequests,
  getSktaResponseByRequestId,
  getSktaResponseUploadByStudentId,
  approvePermohonanSK,
  rejectPermohonanSK,
  getStudyPrograms,
  getStudyProgramById,
  getSKTARequest,
  getEvidenceUploadsByStudentId,
} from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import '../../components/admin/css/permohonanSK.css';

/*  Status Badge  */
const STATUS_CONFIG = {
  'sudah-terbit'    : { label: 'Sudah Terbit',    cls: 'sudah-terbit'    },
  'belum-terbit'    : { label: 'Belum Terbit',    cls: 'belum-terbit'    },
  'dalam-proses'    : { label: 'Dalam Proses',    cls: 'dalam-proses'    },
  'mengirim-revisi' : { label: 'Mengirim Revisi', cls: 'mengirim-revisi' },
};

const StatusBadge = ({ status }) => {
  const { label, cls } = STATUS_CONFIG[status] || STATUS_CONFIG['belum-terbit'];
  return <span className={`sk-badge ${cls}`}>{label}</span>;
};

const PAGE_SIZE = 100;

const PermohonanSK = () => {
  const { user, logout } = useAuth();

  const [sidebarOpen,        setSidebarOpen]        = useState(false);
  const [search,             setSearch]             = useState('');
  const [searchDebounced,    setSearchDebounced]    = useState('');
  const [filterProdi,        setFilterProdi]        = useState('');
  const [prodiDropdownOpen,  setProdiDropdownOpen]  = useState(false);
  const prodiDropdownRef    = useRef(null);
  const [filterStatus,       setFilterStatus]       = useState('');
  const [currentPage,        setCurrentPage]        = useState(1);
  const [requests,           setRequests]           = useState([]);
  const [prodiList,          setProdiList]          = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [evidenceItem,       setEvidenceItem]       = useState(null);
  const [selectedVerifikasi, setSelectedVerifikasi] = useState(null);
  const [existingResponse,   setExistingResponse]   = useState(null);
  const [formulirItem,       setFormulirItem]       = useState(null);
  const [alert,              setAlert]              = useState({ show: false, type: '', title: '', message: '' });

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  };

  useEffect(() => {
    getStudyPrograms()
      .then(data => setProdiList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /* Fetch Requests */
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res      = await getAllSktaRequests();
      const dataList = res?.data ?? res ?? [];
      const groupByStudent = new Map();
      dataList.forEach(item => {
        const sid = item.studentId;
        if (!groupByStudent.has(sid)) groupByStudent.set(sid, []);
        groupByStudent.get(sid).push(item);
      });

      const enriched = await Promise.all(
        Array.from(groupByStudent.entries()).map(async ([, requests]) => {
          const uploadsRaw = await getSktaResponseUploadByStudentId(
            requests[0].studentId
          ).catch(() => null);
          const skUploads = uploadsRaw?.data ?? uploadsRaw ?? [];

          const withResponses = await Promise.all(
            requests.map(async (req) => {
              const raw = await getSktaResponseByRequestId(req.id).catch(() => null);
              return { ...req, sktaResponse: unwrapResponse(raw) };
            })
          );

          const processed = withResponses.filter(r => r.sktaResponse !== null);
          const chosen    = processed.length > 0
            ? processed.sort((a, b) => b.id - a.id)[0]   
            : withResponses.sort((a, b) => b.id - a.id)[0]; 

          const prodiName = chosen.student?.studyProgramNama ?? '-';
          const tanggal =
            chosen.sktaRequestUploads?.[0]?.createdAt ??
            skUploads?.[0]?.createdAt ??
            chosen.sktaResponse?.createdAt ??
            chosen.createdAt ??
            chosen.updatedAt ??
            null;

          return { ...chosen, skUploads, prodiName, tanggal };
        })
      );

      setRequests(enriched);
    } catch (err) {
      if ([401, 403].includes(err.response?.status)) logout();
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchRequests();
  }, [user]); 

  const getStatus = r => determineStatus(r.sktaResponse, r.skUploads, r);

  const filteredSorted = useMemo(() => (
    [...requests]
      .filter(r => {
        if (!searchDebounced) return true;
        const name = (r.student?.name || '').toLowerCase();
        const nim  = (r.student?.nim  || '').toLowerCase();
        return name.includes(searchDebounced) || nim.includes(searchDebounced);
      })
      .filter(r => !filterProdi  || r.prodiName === filterProdi)
      .filter(r => !filterStatus || getStatus(r) === filterStatus)
      .sort((a, b) => {
        const order = { 'mengirim-revisi': 1, 'dalam-proses': 2, 'belum-terbit': 3, 'sudah-terbit': 4 };
        return (order[getStatus(a)] || 99) - (order[getStatus(b)] || 99);
      })
  ), [requests, searchDebounced, filterProdi, filterStatus]);

  const totalPages = Math.ceil(filteredSorted.length / PAGE_SIZE) || 1;
  const paginated  = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchDebounced, filterProdi, filterStatus]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (prodiDropdownRef.current && !prodiDropdownRef.current.contains(e.target)) {
        setProdiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handlePreviewEvidence = async (item) => {
    const studentId = item.studentId;
    if (!studentId) return showAlert('error', 'Error', 'Student ID tidak ditemukan');

    try {
 
      const sktaRequest = await getSKTARequest(studentId);
      const evidenceUploads = await getEvidenceUploadsByStudentId(studentId);

      setEvidenceItem({
        ...item,
        sktaRequest: sktaRequest,           
        evidenceUploads: evidenceUploads,  
        isPreview: true
      });
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal Membuka Evidence', 'Tidak dapat memuat data evidence');
    }
  };

  // handleDownloadSK dipindah ke VerifikasiModal

  const handleOpenVerifikasi = async (item) => {
    setSelectedVerifikasi(item);
    setExistingResponse(null);
    const [raw, uploadsRaw] = await Promise.all([
      getSktaResponseByRequestId(item.id).catch(() => null),
      getSktaResponseUploadByStudentId(item.studentId).catch(() => null),
    ]);
    const unwrapped = unwrapResponse(raw);
    const skUploads = uploadsRaw?.data ?? uploadsRaw ?? [];
    setExistingResponse(unwrapped ? { ...unwrapped, skUploads } : null);
  };

  const handleCloseVerifikasi = () => {
    setSelectedVerifikasi(null);
    setExistingResponse(null);
  };

  const handleSaveVerifikasi = async (payload) => {
    if (!user?.id) return showAlert('error', 'Error', 'Staf Akademik ID tidak ditemukan');
    try {
      const permohonanId = payload.selectedPermohonan.id;
      if (payload.actionType === 'reject') {
        await rejectPermohonanSK(permohonanId, {
          message: payload.catatan,
          adminId: user.id,
        });
        showAlert('success', 'Berhasil', `Pengajuan untuk ${payload.selectedPermohonan.student?.name} berhasil ditolak.`);
      } else {
        await approvePermohonanSK(permohonanId, {
          hasUploadedFinalProposal: payload.checks.proposal,
          hasTakenLanguageTest: payload.checks.bahasa,
          expDate: payload.batasPerbaikan,
          adminId: user.id,
          sktaFile: payload.uploadedFile,
        });
        showAlert('success', 'Berhasil', `SK untuk ${payload.selectedPermohonan.student?.name} berhasil disetujui.`);
      }
      handleCloseVerifikasi();
      await fetchRequests();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  return (
    <div className="sk-page-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="sk-main-content">
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper" style={{ minWidth: 0, width: '100%', overflowX: 'auto', margin: 0, padding: 0 }}>
          <div className="top-bar-red" style={{ overflow: 'hidden', margin: 0 }}>
            <h1 style={{ margin: 0 }}>Layanan SK TA</h1>
          </div>

          <div className="content-container">
            <h2 className="page-title">Permohonan SK TA</h2>

            <section className="card-main">
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="sk-filter-bar">
                  <div className="sk-search-wrap">
                    <span className="sk-search-icon"><Search size={15} /></span>
                    <input type="text" className="sk-search-input" placeholder="Cari Nama atau NIM..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>

                <div className="sk-toolbar-row">
                  <div className="sk-status-tabs">
                    {[
                      { key: '', label: 'Semua' },
                      { key: 'dalam-proses', label: 'Dalam Proses' },
                      { key: 'mengirim-revisi', label: 'Mengirim Revisi' },
                      { key: 'belum-terbit', label: 'Belum Terbit' },
                      { key: 'sudah-terbit', label: 'Sudah Terbit' },
                    ].map(({ key, label }) => {
                      const count = key === '' ? requests.length : requests.filter(r => getStatus(r) === key).length;
                      return (
                        <button key={key} className={`sk-status-tab ${filterStatus === key ? 'active' : ''}`} onClick={() => setFilterStatus(key)}>
                          {label} <span className="sk-tab-count">({count})</span>
                        </button>
                      );
                    })}
                    <div className="sk-prodi-dropdown" ref={prodiDropdownRef} style={{ marginLeft: 6 }}>
                      <button
                        type="button"
                        className={`sk-prodi-dropdown-trigger ${filterProdi ? 'active' : ''}`}
                        onClick={() => setProdiDropdownOpen(o => !o)}
                      >
                        <span>{filterProdi || 'Semua Prodi'}</span>
                        <ChevronDown size={14} style={{ transform: prodiDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>

                      <AnimatePresence>
                        {prodiDropdownOpen && (
                          <motion.div
                            className="sk-prodi-dropdown-panel"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div
                              className={`sk-prodi-dropdown-option ${!filterProdi ? 'selected' : ''}`}
                              onClick={() => { setFilterProdi(''); setProdiDropdownOpen(false); }}
                            >
                              <span>Semua Prodi</span>
                              {!filterProdi && <Check size={14} />}
                            </div>
                            {prodiList.map(p => (
                              <div
                                key={p.id}
                                className={`sk-prodi-dropdown-option ${filterProdi === p.name ? 'selected' : ''}`}
                                onClick={() => { setFilterProdi(p.name); setProdiDropdownOpen(false); }}
                              >
                                <span>{p.name}</span>
                                {filterProdi === p.name && <Check size={14} />}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="sk-toolbar-actions">
                    <button className="btn-export-sk sm" onClick={() => showAlert('success', 'Export', 'Data sedang disiapkan...')}>
                      <Download size={14} /> Expor SK TA MHS
                    </button>
                  </div>
                </div>
              </div>

              <div className="sk-table-divider" />

              <div className="sk-table-wrap">
                <table className="sk-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>NO</th>
                      <th>MAHASISWA</th>
                      <th>PRODI</th>
                      <th style={{ textAlign: 'center' }}>EVIDENCE</th>
                      <th style={{ textAlign: 'center' }}>STATUS BERKAS</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-12">Memuat data...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12">Tidak ada data sesuai filter</td></tr>
                    ) : (
                      paginated.map((item, idx) => {
                        const student = item.student || {};
                        const status = getStatus(item);
                        const actionLabel = status === 'sudah-terbit' ? 'Terverifikasi' :
                                          status === 'mengirim-revisi' ? 'Tinjau Revisi' : 'Verifikasi';

                        return (
                          <tr key={item.id}>
                            <td className="text-center">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                            <td>
                              <div className="sk-mhs-name">{student.name || `Mahasiswa ID ${item.studentId}`}</div>
                              <div className="sk-mhs-nim">{student.nim || '-'}</div>
                            </td>
                            <td><span className="sk-prodi-text">{item.prodiName}</span></td>
                            <td className="text-center">
                              <button className="btn-evidence" onClick={() => handlePreviewEvidence(item)}>
                                <Eye size={13} /> Lihat Evidence
                              </button>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <StatusBadge status={status} />
                            </td>
                            <td className="text-center action-buttons">
                              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 6 }}>
                                {/* Verifikasi / Terverifikasi / Tinjau Revisi */}
                                <button className="btn-verifikasi-sk" onClick={() => handleOpenVerifikasi(item)}>
                                  {actionLabel}
                                </button>
                                <button
                                  className="btn-export-sk"
                                  style={{ opacity: status === 'sudah-terbit' ? 1 : 0, pointerEvents: status === 'sudah-terbit' ? 'auto' : 'none' }}
                                  onClick={() => setFormulirItem(item)}
                                >
                                  Export
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredSorted.length > 0 && (
                <div className="sk-table-footer">
                  <span className="sk-page-info">
                    Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredSorted.length)} dari {filteredSorted.length} data
                  </span>
                  <div className="sk-pagination">
                    <button className="btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`btn-page ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>
                        {p}
                      </button>
                    ))}
                    <button className="btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={14} />
                    </button>

                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {evidenceItem && (
          <EvidenceModal 
            item={evidenceItem} 
            onClose={() => setEvidenceItem(null)} 
          />
        )}
        
        {selectedVerifikasi && (
          <VerifikasiModal
            selectedPermohonan={selectedVerifikasi}
            existingResponse={existingResponse}
            isReadOnly={getStatus(selectedVerifikasi) === 'sudah-terbit'}
            onClose={handleCloseVerifikasi}
            onSave={handleSaveVerifikasi}
          />
        )}


        {formulirItem && (
          <FormulirSKModal
            item={formulirItem}
            existingResponse={formulirItem.sktaResponse}
            onClose={() => setFormulirItem(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .sk-page-root {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC;
        }
        .sk-main-content {
          flex: 1;
          min-width: 0;       
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }
        /* #sidebar (sidebar.css) lebarnya 240px via --sidebar-width, fixed position — main content wajib punya margin-left senilai itu supaya tidak ketutup sidebar */
        #sidebar ~ .sk-main-content,
        .sk-main-content {
          margin-left: 240px;
          padding: 0;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 991.98px) {
          .sk-main-content { margin-left: 0 !important; }
        }
        /* page-wrapper ikut flex stretch */
        .sk-main-content .page-wrapper {
          flex: 1;
          min-width: 0;
          width: 100%;
          margin-left: 0 !important;  /* override aturperiode.css margin-left var */
        }
        .sk-main-content .page-wrapper,
        .sk-main-content .top-bar-red {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }

        /* ── Action buttons: selalu sama lebar ── */
        .action-buttons { vertical-align: middle; }

        html, body, #root {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .sk-page-root { width: 100%; }
        .sk-main-content,
        .sk-main-content .page-wrapper,
        .sk-main-content .content-container,
        .sk-main-content .top-bar-red,
        .sk-main-content .card-main {
          width: 100% !important;
          max-width: none !important;
          box-sizing: border-box;
          overflow: visible !important;
        }
        .sk-main-content .card-body,
        .sk-toolbar-row,
        .sk-status-tabs {
          overflow: visible !important;
        }

        .sk-status-tabs { align-items: center; overflow: visible; }
        .sk-prodi-dropdown-panel { max-width: min(240px, calc(100vw - 32px)); }

        .sk-prodi-dropdown {
          position: relative;
          flex-shrink: 0;
        }
        .sk-prodi-dropdown-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 140px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1.5px solid #E2E8F0;
          background: #fff;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .sk-prodi-dropdown-trigger:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }
        .sk-prodi-dropdown-trigger.active {
          border-color: #C0182A;
          color: #C0182A;
          background: #FFF1F2;
        }
        .sk-prodi-dropdown-trigger span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sk-prodi-dropdown-panel {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: auto;
          z-index: 40;
          width: max-content;
          min-width: 180px;
          max-width: 240px;
          max-height: 260px;
          overflow-y: auto;
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
          padding: 5px;
        }
        .sk-prodi-dropdown-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: background 0.12s;
          line-height: 1.35;
        }
        .sk-prodi-dropdown-option:hover {
          background: #F8FAFC;
        }
        .sk-prodi-dropdown-option.selected {
          background: #FFF1F2;
          color: #C0182A;
          font-weight: 700;
        }
        .sk-prodi-dropdown-option svg {
          flex-shrink: 0;
          color: #C0182A;
        }
      `}</style>

      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermohonanSK;