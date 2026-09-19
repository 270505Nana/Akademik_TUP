import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu, HelpCircle, Bell, Search, Download,
  FileText, ChevronDown, ChevronLeft, ChevronRight,
  X, Clock, AlertCircle, Calendar, Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import api, { getStudyPrograms, getMahasiswaBimbingan } from '../../service/api';
import { generateDokumenValidasiBlob } from '../../components/admin/permohonanSK/Dokumenvalidasipdf';
import '../dashboard.css';
import '../../components/dosen/css/mahasiswaBimbingan.css';
// TODO: Filter status masih blm aktif tapi sementara karena backend belum menyediakan query param status. Uncomment kl di be udah ada
/*
const STATUS_CONFIG = {
  'SK Terbit': {
    label: 'SK Terbit',
    bg: '#DCFCE7',
    color: '#15803D',
    border: '#BBF7D0',
  },
  'SK Belum Terbit': {
    label: 'SK Belum Terbit',
    bg: '#FEE2E2',
    color: '#991B1B',
    border: '#FECACA',
  },
  'Dalam Proses': {
    label: 'Dalam Proses',
    bg: '#DBEAFE',
    color: '#1E40AF',
    border: '#BFDBFE',
  },
  'Mengirim Revisi': {
    label: 'Mengirim Revisi',
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#FDE68A',
  },
  'Kadaluarsa': {
    label: 'Kadaluarsa',
    bg: '#F3F4F6',
    color: '#4B5563',
    border: '#E5E7EB',
  },
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SK Terbit', label: 'SK Terbit' },
  { value: 'SK Belum Terbit', label: 'SK Belum Terbit' },
  { value: 'Dalam Proses', label: 'Dalam Proses' },
  { value: 'Mengirim Revisi', label: 'Mengirim Revisi' },
  { value: 'Kadaluarsa', label: 'Kadaluarsa' },
];
*/

