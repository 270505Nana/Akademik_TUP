import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Eye, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin    from '../../components/sidebar/SidebarAdmin';
import CustomAlert     from '../../components/common/CustomAlert';
import EvidenceModal   from '../../components/admin/permohonanSK/EvidenceModal';
import VerifikasiModal from '../../components/admin/permohonanSK/VerifikasiModal';
import FormulirSKModal from '../../components/admin/permohonanSK/FormulirSKModal';
import { determineStatus, unwrapResponse } from '../../components/admin/permohonanSK/skHelpers';

import {
  getAllSktaRequests,
  getSktaResponseByRequestId,
  getSktaResponseUploadByStudentId,
  createOrUpdateSktaResponse,
  getStudyPrograms,
  getStudyProgramById,
} from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import '../../components/admin/css/permohonanSK.css';

/*  Status Badge  */
const STATUS_CONFIG = {
  'sudah-terbit': { label: 'Sudah Terbit', cls: 'sudah-terbit' },
  'belum-terbit': { label: 'Belum Terbit', cls: 'belum-terbit' },
  'dalam-proses': { label: 'Dalam Proses', cls: 'dalam-proses' },
};
const StatusBadge = ({ status }) => {
  const { label, cls } = STATUS_CONFIG[status] || STATUS_CONFIG['belum-terbit'];
  return <span className={`sk-badge ${cls}`}>{label}</span>;
};

const PAGE_SIZE = 5;
const PermohonanSK = () => {
  const { user, logout } = useAuth();

  const [sidebarOpen,        setSidebarOpen]        = useState(false);
  const [search,             setSearch]             = useState('');
  const [filterProdi,        setFilterProdi]        = useState('');
  const [filterStatus,       setFilterStatus]       = useState('');
  const [currentPage,        setCurrentPage]        = useState(1);
  const [requests,           setRequests]           = useState([]);
  const [prodiList,          setProdiList]          = useState([]);
  const [loading,            setLoading]            = useState(false);
  const [evidenceItem,       setEvidenceItem]       = useState(null);
  const [selectedVerifikasi, setSelectedVerifikasi] = useState(null);
  const [existingResponse,   setExistingResponse]   = useState(null);
  const [formulirItem,       setFormulirItem]       = useState(null); // untuk export formulir SK
  const [alert,              setAlert]              = useState({ show: false, type: '', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  };

  /*  Fetch Prodi  */
  useEffect(() => {
    getStudyPrograms()
      .then(data => setProdiList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /*  Fetch Requests  */
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res      = await getAllSktaRequests({ search: search.trim() || undefined });
      const dataList = res?.data ?? res ?? [];
      const groupByStudent = new Map();
      dataList.forEach(item => {
        const sid = item.studentId;
        if (!groupByStudent.has(sid)) groupByStudent.set(sid, []);
        groupByStudent.get(sid).push(item);
      });

      // request yang punya sktaResponse (sudah diproses admin)
      // request dengan id terbesar (pengajuan terbaru)
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

          const studyProgramId = chosen.student?.studyProgramId;
          let prodiName = '-';
          if (studyProgramId) {
            const prodi = await getStudyProgramById(studyProgramId).catch(() => null);
            prodiName = prodi?.name ?? '-';
          }
          const tanggal = chosen.sktaRequestUploads?.[0]?.createdAt ?? null;

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
    if (user?.role === 'ACADEMIC_STAFF') fetchRequests();
  }, [search, user]);

  /*  Filter + Sort  */
  const STATUS_ORDER = { 'dalam-proses': 1, 'belum-terbit': 2, 'sudah-terbit': 3 };
  const getStatus    = r => determineStatus(r.sktaResponse, r.skUploads);

  const filteredSorted = useMemo(() => (
    [...requests]
      .filter(r => !filterProdi  || r.prodiName === filterProdi)
      .filter(r => !filterStatus || getStatus(r) === filterStatus)
      .sort((a, b) => (STATUS_ORDER[getStatus(a)] || 99) - (STATUS_ORDER[getStatus(b)] || 99))
  ), [requests, filterProdi, filterStatus]);

  const totalPages = Math.ceil(filteredSorted.length / PAGE_SIZE) || 1;
  const paginated  = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [filterProdi, filterStatus, search]);

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
    if (!user?.id) return showAlert('error', 'Error', 'Academic Staff ID tidak ditemukan');
    try {
      const fd = new FormData();
      fd.append('hasUploadedFinalProposal', String(payload.checks.proposal));
      fd.append('hasTakenLanguageTest',     String(payload.checks.bahasa));
      fd.append('message',         payload.catatan || '');
      fd.append('academicStaffId', String(user.id));
      fd.append('sktaRequestId',   String(payload.selectedPermohonan.id));
      if (payload.batasPerbaikan)       fd.append('expDate',  payload.batasPerbaikan);
      if (payload.uploadedFile)         fd.append('sktaFile', payload.uploadedFile);
      if (payload.existingResponse?.id) fd.append('id', String(payload.existingResponse.id));

      await createOrUpdateSktaResponse(fd);
      showAlert('success', 'Berhasil', `SK untuk ${payload.selectedPermohonan.student?.name} berhasil diperbarui.`);
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

        <div className="page-wrapper">
          <div className="top-bar-red"><h1>Layanan SK TA</h1></div>

          <div className="content-container">
            <div className="breadcrumb">Beranda / Layanan SK TA / Permohonan SK</div>
            <h2 className="page-title">Permohonan SK TA</h2>

            <section className="card-main">
              <div className="card-body" style={{ paddingBottom: 0 }}>

                {/* Filter Bar */}
                <div className="sk-filter-bar">
                  <div className="sk-search-wrap">
                    <span className="sk-search-icon"><Search size={15} /></span>
                    <input
                      type="text"
                      className="sk-search-input"
                      placeholder="Cari Nama atau NIM..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="sk-filter-select"
                    value={filterProdi}
                    onChange={e => setFilterProdi(e.target.value)}
                  >
                    <option value="">Semua Prodi</option>
                    {prodiList.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    className="btn-export-sk"
                    onClick={() => showAlert('success', 'Export', 'Data sedang disiapkan...')}
                  >
                    <Download size={15} /> Expor Evidence Akreditasi
                  </button>
                </div>

                <div className="sk-status-tabs">
                  {[
                    { key: '',             label: 'Semua'        },
                    { key: 'dalam-proses', label: 'Dalam Proses' },
                    { key: 'belum-terbit', label: 'Belum Terbit' },
                    { key: 'sudah-terbit', label: 'Sudah Terbit' },
                  ].map(({ key, label }) => {
                    const count = key === '' ? requests.length
                      : requests.filter(r => getStatus(r) === key).length;
                    return (
                      <button
                        key={key}
                        className={`sk-status-tab ${filterStatus === key ? 'active' : ''}`}
                        onClick={() => setFilterStatus(key)}
                      >
                        {label} <span className="sk-tab-count">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sk-table-divider" />

              {/* Tabel */}
              <div className="sk-table-wrap">
                <table className="sk-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>NO</th>
                      <th>MAHASISWA</th>
                      <th>PRODI</th>
                      <th style={{ textAlign: 'center' }}>EVIDENCE</th>
                      <th style={{ textAlign: 'center' }}>STATUS BERKAS</th>
                      <th>TANGGAL</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12">Memuat data...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12">Tidak ada data sesuai filter</td></tr>
                    ) : (
                      paginated.map((item, idx) => {
                        const student     = item.student || {};
                        const status      = getStatus(item);
                        const actionLabel = status === 'sudah-terbit' ? 'Terverifikasi' : 'Verifikasi';
                        return (
                          <tr key={item.id}>
                            <td className="text-center">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                            <td>
                              <div className="sk-mhs-name">{student.name || `Mahasiswa ID ${item.studentId}`}</div>
                              <div className="sk-mhs-nim">{student.nim || '-'}</div>
                            </td>
                            <td><span className="sk-prodi-text">{item.prodiName}</span></td>
                            <td className="text-center">
                              <button className="btn-evidence" onClick={() => setEvidenceItem(item)}>
                                <Eye size={13} /> Lihat Evidence
                              </button>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <StatusBadge status={status} />
                            </td>
                            <td className="sk-date-text">
                              {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="text-center action-buttons">
                              <button className="btn-verifikasi-sk" onClick={() => handleOpenVerifikasi(item)}>
                                {actionLabel}
                              </button>
                              {status === 'sudah-terbit' && (
                                <button
                                  className="btn-export-sk"
                                  onClick={() => setFormulirItem(item)}
                                >
                                  Export
                                </button>
                              )}
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
                    Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredSorted.length)} dari {filteredSorted.length} data
                  </span>
                  <div className="sk-pagination">
                    <button className="btn-page" disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`btn-page ${p === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}>{p}</button>
                    ))}
                    <button className="btn-page" disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}>
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
          <EvidenceModal item={evidenceItem} onClose={() => setEvidenceItem(null)} />
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

      {/* Alert Toast */}
      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: 300, opacity: 0 }}
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermohonanSK;