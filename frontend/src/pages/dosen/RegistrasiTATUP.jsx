import React, { useState, useMemo, useEffect } from 'react';
import {
  Menu, HelpCircle, Bell, Search, Filter, Download, BarChart3,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import VerticalBarChart from '../../components/dosen/registrasi_TATUP/VerticalBarChart';
import useRegistrasiTA from '../../components/dosen/registrasi_TATUP/useRegistrasiTA';
import {
  getStatusStyle,
  buildFacultyChartData,
  buildPageNumbers,
  buildStatusOptions,
  exportToCsv,
} from '../../components/dosen/registrasi_TATUP/registrasiTAHelpers';
import '../../components/dosen/registrasi_TATUP/registrasiTATUP.css';
import '../dashboard.css';

// Jumlah baris per halaman pada tabel
const PAGE_SIZE = 20;

const SkeletonRow = () => (
  <tr className="rta-skeleton-row">
    <td className="rta-skeleton-cell" style={{ textAlign: 'center' }}>
      <div className="rta-skeleton-block" style={{ width: 24, margin: '0 auto' }} />
    </td>
    <td className="rta-skeleton-cell">
      <div className="rta-skeleton-block" style={{ width: '80%', marginBottom: 6 }} />
      <div className="rta-skeleton-block" style={{ width: '50%', height: 10 }} />
    </td>
    <td className="rta-skeleton-cell">
      <div className="rta-skeleton-block" style={{ width: '70%', marginBottom: 6 }} />
      <div className="rta-skeleton-block" style={{ width: '60%', height: 10 }} />
    </td>
    <td className="rta-skeleton-cell" style={{ textAlign: 'center' }}>
      <div className="rta-skeleton-block" style={{ width: 90, height: 22, borderRadius: 9999, margin: '0 auto' }} />
    </td>
    <td className="rta-skeleton-cell" style={{ textAlign: 'center' }}>
      <div className="rta-skeleton-block" style={{ width: 50, margin: '0 auto' }} />
    </td>
  </tr>
);
const RegistrasiTATUP = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    registrations,
    faculties,
    studyPrograms,
    isLoadingData,
    isLoadingProdi,
    errorData,
    errorProdi,
    refetchRegistrations,
  } = useRegistrasiTA();

  // Data diagram per fakultas (memakai SELURUH data, bukan hasil filter)
  const chartData = useMemo(
    () => buildFacultyChartData(registrations, faculties),
    [registrations, faculties],
  );

  const statusOptions = useMemo(
    () => buildStatusOptions(registrations),
    [registrations],
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return registrations.filter((student) => {
      const matchSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.nim.toLowerCase().includes(q);

      const matchProdi =
        !selectedProdi || String(student.studyProgramId) === String(selectedProdi);

      const matchStatus = !selectedStatus || student.status === selectedStatus;

      return matchSearch && matchProdi && matchStatus;
    });
  }, [registrations, searchQuery, selectedProdi, selectedStatus]);

  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleProdiChange = (e) => {
    setSelectedProdi(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSelectedProdi('');
    setSelectedStatus('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleExportData = () => exportToCsv(filteredStudents);

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Top bar role dosen */}
        <header className="topbar topbar-dosen">
          <button
            className="topbar-toggle topbar-toggle-dosen"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Registrasi Tugas Akhir TUP</div>
          <div className="topbar-right">
          </div>
        </header>

        <main className="page-body">
          {/* ---- Header Konten ---- */}
          <div className="rta-page-header">
            <div>
              <h1 className="rta-page-title">Rekapitulasi Registrasi Sidang Kampus</h1>
              <p className="rta-page-subtitle">
                Data pendaftaran sidang mahasiswa di Telkom University.
              </p>
            </div>

            <div className="rta-header-actions">
              <button
                className="rta-btn-reset btn-detail"
                onClick={handleResetFilter}
                title="Reset semua filter pencarian"
                aria-label="Reset Filter"
              >
                <Filter size={14} />
                Reset Filter
              </button>

              <button
                className="rta-btn-export"
                onClick={handleExportData}
                disabled={isLoadingData || filteredStudents.length === 0}
                title="Unduh data yang sedang ditampilkan ke format CSV"
                aria-label="Unduh Data CSV"
              >
                <Download size={15} />
                Unduh Data
              </button>
            </div>
          </div>

          {/* ---- Card Diagram Batang per Fakultas ---- */}
          <div className="rta-card">
            <div className="rta-chart-header">
              <div className="rta-chart-title-group">
                <div className="rta-chart-icon">
                  <BarChart3 size={20} />
                </div>
                <h3 className="rta-chart-title">Distribusi Registrasi Sidang Per Fakultas</h3>
              </div>
              <span className="rta-chart-total">
                Total: {isLoadingData ? '...' : registrations.length} Registrasi
              </span>
            </div>

            {isLoadingData ? (
              <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                Memuat data diagram...
              </div>
            ) : chartData.length === 0 ? (
              <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>
                Tidak ada data diagram tersedia.
              </div>
            ) : (
              <VerticalBarChart dataList={chartData} />
            )}
          </div>

          {/* ---- Toolbar Search & Filter ---- */}
          <div className="rta-toolbar">
            <div className="rta-search-wrap">
              <Search size={16} color="#9CA3AF" className="rta-search-icon" />
              <input
                id="rta-search-input"
                type="text"
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="rta-search-input"
                aria-label="Cari mahasiswa berdasarkan nama atau NIM"
              />
            </div>

            {/* Dropdown Program Studi (dari API) */}
            <div className="rta-select-wrap">
              <select
                id="rta-prodi-select"
                value={selectedProdi}
                onChange={handleProdiChange}
                disabled={isLoadingProdi || !!errorProdi}
                className={`rta-select${errorProdi ? ' rta-select-error' : isLoadingProdi ? ' rta-select-loading' : ''}`}
                aria-label="Filter berdasarkan program studi"
              >
                {isLoadingProdi ? (
                  <option value="">Memuat program studi...</option>
                ) : errorProdi ? (
                  <option value="">Gagal memuat program studi</option>
                ) : (
                  <>
                    <option value="">All Majors</option>
                    {studyPrograms.map((prodi) => (
                      <option key={prodi.id} value={prodi.id}>
                        {prodi.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errorProdi && <span className="rta-error-hint">{errorProdi}</span>}
            </div>

            {/* Dropdown Status (dinamis dari data) */}
            <div className="rta-select-wrap rta-select-wrap-sm">
              <select
                id="rta-status-select"
                value={selectedStatus}
                onChange={handleStatusChange}
                className="rta-select"
                aria-label="Filter berdasarkan status registrasi"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ---- Tabel Registrasi ---- */}
          <div className="rta-table-wrap">
            <div className="table-scroll-wrap" style={{ maxHeight: 'none' }}>
              <table className="rta-table">
                <thead>
                  <tr>
                    <th className="col-no">NO</th>
                    <th className="col-nama">NAMA &amp; NIM</th>
                    <th className="col-fakultas">FAKULTAS &amp; PRODI</th>
                    <th className="col-status">STATUS</th>
                    <th className="col-angkatan">ANGKATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingData ? (
                    Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
                  ) : errorData ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="rta-error-state">
                          <div className="rta-error-title">Gagal memuat data</div>
                          <div className="rta-error-desc">{errorData}</div>
                          <button className="rta-btn-retry" onClick={refetchRegistrations}>
                            Coba Lagi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="rta-empty-state">
                          <div className="rta-empty-title">
                            Tidak ada data registrasi sidang ditemukan
                          </div>
                          <div className="rta-empty-desc">
                            Coba sesuaikan kata kunci pencarian atau filter yang digunakan.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const statusCfg = getStatusStyle(student.status);

                      return (
                        <tr key={student.id}>
                          <td className="cell-no">{startIndex + idx + 1}</td>

                          <td className="cell-nama">
                            <div className="rta-nama-text">{student.name}</div>
                            <div className="rta-nim-text">{student.nim}</div>
                          </td>

                          <td className="cell-fakultas">
                            <div className="rta-faculty-text">
                              {student.facultyCode
                                ? `${student.facultyCode} — ${student.facultyName}`
                                : student.facultyName || '-'}
                            </div>
                            <div className="rta-prodi-text">{student.studyProgram}</div>
                          </td>

                          <td className="cell-status">
                            <span
                              className="rta-badge"
                              style={{
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                border: `1.5px solid ${statusCfg.border}`,
                              }}
                            >
                              {statusCfg.label}
                            </span>
                          </td>

                          <td className="cell-angkatan">{student.angkatan}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ---- Pagination Footer ---- */}
            {!isLoadingData && !errorData && (
              <div className="rta-pagination">
                <div className="rta-pagination-info">
                  Menampilkan {totalEntries > 0 ? startIndex + 1 : 0} -{' '}
                  {endIndex} dari {totalEntries} data
                </div>

                <div className="rta-pagination-controls">
                  <button
                    className="rta-page-btn"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    title="Halaman Sebelumnya"
                    aria-label="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {buildPageNumbers(safePage, totalPages).map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="rta-page-ellipsis">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        className={`rta-page-btn${item === safePage ? ' active' : ''}`}
                        onClick={() => setCurrentPage(item)}
                        aria-label={`Halaman ${item}`}
                        aria-current={item === safePage ? 'page' : undefined}
                      >
                        {item}
                      </button>
                    ),
                  )}

                  <button
                    className="rta-page-btn"
                    disabled={safePage === totalPages || totalEntries === 0}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    title="Halaman Berikutnya"
                    aria-label="Halaman Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <FooterDosen />
      </div>
    </>
  );
};

export default RegistrasiTATUP;