// --- Helper inisial avatar mahasiswa ---
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// --- Sub-komponen: Modal Surat Keputusan Tugas Akhir (SK TA) ---
const SKTAModal = ({ student, onClose }) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState(null);

  const mhs = student?.mahasiswa || {};
  const studentName = mhs.name || 'Mahasiswa';
  const studentNim = mhs.nim || '-';
  const prodiName = mhs.studyProgram?.name || '-';
  const isTerbit = student?.status === 'SK Terbit';

  useEffect(() => {
    if (!student || !isTerbit) {
      setPdfBlobUrl(null);
      return;
    }

    let isMounted = true;
    setLoadingPdf(true);
    setErrorPdf(null);

    const loadPdfDoc = async () => {
      try {
        if (student.sktaDownloadUrl) {
          const response = await api.get(student.sktaDownloadUrl, {
            responseType: 'blob',
          });
          if (isMounted) {
            const url = URL.createObjectURL(response.data);
            setPdfBlobUrl(url);
          }
          return;
        }

        const payloadData = {
          nim: studentNim,
          namaMahasiswa: studentName,
          programStudi: prodiName,
          judulTAId: student.judulTugasAkhirIndonesia || '-',
          judulTAEn: student.judulTugasAkhirInggris || student.judulTugasAkhirIndonesia || '-',
          dosenPembimbing1: '-',
          dosenPembimbing2: '-',
          tanggalBerlakuSK: student.createdAt || new Date().toISOString(),
          tanggalBerakhirSK: null,
          statusAktif: 'AKTIF',
          logoUrl: logoTelkom,
        };

        const blob = await generateDokumenValidasiBlob(payloadData);
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error('Gagal memuat preview dokumen SK TA:', err);
        if (isMounted) setErrorPdf('Gagal memuat dokumen PDF SK TA.');
      } finally {
        if (isMounted) setLoadingPdf(false);
      }
    };

    loadPdfDoc();

    return () => {
      isMounted = false;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [student, isTerbit, studentName, studentNim, prodiName]);

  if (!student) return null;

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const cleanName = studentName.replace(/[/\\?%*:|"<>]/g, '').trim();
    const cleanNim = studentNim.replace(/[/\\?%*:|"<>]/g, '').trim();
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `SK TA_${cleanName}_${cleanNim}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mb-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className={`mb-modal-content ${isTerbit ? 'is-terbit' : ''}`}
      >
        <div className="mb-modal-header">
          <div className="mb-modal-header-left">
            <div className="mb-modal-icon-badge">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="mb-modal-title">Surat Keputusan Tugas Akhir</h3>
              <p className="mb-modal-sub">
                {studentName} &bull; NIM: {studentNim} &bull; {prodiName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="mb-modal-close-btn" title="Tutup Modal">
            <X size={18} />
          </button>
        </div>

        <div className="mb-modal-body-pdf">
          {isTerbit ? (
            loadingPdf ? (
              <div className="mb-pdf-loading-wrap">
                <Loader size={32} color="#FFFFFF" className="mb-spinner" />
                <span className="mb-pdf-loading-text">Memuat Dokumen SK TA...</span>
              </div>
            ) : errorPdf ? (
              <div className="mb-pdf-error-wrap">
                <AlertCircle size={36} color="#EF4444" className="mb-pdf-error-icon" />
                <span className="mb-pdf-error-text">{errorPdf}</span>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title={`SK TA - ${studentName}`}
                width="100%"
                height="100%"
                className="mb-pdf-iframe"
              />
            ) : null
          ) : (
            <div className="mb-pdf-unreleased-wrap">
              <div className="mb-pdf-unreleased-icon">
                <AlertCircle size={28} />
              </div>
              <h4 className="mb-pdf-unreleased-title">
                Dokumen SK TA belum tersedia
              </h4>
              <p className="mb-pdf-unreleased-desc">
                Mahasiswa <strong>{studentName}</strong> belum memiliki SK Tugas Akhir yang diterbitkan oleh bagian Akademik.
              </p>
            </div>
          )}
        </div>

        <div className="mb-modal-footer">
          <button type="button" onClick={onClose} className="btn-detail mb-modal-btn-close">
            Tutup
          </button>
          {isTerbit && pdfBlobUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="btn-verif mb-modal-btn-download"
            >
              <Download size={14} /> Unduh
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Sub-komponen: Modal Log Bimbingan Mahasiswa ---
const LogModal = ({ student, onClose }) => {
  if (!student) return null;

  const mhs = student.mahasiswa || {};
  const studentName = mhs.name || 'Mahasiswa';
  const studentNim = mhs.nim || '-';
  const prodiName = mhs.studyProgram?.name || '-';
  const thesisTitle = student.judulTugasAkhirIndonesia || student.judulTugasAkhirInggris || '-';
  const logs = Array.isArray(student.logs) ? student.logs : [];

  return (
    <div className="mb-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="mb-log-modal-content"
      >
        <div className="mb-log-header">
          <div>
            <div className="mb-log-header-top-row">
              <span className="mb-log-header-tag">Log Bimbingan Mahasiswa</span>
              <span className="mb-log-header-count">• Total {logs.length} Pertemuan</span>
            </div>
            <h3 className="mb-log-header-name">
              {studentName}
            </h3>
            <p className="mb-log-header-sub">
              NIM: {studentNim} &bull; {prodiName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mb-modal-close-btn"
            title="Tutup Modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-log-thesis-box">
          <span className="mb-log-thesis-label">
            Judul Tugas Akhir
          </span>
          <span className="mb-log-thesis-title">
            {thesisTitle}
          </span>
        </div>

        <div className="mb-log-body-scroll">
          {logs.length === 0 ? (
            <div className="mb-log-empty">
              <Clock size={36} color="#CBD5E1" className="mb-log-empty-icon" />
              <div className="mb-log-empty-title">Belum Ada Catatan Bimbingan</div>
              <div className="mb-log-empty-desc">Mahasiswa ini belum mengisi log bimbingan.</div>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="mb-log-card"
              >
                <div className="mb-log-card-top">
                  <div className="mb-log-session-row">
                    <span className="mb-log-session-badge">
                      {log.session || `Sesi ${idx + 1}`}
                    </span>
                    <span className="mb-log-date">
                      <Calendar size={13} color="#94A3B8" />
                      {log.date || '-'}
                    </span>
                  </div>
                  <span
                    className={`mb-log-status-badge ${log.status === 'Selesai' ? 'is-selesai' : 'is-progress'}`}
                  >
                    {log.status || 'Bimbingan'} {log.progress ? `(${log.progress})` : ''}
                  </span>
                </div>

                <div className="mb-log-topic-wrap">
                  <div className="mb-log-topic-label">
                    Aktivitas / Topik Bahasan
                  </div>
                  <div className="mb-log-topic-value">
                    {log.topic || '-'}
                  </div>
                </div>

                <div className="mb-log-notes-box">
                  <div className="mb-log-notes-label">
                    Catatan Pembimbing:
                  </div>
                  <div className="mb-log-notes-value">
                    {log.notes || 'Tidak ada catatan khusus.'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mb-log-footer">
          <button type="button" onClick={onClose} className="btn-detail mb-log-footer-btn">
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Komponen Utama: Mahasiswa Bimbingan ---
const MahasiswaBimbingan = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // TODO: Filter status masih blm aktif tapi sementara karena backend belum menyediakan query param status. Uncomment kl di be udah ada
  /*
  const [selectedStatus, setSelectedStatus] = useState('');
  */
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [students, setStudents] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState([]);
  const [prodiFetchError, setProdiFetchError] = useState(false);
  const [isLoadingProdi, setIsLoadingProdi] = useState(true);
  const [logModalStudent, setLogModalStudent] = useState(null);
  const [skModalStudent, setSkModalStudent] = useState(null);


  useEffect(() => {
    let isMounted = true;
    setIsLoadingProdi(true);
    setProdiFetchError(false);

    getStudyPrograms()
      .then((data) => {
        if (!isMounted) return;
        const prodiList = Array.isArray(data) ? data : data?.data || [];
        setStudyPrograms(prodiList);
        setProdiFetchError(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Gagal mengambil daftar program studi:', err);
        setStudyPrograms([]);
        setProdiFetchError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProdi(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // --- Handler debounce search query (~300ms) ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page ke 1 jika filter atau sorting berganti
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedProdi, sortBy]);

  // --- Fetch data Mahasiswa Bimbingan dari API backend ---
  const fetchMahasiswaBimbingan = useCallback(async () => {
    setIsLoadingStudents(true);
    setStudentsError(null);

    try {
      const response = await getMahasiswaBimbingan({
        search: debouncedSearch,
        studyProgramId: selectedProdi,
        sortBy,
        page: currentPage,
        limit,
      });

      const dataList = Array.isArray(response?.data) ? response.data : [];
      setStudents(dataList);

      if (response?.pagination) {
        setPaginationMeta(response.pagination);
      } else {
        setPaginationMeta({
          page: currentPage,
          limit,
          total: dataList.length,
          totalPages: Math.max(1, Math.ceil(dataList.length / limit)),
        });
      }
    } catch (err) {
      console.error('Gagal memuat data mahasiswa bimbingan:', err);
      setStudents([]);
      setStudentsError(
        err.response?.data?.message || 'Gagal memuat data mahasiswa bimbingan. Silakan coba lagi.'
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }, [debouncedSearch, selectedProdi, sortBy, currentPage, limit]);

  useEffect(() => {
    fetchMahasiswaBimbingan();
  }, [fetchMahasiswaBimbingan]);

  // --- Handler reset filter & export data CSV ---
  const handleResetFilter = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedProdi('');
    setSortBy('newest');
    setCurrentPage(1);
    /*
    // TODO: Filter status dinonaktifkan sementara karena backend belum menyediakan query param status (status dihitung dinamis di service, bukan kolom DB). Uncomment jika BE sudah mendukungnya.
    setSelectedStatus('');
    */
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await getMahasiswaBimbingan({
        search: debouncedSearch,
        studyProgramId: selectedProdi,
        sortBy,
        limit: 'all',
      });

      const allData = Array.isArray(response?.data) ? response.data : students;

      if (allData.length === 0) {
        alert('Tidak ada data mahasiswa bimbingan untuk diunduh.');
        return;
      }

      const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Program Studi', 'Judul Tugas Akhir', 'Status SK'];
      const rows = allData.map((item, idx) => {
        const mhs = item.mahasiswa || {};
        const title = (item.judulTugasAkhirIndonesia || item.judulTugasAkhirInggris || '-').replace(/"/g, '""');
        const name = (mhs.name || '-').replace(/"/g, '""');
        const prodi = (mhs.studyProgram?.name || '-').replace(/"/g, '""');
        return [
          idx + 1,
          `"${mhs.nim || '-'}"`,
          `"${name}"`,
          `"${prodi}"`,
          `"${title}"`,
          `"${item.status || 'SK Belum Terbit'}"`,
        ];
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);

      let dosenName = 'Dosen';
      try {
        const userObj = JSON.parse(localStorage.getItem('simta_user') || '{}');
        if (userObj.name) dosenName = userObj.name.replace(/[^a-zA-Z0-9]/g, '_');
      } catch {
        dosenName = 'Dosen';
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Mahasiswa_Bimbingan_${dosenName}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Gagal mengekspor data mahasiswa bimbingan:', err);
      alert('Gagal mengunduh data mahasiswa bimbingan. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  // --- Perhitungan range pagination ---
  const numericLimit = typeof limit === 'number' ? limit : parseInt(limit, 10) || 10;
  const startIndex = paginationMeta.total > 0 ? (paginationMeta.page - 1) * numericLimit + 1 : 0;
  const endIndex = Math.min(paginationMeta.page * numericLimit, paginationMeta.total);

  const getPageNumbers = () => {
    const totalPages = paginationMeta.totalPages;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Topbar Dosen */}
        <header className="topbar topbar-dosen">
          <button
            type="button"
            className="topbar-toggle topbar-toggle-dosen"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Mahasiswa Bimbingan</div>
        </header>

        <main className="page-body">
          {/* Header Konten & Tombol Aksi */}
          <div className="mb-page-header">
            <div className="mb-page-header-text">
              <h1 className="mb-page-title">
                Progres Mahasiswa Bimbingan
              </h1>
              <p className="mb-page-desc">
                Pantau pendaftaran tugas akhir mahasiswa bimbingan, status SK TA, dan kelengkapan berkas.
              </p>
            </div>

            <div className="mb-page-header-actions">
              {/* Tombol Filter dihapus dari UI — reset filter tetap bisa dipanggil via handleResetFilter jika dibutuhkan secara programatik */}

              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="mb-btn-export"
              >
                <Download size={15} />
                {isExporting ? 'Mengunduh...' : 'Unduh Data'}
              </button>
            </div>
          </div>

          {/* Render: Filter & Pencarian */}
          <div className="mb-filter-container">
            {/* Search Input (Debounced) */}
            <div className="mb-filter-search-wrap">
              <Search size={16} className="mb-filter-search-icon" />
              <input
                type="text"
                placeholder="Cari nama atau NIM mahasiswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-filter-search-input"
              />
            </div>

            {/* Select Program Studi */}
            <div className="mb-filter-select-wrap">
              <select
                value={selectedProdi}
                onChange={(e) => setSelectedProdi(e.target.value)}
                disabled={isLoadingProdi || prodiFetchError}
                className={`mb-filter-select ${prodiFetchError ? 'has-error' : ''}`}
              >
                {isLoadingProdi ? (<option value="">Prodi </option>) :
                 prodiFetchError ? (<option value="">Gagal memuat program studi</option>) : 
                 (
                  <>
                    <option value="">Semua Prodi</option>
                    {studyPrograms.map((prodi) => (
                      <option key={prodi.id} value={prodi.id}>
                        {prodi.name}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {prodiFetchError && (
                <span className="mb-filter-error-text">
                  Gagal memuat data program studi. Silakan muat ulang halaman.
                </span>
              )}
            </div>

            {/*
            // TODO: Filter status masih blm aktif tapi sementara karena backend belum menyediakan query param status. Uncomment kl di be udah ada
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="mb-filter-select"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            */}
          </div>

          {/* Render: Tabel Mahasiswa Bimbingan */}
          <div className="mb-table-card">
            <div className="mb-table-wrap">
              <table className="mb-table">
                <thead>
                  <tr>
                    <th className="mb-table-th col-num">NO</th>
                    <th className="mb-table-th">STUDENT &amp; THESIS</th>
                    <th className="mb-table-th col-prodi">PRODI</th>
                    <th className="mb-table-th col-status">STATUS</th>
                    <th className="mb-table-th col-actions">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingStudents ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="mb-loading-state">
                          <Loader size={20} className="mb-spinner" />
                          <span>Memuat data mahasiswa bimbingan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : studentsError ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="mb-empty-state">
                          <AlertCircle size={20} color="#EF4444" className="mb-empty-icon" />
                          <div className="mb-empty-title mb-empty-title-error">
                            Gagal Memuat Data
                          </div>
                          <div className="mb-empty-desc mb-empty-desc-error">
                            {typeof studentsError === 'string' ? studentsError : 'Terjadi kesalahan saat memuat data mahasiswa bimbingan.'}
                          </div>
                          <button
                            type="button"
                            onClick={fetchMahasiswaBimbingan}
                            className="mb-btn-action mb-btn-retry"
                          >
                            Coba Lagi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="mb-empty-state">
                          <div className="mb-empty-title">
                            Tidak ada mahasiswa bimbingan ditemukan
                          </div>
                          <div className="mb-empty-desc">
                            Coba sesuaikan kata kunci pencarian atau filter yang Anda gunakan.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((item, idx) => {
                      const mhs = item.mahasiswa || {};
                      const studentName = mhs.name || 'Mahasiswa';
                      const studentNim = mhs.nim || '-';
                      const prodiName = mhs.studyProgram?.name || '-';
                      const thesisTitle = item.judulTugasAkhirIndonesia || item.judulTugasAkhirInggris || '-';
                      const statusKey = item.status || 'SK Belum Terbit';
                      const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['SK Belum Terbit'];
                      const rowNum = (currentPage - 1) * numericLimit + idx + 1;

                      return (
                        <tr
                          key={item.id || idx}
                          className={`mb-table-tr ${idx < students.length - 1 ? 'has-border' : ''}`}
                        >
                          <td className="mb-table-td col-num">{rowNum}</td>
                          <td className="mb-table-td">
                            <div className="mb-student-flex">
                              <div className="mb-avatar-initials">
                                {getInitials(studentName)}
                              </div>
                              <div className="mb-student-info">
                                <div className="mb-student-name">{studentName}</div>
                                <div className="mb-student-nim">{studentNim}</div>
                                <div className="mb-thesis-label">THESIS TITLE</div>
                                <div className="mb-thesis-title">{thesisTitle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="mb-table-td">
                            <span className="mb-prodi-text">{prodiName}</span>
                          </td>
                          <td className="mb-table-td mb-table-td-center">
                            <span
                              className="mb-status-badge"
                              style={{
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                border: `1.5px solid ${statusCfg.border}`,
                              }}
                            >
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="mb-table-td mb-table-td-center">
                            <div className="mb-actions-flex">
                              <button
                                type="button"
                                onClick={() => setSkModalStudent(item)}
                                className="mb-btn-action"
                              >
                                Lihat SK TA
                              </button>
                              <button
                                type="button"
                                onClick={() => setLogModalStudent(item)}
                                className="mb-btn-action"
                              >
                                <span>Lihat Log</span>
                                <ChevronDown size={14} />
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

            {/* Render: Server-Side Pagination Controls */}
            {!isLoadingStudents && !studentsError && students.length > 0 && (
              <div className="mb-pagination-container">
                <div className="mb-pagination-info">
                  Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of{' '}
                  <strong>{paginationMeta.total}</strong> entries
                </div>

                <div className="mb-pagination-right">
                  <div className="mb-pagination-limit-wrap">
                    <span>Baris per halaman:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="mb-pagination-limit-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="mb-pagination-controls">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="mb-page-btn nav-btn"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {getPageNumbers().map((item, idx) => {
                      if (item === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="mb-page-ellipsis">
                            ...
                          </span>
                        );
                      }
                      const pageNum = Number(item);
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`mb-page-btn num-btn ${isActive ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage >= paginationMeta.totalPages || paginationMeta.total === 0}
                      onClick={() => setCurrentPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                      className="mb-page-btn nav-btn"
                      title="Halaman Berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <FooterDosen />
      </div>

      <AnimatePresence>
        {logModalStudent && (
          <LogModal
            student={logModalStudent}
            onClose={() => setLogModalStudent(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {skModalStudent && (
          <SKTAModal
            student={skModalStudent}
            onClose={() => setSkModalStudent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MahasiswaBimbingan;