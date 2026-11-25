import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Menu,
  ChevronDown,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin    from '../../components/sidebar/SidebarAdmin';
import CustomAlert     from '../../components/common/CustomAlert';
import VerifikasiModal from '../../components/admin/permohonanSK/VerifikasiModal';
import FormulirSKModal from '../../components/admin/permohonanSK/FormulirSKModal';
import { determineStatus, unwrapResponse } from '../../components/admin/permohonanSK/skHelpers';

import {
  getAllSktaRequests,
  getSktaResponseByRequestId,
  getSktaResponseUploadByStudentId,
  approvePermohonanSK,
  rejectPermohonanSK,
  getStudyPrograms,
  getSKTARequest,
  getEvidenceUploadsByStudentId,
} from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import '../../style/css/admin/permohonanSK.css';

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
  const [sort, setSort]     = useState({ field: null, dir: 'asc' });
  const [filterStatus,       setFilterStatus]       = useState('');
  const [currentPage,        setCurrentPage]        = useState(1);
  const [requests,           setRequests]           = useState([]);
  const [prodiList,          setProdiList]          = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [selectedVerifikasi, setSelectedVerifikasi] = useState(null);
  const [existingResponse,   setExistingResponse]   = useState(null);
  const [formulirItem,       setFormulirItem]       = useState(null);
  const [alert,              setAlert]              = useState({ show: false, type: '', title: '', message: '' });

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((p) => ({ ...p, show: false })), 4000);
  };

  useEffect(() => {
    getStudyPrograms()
      .then((data) => setProdiList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAllSktaRequests();
      const dataList = res?.data ?? res ?? [];

      const uniqueLatestRequests = new Map();
      dataList.forEach((item) => {
        const sid = item.studentId ?? item.mahasiswaId ?? item.student?.id ?? item.mahasiswa?.id;
        if (!uniqueLatestRequests.has(sid)) {
          uniqueLatestRequests.set(sid, item);
        }
      });

      const enriched = await Promise.all(
        Array.from(uniqueLatestRequests.values()).map(async (req) => {
          const sid = req.studentId ?? req.mahasiswaId ?? req.student?.id ?? req.mahasiswa?.id;

          const [rawResp, uploadsRaw] = await Promise.all([
            getSktaResponseByRequestId(req.id).catch(() => null),
            getSktaResponseUploadByStudentId(sid).catch(() => null),
          ]);

          const sktaResponse = unwrapResponse(rawResp);
          const skUploads = uploadsRaw?.data ?? uploadsRaw ?? [];
          const prodiName = req.mahasiswa?.studyProgram?.name ?? req.student?.studyProgram?.name ?? '-';

          const tanggal =
            req.sktaRequestUploads?.[0]?.createdAt ??
            skUploads?.[0]?.createdAt ??
            sktaResponse?.createdAt ??
            req.createdAt ??
            req.updatedAt ??
            null;

          return { ...req, studentId: sid, sktaResponse, skUploads, prodiName, tanggal };
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

  const getStatus = (r) => determineStatus(r.sktaResponse, r.skUploads, r);

  const STATUS_SORT_PRIORITY = {
    'dalam-proses'   : 1,
    'belum-terbit'   : 2,
    'mengirim-revisi': 3,
    'sudah-terbit'   : 4,
  };

  const handleSort = (field) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return { field: null, dir: 'asc' };
    });
  };

  const filteredSorted = useMemo(
    () =>
      [...requests]
        .filter((r) => {
          if (!searchDebounced) return true;
          const name = (r.mahasiswa?.name || r.student?.name || '').toLowerCase();
          const nim  = (r.mahasiswa?.nim || r.student?.nim || '').toLowerCase();
          return name.includes(searchDebounced) || nim.includes(searchDebounced);
        })
        .filter((r) => !filterProdi || r.prodiName === filterProdi)
        .filter((r) => !filterStatus || getStatus(r) === filterStatus)
        .sort((a, b) => {
          if (sort.field === 'name') {
            const na = (a.mahasiswa?.name || a.student?.name || '').toLowerCase();
            const nb = (b.mahasiswa?.name || b.student?.name || '').toLowerCase();
            const cmp = na.localeCompare(nb, 'id');
            return sort.dir === 'asc' ? cmp : -cmp;
          }
          if (sort.field === 'prodi') {
            const pa = (a.prodiName || '').toLowerCase();
            const pb = (b.prodiName || '').toLowerCase();
            const cmp = pa.localeCompare(pb, 'id');
            return sort.dir === 'asc' ? cmp : -cmp;
          }
          if (sort.field === 'status') {
            const pa = STATUS_SORT_PRIORITY[getStatus(a)] || 99;
            const pb = STATUS_SORT_PRIORITY[getStatus(b)] || 99;
            return sort.dir === 'asc' ? pa - pb : pb - pa;
          }
          const order = {
            'mengirim-revisi': 1,
            'dalam-proses'   : 2,
            'belum-terbit'   : 3,
            'sudah-terbit'   : 4,
          };
          return (order[getStatus(a)] || 99) - (order[getStatus(b)] || 99);
        }),
    [requests, searchDebounced, filterProdi, filterStatus, sort]
  );

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

  const handleOpenUnifiedModal = async (item, initialStep = 1) => {
    setSelectedVerifikasi(null);
    setExistingResponse(null);

    const studentId = item.studentId ?? item.mahasiswaId ?? item.student?.id;
    if (!studentId) return showAlert('error', 'Error', 'Student ID tidak ditemukan');

    try {
      const [rawResp, uploadsRaw, reqData, evUploads] = await Promise.all([
        getSktaResponseByRequestId(item.id).catch(() => null),
        getSktaResponseUploadByStudentId(studentId).catch(() => null),
        getSKTARequest(studentId).catch(() => null),
        getEvidenceUploadsByStudentId(studentId).catch(() => []),
      ]);

      const unwrapped = unwrapResponse(rawResp);
      const skUploads = uploadsRaw?.data ?? uploadsRaw ?? [];
      setExistingResponse(unwrapped ? { ...unwrapped, skUploads } : null);

      setSelectedVerifikasi({
        ...item,
        sktaRequest: reqData,
        evidenceUploads: evUploads,
        initialStep,
      });
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal Membuka Data', 'Tidak dapat memuat detail pengajuan');
    }
  };

  const handleCloseVerifikasi = () => {
    setSelectedVerifikasi(null);
    setExistingResponse(null);
  };

  const handleSaveVerifikasi = async (payload) => {
    if (!user?.id) return showAlert('error', 'Error', 'Staf Akademik ID tidak ditemukan');
    try {
      const permohonanId = payload.selectedPermohonan.id;
      const mhsName =
        payload.selectedPermohonan.mahasiswa?.name ||
        payload.selectedPermohonan.student?.name ||
        'Mahasiswa';

      if (payload.actionType === 'reject') {
        await rejectPermohonanSK(permohonanId, {
          message: payload.catatan,
          adminId: user.id,
          isEdit: payload.isEdit,
        });
        showAlert('success', 'Berhasil', `Pengajuan untuk ${mhsName} berhasil ditolak.`);
      } else {
        await approvePermohonanSK(permohonanId, {
          hasUploadedFinalProposal: payload.checks.proposal,
          hasTakenLanguageTest: payload.checks.bahasa,
          expDate: payload.batasPerbaikan,
          adminId: user.id,
          sktaFile: payload.uploadedFile,
        });
        showAlert('success', 'Berhasil', `SK untuk ${mhsName} berhasil disetujui.`);
      }
      handleCloseVerifikasi();
      await fetchRequests();
    } catch (err) {
      let errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat memproses data.';
      if (errorMsg.toLowerCase().includes('draft')) {
        errorMsg = 'Gagal memproses. Mahasiswa belum men-submit ulang perbaikan berkas (Status masih Draft).';
      }
      showAlert('error', 'Gagal', errorMsg);
    }
  };

  return (
    <div className="sk-page-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="sk-main-content">
        <div className="mobile-menu-bar">
          <button type="button" onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Layanan SK TA</h1>
          </div>

          <div className="content-container">
            <h2 className="page-title">Permohonan SK TA</h2>

            <section className="card-main">
              <div className="card-body sk-card-body-filter">
                <div className="sk-filter-bar">
                  <div className="sk-search-wrap">
                    <span className="sk-search-icon"><Search size={15} /></span>
                    <input
                      type="text"
                      className="sk-search-input"
                      placeholder="Cari Nama atau NIM..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
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
                      const count =
                        key === ''
                          ? requests.length
                          : requests.filter((r) => getStatus(r) === key).length;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`sk-status-tab ${filterStatus === key ? 'active' : ''}`}
                          onClick={() => setFilterStatus(key)}
                        >
                          {label} <span className="sk-tab-count">({count})</span>
                        </button>
                      );
                    })}

                    <div className="sk-prodi-dropdown" ref={prodiDropdownRef}>
                      <button
                        type="button"
                        className={`sk-prodi-dropdown-trigger ${filterProdi ? 'active' : ''}`}
                        onClick={() => setProdiDropdownOpen((o) => !o)}
                      >
                        <span>{filterProdi || 'Semua Prodi'}</span>
                        <ChevronDown
                          size={14}
                          className={`sk-prodi-chevron ${prodiDropdownOpen ? 'open' : ''}`}
                        />
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
                              onClick={() => {
                                setFilterProdi('');
                                setProdiDropdownOpen(false);
                              }}
                            >
                              <span>Semua Prodi</span>
                              {!filterProdi && <Check size={14} />}
                            </div>
                            {prodiList.map((p) => (
                              <div
                                key={p.id}
                                className={`sk-prodi-dropdown-option ${filterProdi === p.name ? 'selected' : ''}`}
                                onClick={() => {
                                  setFilterProdi(p.name);
                                  setProdiDropdownOpen(false);
                                }}
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
                    <button
                      type="button"
                      className="btn-export-sk sm"
                      onClick={() => showAlert('success', 'Export', 'Data sedang disiapkan...')}
                    >
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
                      <th className="sk-th-no text-center">NO</th>
                      <th className="sk-th-sortable" onClick={() => handleSort('name')}>
                        <span className="sk-th-sort-inner">
                          MAHASISWA
                          {sort.field === 'name'
                            ? sort.dir === 'asc'
                              ? <ArrowUp size={11} />
                              : <ArrowDown size={11} />
                            : <ArrowUpDown size={11} className="sk-sort-idle" />}
                        </span>
                      </th>
                      <th className="sk-th-sortable" onClick={() => handleSort('prodi')}>
                        <span className="sk-th-sort-inner">
                          PRODI
                          {sort.field === 'prodi'
                            ? sort.dir === 'asc'
                              ? <ArrowUp size={11} />
                              : <ArrowDown size={11} />
                            : <ArrowUpDown size={11} className="sk-sort-idle" />}
                        </span>
                      </th>
                      <th className="text-center">EVIDENCE & VERIFIKASI DATA</th>
                      <th className="text-center">KATEGORI</th>
                      <th className="text-center sk-th-sortable" onClick={() => handleSort('status')}>
                        <span className="sk-th-sort-inner">
                          STATUS BERKAS
                          {sort.field === 'status'
                            ? sort.dir === 'asc'
                              ? <ArrowUp size={11} />
                              : <ArrowDown size={11} />
                            : <ArrowUpDown size={11} className="sk-sort-idle" />}
                        </span>
                      </th>
                      <th className="text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="sk-table-state-cell">
                          Memuat data...
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="sk-table-state-cell">
                          Tidak ada data sesuai filter
                        </td>
                      </tr>
                    ) : (
                      paginated.map((item, idx) => {
                        const student = item.mahasiswa || item.student || {};
                        const status = getStatus(item);
                        const isPerpanjangan = item.category === 'Perpanjangan SK';

                        return (
                          <tr key={item.id}>
                            <td className="text-center">
                              {(currentPage - 1) * PAGE_SIZE + idx + 1}
                            </td>
                            <td>
                              <div className="sk-mhs-name">
                                {student.name || `Mahasiswa ID ${item.studentId ?? item.mahasiswaId ?? item.student?.id}`}
                              </div>
                              <div className="sk-mhs-nim">{student.nim || '-'}</div>
                            </td>
                            <td>
                              <span className="sk-prodi-text" title={item.prodiName}>
                                {item.prodiName}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn-evidence"
                                onClick={() => handleOpenUnifiedModal(item, 1)}
                              >
                                <Eye size={13} /> Evidence
                              </button>
                            </td>
                            <td className="text-center">
                              <span className={`sk-category-badge ${isPerpanjangan ? 'perpanjangan' : 'baru'}`}>
                                {item.category || 'Permohonan Baru'}
                              </span>
                            </td>
                            <td className="text-center">
                              <StatusBadge status={status} />
                            </td>
                            <td className="text-center action-buttons">
                              <div className="sk-action-inner">
                                {status === 'sudah-terbit' ? (
                                  <button
                                    type="button"
                                    className="btn-export-sk sm"
                                    onClick={() => setFormulirItem(item)}
                                  >
                                    Export FormulirSKTA
                                  </button>
                                ) : (
                                  <span className="sk-action-empty">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredSorted.length > 0 && (
                <div className="sk-table-footer">
                  <span className="sk-page-info">
                    Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredSorted.length)} dari {filteredSorted.length} data
                  </span>
                  <div className="sk-pagination">
                    <button
                      type="button"
                      className="btn-page"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`btn-page ${p === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn-page"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
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

      <AnimatePresence>
        {alert.show && (
          <motion.div
            className="alert-overlay"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermohonanSK;