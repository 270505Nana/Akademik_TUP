import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  Upload,
  FileText,
  X,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit3,
  Download,
  ChevronDown,
  Check,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../sidebar/SidebarAdmin';
import CustomAlert from '../../common/CustomAlert';
import {
  getStudyPrograms,
  getYudisiumRegistrations,
  getYudisiumPeriods,
  uploadSkl,
  uploadTranskrip,
  downloadSklFile,
  downloadTranskripFile,
  listSklUploads,
  listTranskripUploads,
} from '../../../service/api';
import '../css/skltranskrip.css';

const FILTER_STATUS_TABS = [
  { key: '', label: 'Semua' },
  { key: 'uploaded', label: 'Sudah Upload' },
  { key: 'unuploaded', label: 'Belum Upload' },
];

const PAGE_SIZE = 10;
const formatDateId = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getPeriodStatus = (start, end, isOpen) => {
  if (!start || !end) return null;
  const now = new Date();
  const s = new Date(`${start.slice(0, 10)}T00:00:00`);
  const e = new Date(`${end.slice(0, 10)}T23:59:59`);

  if (now < s) return 'Mendatang';
  if (now > e) return 'Selesai';
  return isOpen ? 'Aktif' : 'Nonaktif';
};

// Menentukan periode yudisium aktif atau terbaru dari daftar kategori 'yudisium'
const findActiveOrLatestPeriod = (periods = []) => {
  if (!Array.isArray(periods) || periods.length === 0) return null;

  // 1. Cari periode dengan status 'Aktif' (rentang waktu valid dan isOpen === true)
  const trulyActive = periods.find(
    (p) => getPeriodStatus(p.startDate, p.endDate, p.isOpen) === 'Aktif'
  );
  if (trulyActive) return trulyActive;

  // 2. Fallback: cari periode dengan isOpen === true
  const anyOpen = periods.find((p) => p.isOpen === true);
  if (anyOpen) return anyOpen;

  // 3. Fallback: ambil periode terbaru berdasarkan tanggal
  const sorted = [...periods].sort((a, b) => {
    const d1 = a.startDate || a.endDate || a.createdAt || '1970-01-01';
    const d2 = b.startDate || b.endDate || b.createdAt || '1970-01-01';
    return new Date(d2) - new Date(d1);
  });

  return sorted[0] || null;
};

/* 
 * Data di-load otomatis saat mount — memuat periode yudisium terbaru/aktif
 * dan mem-fetch data mahasiswa secara server-side.
 */
