import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu, Search, Download,
  FileText, ChevronLeft, ChevronRight,
  X, AlertCircle, Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import SKTAModal from '../../components/dosen/mahasiswabimbingan/SKTAModal';
import { STATUS_CONFIG } from '../../components/dosen/mahasiswabimbingan/StatusConfig';
import FooterDosen from '../../components/common/FooterDosen';
import api, { getStudyPrograms, getMahasiswaBimbingan } from '../../service/api';
import { generateDokumenValidasiBlob } from '../../components/admin/permohonanSK/Dokumenvalidasipdf';
import '../dashboard.css';
import Telulogo from '../../assets/logo-telkom.png';
import '../../components/dosen/mahasiswabimbingan/mahasiswabimbingan.css';

// Tentukan nilai "belum mulai" per tahap, dipakai untuk mencari tahap paling jauh progresnya
const STEP_DEFINITIONS = [
  { label: 'SKTA', field: 'statusSk', emptyValue: 'SK Belum Terbit' },
  { label: 'Sidang', field: 'statusRegistrasi', emptyValue: 'Menunggu Pendaftaran' },
  { label: 'Yudisium', field: 'statusYudisium', emptyValue: 'Belum Daftar' },
];

// Cari status terkini: tahap paling jauh (terakhir) yang sudah ada progres.
// Kalau semua tahap masih di titik awal, tampilkan status tahap pertama (SKTA).
const getCurrentStatus = (item) => {
  for (let i = STEP_DEFINITIONS.length - 1; i >= 0; i--) {
    const step = STEP_DEFINITIONS[i];
    const value = item[step.field];
    if (value && value !== step.emptyValue) {
      return { label: step.label, value };
    }
  }
  const firstStep = STEP_DEFINITIONS[0];
  return { label: firstStep.label, value: item[firstStep.field] || firstStep.emptyValue };
};

// --- Helper inisial avatar mahasiswa ---
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
          </div>

          {/* Render: Tabel Mahasiswa Bimbingan */}
          <div className="mb-table-card">
            <div className="mb-table-wrap">
              <table className="mb-table">
                <thead>
                  <tr>
                    <th className="mb-table-th col-num">NO</th>
                    <th className="mb-table-th col-student">MAHASISWA</th>
                    <th className="mb-table-th col-thesis">JUDUL TUGAS AKHIR</th>
                    <th className="mb-table-th col-prodi">PRODI</th>
                    <th className="mb-table-th col-status">STATUS</th>
                    <th className="mb-table-th col-actions">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingStudents ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="mb-loading-state">
                          <Loader size={20} className="mb-spinner" />
                          <span className="mb-loading-text">Memuat data mahasiswa bimbingan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : studentsError ? (
                    <tr>
                      <td colSpan={6}>
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
                      <td colSpan={6}>
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
                      const rowNum = (currentPage - 1) * numericLimit + idx + 1;

                      // Status terkini: tahap paling jauh progresnya, dihitung dari 3 field yang BE kirim
                      const currentStatus = getCurrentStatus(item);
                      const currentStatusCfg = STATUS_CONFIG[currentStatus.value] || STATUS_CONFIG['SK Belum Terbit'];

                      return (
                        <tr
                          key={item.id || idx}
                          className={`mb-table-tr ${idx < students.length - 1 ? 'has-border' : ''}`}
                        >
                          <td className="mb-table-td col-num">{rowNum}</td>
                          {/* Kolom Mahasiswa: avatar + nama + NIM */}
                          <td className="mb-table-td col-student">
                            <div className="mb-student-flex">
                              <div className="mb-avatar-initials">
                                {getInitials(studentName)}
                              </div>
                              <div className="mb-student-info">
                                <div className="mb-student-name">{studentName}</div>
                                <div className="mb-student-nim">{studentNim}</div>
                              </div>
                            </div>
                          </td>
                          {/* Kolom Judul Tugas Akhir */}
                          <td className="mb-table-td col-thesis">
                            <span className="mb-thesis-title">{thesisTitle}</span>
                          </td>
                          <td className="mb-table-td">
                            <span className="mb-prodi-text">{prodiName}</span>
                          </td>
                          {/* Kolom Status: hanya tampilkan status terkini (tahap paling jauh progresnya) */}
                          <td className="mb-table-td mb-table-td-center">
                            <div className="mb-status-current">
                              <span className="mb-status-current-label">{currentStatus.label}</span>
                              <span
                                className="mb-status-badge"
                                style={{
                                  background: currentStatusCfg.bg,
                                  color: currentStatusCfg.color,
                                  border: `1.5px solid ${currentStatusCfg.border}`,
                                }}
                              >
                                {currentStatusCfg.label}
                              </span>
                            </div>
                          </td>
                          <td className="mb-table-td mb-table-td-center">
                            <div className="mb-actions-flex">
                              <button
                                type="button"
                                onClick={() => setSkModalStudent(item)}
                                className="mb-btn-action mb-btn-skta"
                              >
                                Lihat SK TA
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

            {/* Render: Pagination Controls — selalu ditampilkan (mengikuti pola PenjadwalanSidang), termasuk saat loading/error/kosong */}
            <div className="mb-pagination-container">
              <div className="mb-pagination-info">
                Menampilkan {startIndex} - {endIndex} dari {' '}{paginationMeta.total} data
              </div>

              <div className="mb-pagination-right">
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
          </div>
        </main>

        <FooterDosen />
      </div>

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