const DocUploadManager = ({
  docType = 'SKL',
  pageTitle = 'Upload SKL Mahasiswa',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [prodiList, setProdiList] = useState([]);
  const [periodeList, setPeriodeList] = useState([]);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [prodiDropdownOpen, setProdiDropdownOpen] = useState(false);
  const prodiDropdownRef = useRef(null);
  const [filterPeriodeId, setFilterPeriodeId] = useState('');
  const [periodeDropdownOpen, setPeriodeDropdownOpen] = useState(false);
  const periodeDropdownRef = useRef(null);

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Upload/Edit Modal ── */
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('upload');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [savingUpload, setSavingUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const [previewState, setPreviewState] = useState({
    isOpen: false, student: null, blobUrl: null, fileName: '',
  });
  const activeBlobUrlRef = useRef(null);
  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });
  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 4000);
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    if (typeof bytes === 'string') return bytes;
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (prodiDropdownRef.current && !prodiDropdownRef.current.contains(e.target)) {
        setProdiDropdownOpen(false);
      }
      if (periodeDropdownRef.current && !periodeDropdownRef.current.contains(e.target)) {
        setPeriodeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ─── Fetch master data prodi ───── */
  useEffect(() => {
    getStudyPrograms()
      .then((data) => setProdiList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /*  Fetch data mahasiswa dengan filter server-side yudisiumPeriodId  */
  const fetchStudents = useCallback(async (targetPeriodeId, currentPeriods = []) => {
    setLoadingStudents(true);
    try {
      const params = { limit: 'all' };
      if (targetPeriodeId) {
        params.yudisiumPeriodId = targetPeriodeId;
      }

      const regResult = await getYudisiumRegistrations(params);
      const registrations = Array.isArray(regResult)
        ? regResult
        : (regResult?.data ?? []);

      // Jika filter semua periode dipilih (targetPeriodeId kosong), ambil registrasi yang sudah ter-assign periode
      const withPeriod = targetPeriodeId
        ? registrations
        : registrations.filter((reg) => reg.yudisiumPeriodId || reg.yudisiumPeriod?.id);

      const normalized = withPeriod.map((reg) => {
        const mhs = reg.mahasiswa ?? reg.student ?? {};
        const periodObj = reg.yudisiumPeriod ?? currentPeriods.find((p) => p.id === reg.yudisiumPeriodId);

        return {
          registrationId: reg.id,
          mahasiswaId: mhs.id ?? reg.mahasiswaId,
          nim: mhs.nim ?? '-',
          name: mhs.user?.name ?? mhs.name ?? '-',
          prodi: mhs.studyProgram?.name ?? '-',
          periode: periodObj?.name ?? reg.yudisiumPeriod?.name ?? reg.yudisiumPeriodId ?? '-',
          periodeId: periodObj?.id ?? reg.yudisiumPeriodId ?? null,
          periodeEndDate: periodObj?.endDate ?? null,
          uploaded: false,
          uploadId: null,
          uploadDate: null,
          fileName: null,
          downloadUrl: null,
        };
      });

      // Fetch status upload berkas
      const docResult = docType === 'SKL'
        ? await listSklUploads({ limit: 'all' })
        : await listTranskripUploads({ limit: 'all' });

      const uploads = Array.isArray(docResult?.data)
        ? docResult.data
        : (Array.isArray(docResult) ? docResult : []);

      const uploadMap = new Map(uploads.map((u) => [u.mahasiswaId, u]));

      const enriched = normalized.map((s) => {
        const up = uploadMap.get(s.mahasiswaId);
        if (!up) return s;
        return {
          ...s,
          uploaded: true,
          uploadId: up.id,
          uploadDate: formatDateId(up.updatedAt ?? up.createdAt),
          fileName: up.name ?? `${docType}_${s.nim}.pdf`,
          downloadUrl: up.downloadUrl ?? null,
        };
      });

      setStudents(enriched);
    } catch (err) {
      console.error('Gagal memuat data mahasiswa:', err);
      showAlert('error', 'Gagal Memuat Data', 'Tidak dapat mengambil daftar mahasiswa dari server.');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [docType, showAlert]);

  const loadInitialData = useCallback(async () => {
    setLoadingPeriods(true);
    try {
      const rawPeriods = await getYudisiumPeriods('yudisium').catch(() => []);
      const periodsArray = Array.isArray(rawPeriods) ? rawPeriods : (rawPeriods?.data ?? []);
      const yudisiumPeriods = periodsArray.filter((p) => !p.category || p.category === 'yudisium');

      setPeriodeList(yudisiumPeriods);

      // Ambil periode yudisium terbaru/aktif secara otomatis
      const activePeriod = findActiveOrLatestPeriod(yudisiumPeriods);
      const initialPeriodId = activePeriod?.id || '';
      setFilterPeriodeId(initialPeriodId);
      await fetchStudents(initialPeriodId, yudisiumPeriods);
    } catch (err) {
      console.error('Gagal inisialisasi data:', err);
      showAlert('error', 'Gagal Memuat', 'Gagal memuat periode yudisium.');
    } finally {
      setLoadingPeriods(false);
    }
  }, [fetchStudents, showAlert]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const rawPeriods = await getYudisiumPeriods('yudisium').catch(() => []);
        const periodsArray = Array.isArray(rawPeriods) ? rawPeriods : (rawPeriods?.data ?? []);
        const yudisiumPeriods = periodsArray.filter((p) => !p.category || p.category === 'yudisium');
        setPeriodeList(yudisiumPeriods);
      } catch (e) {
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  /* ─── Handler ganti periode di dropdown ─── */
  const handleSelectPeriode = (pId) => {
    setFilterPeriodeId(pId);
    setPeriodeDropdownOpen(false);
    fetchStudents(pId, periodeList);
  };

  /* ─── Filter client-side untuk pencarian, status, dan prodi ─── */
  const filteredList = useMemo(() => {
    return students
      .filter((s) => {
        if (!searchDebounced) return true;
        return s.name.toLowerCase().includes(searchDebounced) ||
               s.nim.toLowerCase().includes(searchDebounced);
      })
      .filter((s) => {
        if (!filterStatus) return true;
        if (filterStatus === 'uploaded')   return s.uploaded === true;
        if (filterStatus === 'unuploaded') return s.uploaded === false;
        return true;
      })
      .filter((s) => !filterProdi || s.prodi === filterProdi);
  }, [students, searchDebounced, filterStatus, filterProdi]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginated  = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchDebounced, filterStatus, filterProdi, filterPeriodeId]);

  const getStatusCount = (key) => {
    if (key === 'uploaded')   return students.filter((s) => s.uploaded).length;
    if (key === 'unuploaded') return students.filter((s) => !s.uploaded).length;
    return students.length;
  };

  /* ─── Tombol refresh keseluruhan ─── */
  const handleRefresh = async () => {
    setSearch('');
    setFilterProdi('');
    setFilterStatus('');
    await loadInitialData();
    showAlert('info', 'Data Dimuat Ulang', 'Data mahasiswa dan periode berhasil diperbarui.');
  };

  /* Tombol refresh khusus periode  */
  const handleRefreshPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const rawPeriods = await getYudisiumPeriods('yudisium').catch(() => []);
      const periodsArray = Array.isArray(rawPeriods) ? rawPeriods : (rawPeriods?.data ?? []);
      const yudisiumPeriods = periodsArray.filter((p) => !p.category || p.category === 'yudisium');
      setPeriodeList(yudisiumPeriods);
      fetchStudents(filterPeriodeId, yudisiumPeriods);
    } catch (err) {
      console.error('Gagal refresh periode:', err);
    } finally {
      setLoadingPeriods(false);
    }
  };

  /* Upload Modal  */
  const openUploadModal = (student, mode = 'upload') => {
    setSelectedStudent(student);
    setModalMode(mode);
    setFile(null);
    setUploadError('');
    setIsUploadModalOpen(true);
  };

  const validateFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('File harus berformat PDF.');
      setFile(null);
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setUploadError(`${f.name} melebihi batas ukuran 4MB.`);
      setFile(null);
      return;
    }
    setUploadError('');
    setFile(f);
  };

  const handleFileChange = (e) => validateFile(e.target.files[0]);
  const handleDragOver  = (e) => e.preventDefault();
  const handleDrop      = (e) => { e.preventDefault(); validateFile(e.dataTransfer.files[0]); };

  /* Kirim file ke API lalu update state lokal */
  const handleSaveUpload = async () => {
    if (!file) { setUploadError('Harap pilih file terlebih dahulu.'); return; }
    if (!selectedStudent?.mahasiswaId) {
      showAlert('error', 'Error', 'ID mahasiswa tidak ditemukan.');
      return;
    }
    setSavingUpload(true);
    try {
      const docName = `${docType} — ${selectedStudent.name} (${selectedStudent.nim})`;
      const result = docType === 'SKL'
        ? await uploadSkl({ mahasiswaId: selectedStudent.mahasiswaId, name: docName, sklFile: file })
        : await uploadTranskrip({ mahasiswaId: selectedStudent.mahasiswaId, name: docName, transkripFile: file });

      setStudents((prev) =>
        prev.map((s) =>
          s.mahasiswaId === selectedStudent.mahasiswaId
            ? {
                ...s,
                uploaded: true,
                uploadId: result?.id ?? s.uploadId,
                uploadDate: formatDateId(result?.updatedAt ?? result?.createdAt ?? new Date()),
                fileName: result?.name ?? docName,
                downloadUrl: result?.downloadUrl ?? null,
              }
            : s
        )
      );
      setIsUploadModalOpen(false);
      showAlert(
        'success', 'Berhasil',
        modalMode === 'edit'
          ? `Berhasil memperbarui ${docType} untuk ${selectedStudent.name}`
          : `Berhasil mengunggah ${docType} untuk ${selectedStudent.name}`
      );
    } catch (err) {
      showAlert('error', 'Gagal Upload', err.response?.data?.message || 'Terjadi kesalahan saat mengunggah.');
    } finally {
      setSavingUpload(false);
    }
  };

  /* Preview Modal  */
  const openViewModal = async (student) => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    try {
      const blob = docType === 'SKL'
        ? await downloadSklFile(student.uploadId)
        : await downloadTranskripFile(student.uploadId);
      const objectUrl = URL.createObjectURL(blob);
      activeBlobUrlRef.current = objectUrl;
      setPreviewState({
        isOpen: true, student, blobUrl: objectUrl,
        fileName: student.fileName || `${docType}_${student.nim}.pdf`,
      });
    } catch {
      showAlert('error', 'Gagal Memuat Preview', 'Tidak dapat mengambil file dari server.');
    }
  };

  const closeViewModal = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setPreviewState({ isOpen: false, student: null, blobUrl: null, fileName: '' });
  };

  const handleDownloadPreviewFile = () => {
    if (!previewState.blobUrl) return;
    const a = document.createElement('a');
    a.href = previewState.blobUrl;
    a.download = previewState.fileName || `${docType}_Dokumen.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAlert('info', 'Unduh Berkas', `File ${previewState.fileName} berhasil diunduh.`);
  };

  return (
    <div className="sk-page-root">
      <SidebarAdmin
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, _icon, type) => showAlert(type || 'success', 'Info', msg)}
      />

      <div className="sk-main-content">
        <div className="mobile-menu-bar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper" style={{ minWidth: 0, width: '100%', overflowX: 'auto', margin: 0, padding: 0, zoom: 0.9 }}>
          <div className="top-bar-red" style={{ overflow: 'hidden', margin: 0 }}>
            <h1 style={{ margin: 0 }}>Manajemen Dokumen</h1>
          </div>

          <div className="content-container">
            <h2 className="page-title">{pageTitle}</h2>

            <section className="card-main">
              <div className="card-body" style={{ paddingBottom: 0 }}>
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
                    {FILTER_STATUS_TABS.map(({ key, label }) => (
                      <button
                        key={key}
                        className={`sk-status-tab ${filterStatus === key ? 'active' : ''}`}
                        onClick={() => setFilterStatus(key)}
                      >
                        {label}
                        <span className="sk-tab-count">({getStatusCount(key)})</span>
                      </button>
                    ))}

                    {/* Filter Prodi — sama dengan Permohonan SK TA */}
                    <div className="sk-prodi-dropdown" ref={prodiDropdownRef} style={{ marginLeft: 6 }}>
                      <button
                        type="button"
                        className={`sk-prodi-dropdown-trigger ${filterProdi ? 'active' : ''}`}
                        onClick={() => setProdiDropdownOpen((o) => !o)}
                      >
                        <span>{filterProdi || 'Semua Prodi'}</span>
                        <ChevronDown
                          size={14}
                          style={{
                            transform: prodiDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.15s',
                          }}
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
                              onClick={() => { setFilterProdi(''); setProdiDropdownOpen(false); }}
                            >
                              <span>Semua Prodi</span>
                              {!filterProdi && <Check size={14} />}
                            </div>
                            {prodiList.map((p) => (
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

                    {/* Filter Periode Yudisium  */}
                    <div className="sk-prodi-dropdown" ref={periodeDropdownRef} style={{ marginLeft: 6 }}>
                      <button
                        type="button"
                        className={`sk-prodi-dropdown-trigger ${filterPeriodeId ? 'active' : ''}`}
                        onClick={() => setPeriodeDropdownOpen((o) => !o)}
                        disabled={loadingPeriods}
                      >
                        {loadingPeriods ? (
                          <span>Loading periode...</span>
                        ) : (
                          <span>
                            {periodeList.find(p => p.id === filterPeriodeId)?.name || 'Semua Periode'}
                          </span>
                        )}
                        <ChevronDown
                          size={14}
                          style={{
                            transform: periodeDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.15s',
                            opacity: loadingPeriods ? 0.5 : 1
                          }}
                        />
                      </button>

                      <AnimatePresence>
                        {periodeDropdownOpen && !loadingPeriods && (
                          <motion.div
                            className="sk-prodi-dropdown-panel"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div
                              className={`sk-prodi-dropdown-option ${!filterPeriodeId ? 'selected' : ''}`}
                              onClick={() => handleSelectPeriode('')}
                            >
                              <span>Semua Periode</span>
                              {!filterPeriodeId && <Check size={14} />}
                            </div>
                            {periodeList.length === 0 ? (
                              <div className="sk-prodi-dropdown-option" style={{ opacity: 0.7, cursor: 'default' }}>
                                <span style={{ fontStyle: 'italic' }}>Belum ada periode yudisium</span>
                              </div>
                            ) : (
                              periodeList.map((p) => (
                                <div
                                  key={p.id}
                                  className={`sk-prodi-dropdown-option ${filterPeriodeId === p.id ? 'selected' : ''}`}
                                  onClick={() => handleSelectPeriode(p.id)}
                                >
                                  <span>{p.name}</span>
                                  {filterPeriodeId === p.id && <Check size={14} />}
                                </div>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Quick refresh button for periode */}
                    <button
                      className="btn-export-sk sm"
                      onClick={handleRefreshPeriods}
                      disabled={loadingPeriods}
                      title="Refresh periode yudisium"
                      style={{ 
                        padding: '5px 8px', 
                        fontSize: '10px',
                        opacity: loadingPeriods ? 0.6 : 1,
                        minWidth: 'auto',
                        marginLeft: 4
                      }}
                    >
                      <RefreshCw size={11} style={{ 
                        animation: loadingPeriods ? 'spin 1s linear infinite' : 'none' 
                      }} />
                    </button>
                  </div>


                </div>
              </div>

              <div className="sk-table-divider" />

              {/* Tabel mahasiswa */}
              <div className="sk-table-wrap">
                <table className="sk-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44, textAlign: 'center' }}>No</th>
                      <th>Mahasiswa</th>
                      <th>Program Studi</th>
                      <th>Periode Yudisium</th>
                      <th className="text-center">Status Berkas</th>
                      <th>Tanggal Upload</th>
                      <th className="text-center" style={{ width: 150 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStudents ? (
                      <tr>
                        <td colSpan={7} className="sk-empty-cell">
                          Memuat data…
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div className="sk-empty-state">
                            <div className="sk-empty-icon">
                              <FileText size={28} />
                            </div>
                            <p>
                              {search
                                ? 'Tidak ada hasil pencarian.'
                                : 'Belum ada mahasiswa dengan periode yudisium yang ditentukan.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((student, idx) => {
                        const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;

                        return (
                          <motion.tr
                            key={student.mahasiswaId ?? student.registrationId}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                          >
                            <td className="text-center" style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                              {rowNum}
                            </td>
                            <td>
                              <div className="sk-mhs-name">{student.name}</div>
                              <div className="sk-mhs-nim">{student.nim}</div>
                            </td>
                            <td>
                              <span className="sk-prodi-text">{student.prodi}</span>
                            </td>
                            <td>
                              <span className="sk-period-text">{student.periode}</span>
                            </td>
                            <td className="text-center">
                              {student.uploaded
                                ? <span className="sk-badge-uploaded">Sudah Upload</span>
                                : <span className="sk-badge-not-uploaded">Belum Upload</span>
                              }
                            </td>
                            <td>
                              <span className="sk-date-text">
                                {student.uploaded ? student.uploadDate || '-' : '-'}
                              </span>
                            </td>
                            <td className="text-center">
                              {student.uploaded ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <button
                                    className="btn-lihat-doc"
                                    onClick={() => openViewModal(student)}
                                  >
                                    <Eye size={12} /> Lihat
                                  </button>
                                  <button
                                    className="btn-edit-doc"
                                    onClick={() => openUploadModal(student, 'edit')}
                                    title={`Edit ${docType}`}
                                  >
                                    <Edit3 size={12} /> Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn-unggah-doc"
                                  onClick={() => openUploadModal(student, 'upload')}
                                  title={`Unggah ${docType}`}
                                >
                                  Unggah {docType}
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
                <div className="sk-table-footer">
                  <span className="sk-page-info">
                    Menampilkan{' '}
                    <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredList.length)}</strong>
                    –<strong>{Math.min(currentPage * PAGE_SIZE, filteredList.length)}</strong>
                    {' '}dari <strong>{filteredList.length}</strong> data
                  </span>
                  <div className="sk-pagination">
                    <button
                      className="btn-page"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`btn-page ${p === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
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

      {/* UPLOAD / EDIT MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
            onClick={() => !savingUpload && setIsUploadModalOpen(false)}
          >
            <motion.div
              style={{
                background: '#fff', borderRadius: 16,
                width: '100%', maxWidth: 560, maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color="#C0182A" />
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111827' }}>
                    {modalMode === 'edit' ? `Edit Berkas ${docType}` : `Unggah ${docType} Mahasiswa`}
                  </h3>
                </div>
                <button
                  onClick={() => !savingUpload && setIsUploadModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: '#FEF2F2',
                  border: '1px solid #FECACA', borderRadius: 8, marginBottom: 16,
                }}>
                  <User size={15} color="#C0182A" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>
                    {selectedStudent?.name} ({selectedStudent?.nim}) — {selectedStudent?.prodi}
                  </span>
                </div>

                {modalMode === 'edit' && selectedStudent?.fileName && (
                  <div style={{
                    marginBottom: 16, padding: '10px 14px',
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: 8, fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 700, color: '#334155', marginBottom: 2 }}>File yang aktif:</div>
                    <div style={{ color: '#64748B' }}>{selectedStudent.fileName}</div>
                  </div>
                )}

                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}>
                  Pilih Dokumen PDF <span style={{ color: '#C0182A' }}>*</span>
                </label>

                {file && (
                  <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                  }}>
                    <FileText size={28} color="#16A34A" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803D' }}>
                        {formatFileSize(file.size)} • Siap diunggah
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: '#DCFCE7', color: '#166534',
                      padding: '3px 8px', borderRadius: 9999, border: '1px solid #86EFAC',
                    }}>
                      Terpilih
                    </span>
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #CBD5E1', background: '#F8FAFC',
                    borderRadius: 10, padding: '28px 16px',
                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C0182A'; e.currentTarget.style.background = '#FFF5F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" style={{ display: 'none' }} />
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: '#fff',
                    border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 10px',
                  }}>
                    <Upload size={22} color="#C0182A" />
                  </div>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    <span style={{ color: '#C0182A' }}>Klik untuk memilih file</span> atau seret ke sini
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                    Maksimal ukuran: 4MB (Format PDF)
                  </p>
                </div>

                {uploadError && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertTriangle size={15} color="#DC2626" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C' }}>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 24px', borderTop: '1px solid #E2E8F0',
                background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end', gap: 10,
              }}>
                <button
                  onClick={() => !savingUpload && setIsUploadModalOpen(false)}
                  disabled={savingUpload}
                  className="dm-btn-batal"
                  style={{ fontFamily: 'inherit' }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveUpload}
                  disabled={savingUpload || !file}
                  className="dm-btn-simpan"
                  style={{
                    fontFamily: 'inherit',
                    opacity: savingUpload || !file ? 0.6 : 1,
                    cursor: savingUpload || !file ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingUpload ? 'Menyimpan…' : modalMode === 'edit' ? 'Simpan Perubahan' : 'Simpan & Terbitkan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/*  PDF PREVIEW MODAL */}
      <AnimatePresence>
        {previewState.isOpen && previewState.student && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
            onClick={closeViewModal}
          >
            <motion.div
              style={{
                background: '#fff', borderRadius: 16,
                width: '100%', maxWidth: 900, height: '88vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <FileText size={18} color="#C0182A" style={{ flexShrink: 0 }} />
                  <h3 style={{
                    margin: 0, fontSize: 14, fontWeight: 800, color: '#111827',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    Preview {docType} — {previewState.student.name} ({previewState.student.nim})
                  </h3>
                </div>
                <button onClick={closeViewModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4, flexShrink: 0 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Meta info */}
              <div style={{
                padding: '8px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 8, fontSize: 12, flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', color: '#475569' }}>
                  <span><strong>Berkas:</strong> {previewState.fileName}</span>
                  <span style={{ color: '#CBD5E1' }}>•</span>
                  <span><strong>Prodi:</strong> {previewState.student.prodi}</span>
                  <span style={{ color: '#CBD5E1' }}>•</span>
                  <span><strong>Periode:</strong> {previewState.student.periode}</span>
                </div>
              </div>

              {/* PDF iframe */}
              <div style={{ flex: 1, minHeight: 0, background: '#334155' }}>
                {previewState.blobUrl ? (
                  <iframe src={previewState.blobUrl} title="Preview PDF" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: 8 }}>
                    <FileText size={40} />
                    <p style={{ fontSize: 13 }}>Memuat dokumen…</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#FAFAFA',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Diunggah: <strong>{previewState.student.uploadDate || '-'}</strong>
                </span>
                <button
                  onClick={handleDownloadPreviewFile}
                  className="btn-unggah-doc"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} /> Unduh PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERT TOAST */}
      <AnimatePresence>
        {alert.show && (
          <div className="sk-doc-alert-overlay">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
              <CustomAlert
                type={alert.type}
                title={alert.title}
                message={alert.message}
                style={{ margin: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocUploadManager;
