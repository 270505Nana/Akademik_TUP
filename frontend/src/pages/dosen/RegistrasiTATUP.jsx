import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu, HelpCircle, Bell, Search, Filter, Download,
  BarChart3, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import { getFaculties, getStudyPrograms } from '../../service/api';
import '../dashboard.css';

// Konfigurasi status registrasi TA pada sistem SIMTA
const STATUS_CONFIG = {
  'Daftar Sidang': {
    label: 'Daftar Sidang',
    bg: '#FEE2E2',
    color: '#991B1B',
    border: '#FECACA',
  },
  'Yudisium Tahap 1': {
    label: 'Yudisium Tahap 1',
    bg: '#F3F4F6',
    color: '#374151',
    border: '#E5E7EB',
  },
  'SK Terbit': {
    label: 'SK Terbit',
    bg: '#DCFCE7',
    color: '#15803D',
    border: '#BBF7D0',
  },
  'SK Belum Terbit': {
    label: 'SK Belum Terbit',
    bg: '#FEF2F2',
    color: '#B91C1C',
    border: '#FCA5A5',
  },
  'Dalam Proses': {
    label: 'Dalam Proses',
    bg: '#DBEAFE',
    color: '#1E40AF',
    border: '#BFDBFE',
  },
  'Siap Sidang': {
    label: 'Siap Sidang',
    bg: '#EDE9FE',
    color: '#5B21B6',
    border: '#DDD6FE',
  },
};

// Data registrasi Tugas Akhir mahasiswa kampus
const MOCK_REGISTRASI_TA = [
  {
    id: 1,
    name: 'Budi Waluyo',
    nim: '1301204001',
    facultyCode: 'FRI',
    facultyName: 'Fakultas Rekayasa Industri (FRI)',
    studyProgram: 'S1 Teknik Industri',
    studyProgramId: 7,
    status: 'Daftar Sidang',
    angkatan: '2020',
  },
  {
    id: 2,
    name: 'Siti Nurhaliza',
    nim: '1301204055',
    facultyCode: 'FTE',
    facultyName: 'Fakultas Teknik Elektro (FTE)',
    studyProgram: 'S1 Teknik Elektro',
    studyProgramId: 5,
    status: 'Yudisium Tahap 1',
    angkatan: '2020',
  },
  {
    id: 3,
    name: 'Andi Pratama',
    nim: '1301204112',
    facultyCode: 'FIK',
    facultyName: 'Fakultas Industri Kreatif (FIK)',
    studyProgram: 'S1 Desain Komunikasi Visual (DKV)',
    studyProgramId: 11,
    status: 'SK Terbit',
    angkatan: '2021',
  },
  {
    id: 4,
    name: 'Ahmad Fauzi',
    nim: '1301204010',
    facultyCode: 'FIF',
    facultyName: 'Fakultas Informatika (FIF)',
    studyProgram: 'S1 Informatika',
    studyProgramId: 1,
    status: 'SK Terbit',
    angkatan: '2020',
  },
  {
    id: 5,
    name: 'Dwi Lestari',
    nim: '1301204012',
    facultyCode: 'FIF',
    facultyName: 'Fakultas Informatika (FIF)',
    studyProgram: 'S1 Rekayasa Perangkat Lunak (Software Engineering)',
    studyProgramId: 2,
    status: 'SK Terbit',
    angkatan: '2020',
  },
  {
    id: 6,
    name: 'Nina Kirana',
    nim: '1301204256',
    facultyCode: 'FIF',
    facultyName: 'Fakultas Informatika (FIF)',
    studyProgram: 'S1 Sains Data (Data Science)',
    studyProgramId: 3,
    status: 'SK Belum Terbit',
    angkatan: '2020',
  },
  {
    id: 7,
    name: 'Rizky Ananda',
    nim: '1301204100',
    facultyCode: 'FTE',
    facultyName: 'Fakultas Teknik Elektro (FTE)',
    studyProgram: 'S1 Teknik Telekomunikasi',
    studyProgramId: 4,
    status: 'Dalam Proses',
    angkatan: '2021',
  },
  {
    id: 8,
    name: 'Mega Utami',
    nim: '1301204189',
    facultyCode: 'FKB',
    facultyName: 'Fakultas Ekonomi dan Bisnis (FEB)',
    studyProgram: 'S1 Bisnis Digital',
    studyProgramId: 13,
    status: 'Daftar Sidang',
    angkatan: '2020',
  },
  {
    id: 9,
    name: 'Dimas Setiawan',
    nim: '1301204201',
    facultyCode: 'FIT',
    facultyName: 'Fakultas Ilmu Terapan (FIT)',
    studyProgram: 'D3 Teknologi Telekomunikasi',
    studyProgramId: 14,
    status: 'Siap Sidang',
    angkatan: '2021',
  },
  {
    id: 10,
    name: 'Rina Kusuma',
    nim: '1301204220',
    facultyCode: 'FRI',
    facultyName: 'Fakultas Rekayasa Industri (FRI)',
    studyProgram: 'S1 Sistem Informasi',
    studyProgramId: 8,
    status: 'SK Terbit',
    angkatan: '2020',
  },
  {
    id: 11,
    name: 'Bayu Nugroho',
    nim: '1301204235',
    facultyCode: 'FIK',
    facultyName: 'Fakultas Industri Kreatif (FIK)',
    studyProgram: 'S1 Desain Produk',
    studyProgramId: 12,
    status: 'Dalam Proses',
    angkatan: '2021',
  },
  {
    id: 12,
    name: 'Lestari Handayani',
    nim: '1301204248',
    facultyCode: 'FRI',
    facultyName: 'Fakultas Rekayasa Industri (FRI)',
    studyProgram: 'S1 Teknik Logistik',
    studyProgramId: 9,
    status: 'Yudisium Tahap 1',
    angkatan: '2020',
  },
];

// Helper untuk format nama singkatan fakultas pada sumbu diagram
const formatFacultyLabel = (facultyName) => {
  if (!facultyName) return '';
  if (facultyName.includes('Informatika')) return 'FIF (Informatika)';
  if (facultyName.includes('Teknik Elektro')) return 'FTE (Elektro)';
  if (facultyName.includes('Rekayasa Industri')) return 'FRI (Rek. Industri)';
  if (facultyName.includes('Ekonomi') || facultyName.includes('Bisnis') || facultyName.includes('Kom. Bisnis')) return 'FKB (Kom. Bisnis)';
  if (facultyName.includes('Ilmu Terapan')) return 'FIT (Ilmu Terapan)';
  if (facultyName.includes('Industri Kreatif')) return 'FIK (Ind. Kreatif)';
  return facultyName;
};

// Component diagram batang vertikal (Vertical Bar Chart)
// Menampilkan distribusi registrasi TA per fakultas secara dinamis
const VerticalBarChart = ({ dataList }) => {
  const maxVal = useMemo(() => {
    if (!dataList || dataList.length === 0) return 4;
    const max = Math.max(...dataList.map(d => d.count), 0);
    return Math.max(max + 1, 4);
  }, [dataList]);

  // Tick marks pada sumbu Y (dari maxVal ke 0)
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = maxVal; i >= 0; i--) {
      ticks.push(i);
    }
    return ticks;
  }, [maxVal]);

  return (
    <div style={{ width: '100%', position: 'relative', paddingTop: 10 }}>
      <div style={{ display: 'flex', height: 230, position: 'relative' }}>
        {/* Sumbu Y (Angka & Label) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 14,
            paddingBottom: 24,
            color: '#9CA3AF',
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'right',
            minWidth: 24,
            userSelect: 'none',
          }}
        >
          {yTicks.map(val => (
            <span key={val} style={{ lineHeight: 1 }}>{val}</span>
          ))}
        </div>

        {/* Grid Lines & Area Batang Chart */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* Garis Horizontal Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              bottom: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pointerEvents: 'none',
            }}
          >
            {yTicks.map(val => (
              <div
                key={val}
                style={{
                  width: '100%',
                  height: 1,
                  background: val === 0 ? '#E2E8F0' : '#F1F5F9',
                }}
              />
            ))}
          </div>

          {/* Kolom Batang Diagram */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              paddingBottom: 24,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {dataList.map((item, idx) => {
              const heightPercent = maxVal > 0 ? (item.count / maxVal) * 100 : 0;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    flex: 1,
                    maxWidth: 70,
                    margin: '0 8px',
                  }}
                >
                  {/* Angka di atas batang */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: item.count > 0 ? '#991B1B' : '#94A3B8',
                      marginBottom: 6,
                      transition: 'color 0.2s',
                    }}
                  >
                    {item.count}
                  </span>

                  {/* Batang Vertikal */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, 2)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.08 }}
                    style={{
                      width: '100%',
                      background: item.count > 0
                        ? 'linear-gradient(180deg, #4338CA 0%, #4F46E5 100%)'
                        : '#E2E8F0',
                      borderRadius: '6px 6px 0 0',
                      boxShadow: item.count > 0 ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                      minHeight: 4,
                      cursor: 'pointer',
                    }}
                    whileHover={{ scaleY: 1.03, filter: 'brightness(1.1)' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Sumbu X (Label Nama Fakultas/Prodi) */}
          <div
            style={{
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              borderTop: '1px solid #E2E8F0',
              paddingTop: 8,
            }}
          >
            {dataList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  maxWidth: 90,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: '0 4px',
                }}
                title={item.label}
              >
                {item.shortLabel}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Halaman utama Registrasi Tugas Akhir TUP untuk Role Dosen
const RegistrasiTATUP = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [faculties, setFaculties] = useState([]);
  const [studyPrograms, setStudyPrograms] = useState([]);

  const PAGE_SIZE = 10;

  // Mengambil data Fakultas dan Program Studi dari API Backend
  useEffect(() => {
    Promise.all([
      getFaculties().catch(() => []),
      getStudyPrograms().catch(() => []),
    ]).then(([facList, prodiList]) => {
      if (Array.isArray(facList) && facList.length > 0) {
        setFaculties(facList);
      }
      if (Array.isArray(prodiList) && prodiList.length > 0) {
        setStudyPrograms(prodiList);
      }
    });
  }, []);

  // Filter status registrasi TA yang tersedia
  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'Daftar Sidang', label: 'Daftar Sidang' },
    { value: 'Yudisium Tahap 1', label: 'Yudisium Tahap 1' },
    { value: 'SK Terbit', label: 'SK Terbit' },
    { value: 'SK Belum Terbit', label: 'SK Belum Terbit' },
    { value: 'Dalam Proses', label: 'Dalam Proses' },
    { value: 'Siap Sidang', label: 'Siap Sidang' },
  ];

  // Menghitung data distribusi registrasi TA per fakultas secara dinamis
  const chartData = useMemo(() => {
    // Kategori fakultas yang ada
    const defaultFaculties = [
      { name: 'Fakultas Informatika (FIF)', short: 'FIF (Informatika)' },
      { name: 'Fakultas Teknik Elektro (FTE)', short: 'FTE (Elektro)' },
      { name: 'Fakultas Rekayasa Industri (FRI)', short: 'FRI (Rek. Industri)' },
      { name: 'Fakultas Ekonomi dan Bisnis (FEB)', short: 'FKB (Kom. Bisnis)' },
      { name: 'Fakultas Ilmu Terapan (FIT)', short: 'FIT (Ilmu Terapan)' },
    ];

    const sourceFaculties = faculties.length > 0
      ? faculties.map(f => ({ name: f.name, short: formatFacultyLabel(f.name) }))
      : defaultFaculties;

    return sourceFaculties.map(fac => {
      const count = MOCK_REGISTRASI_TA.filter(m => {
        return m.facultyName.toLowerCase().includes(fac.name.toLowerCase()) ||
               fac.name.toLowerCase().includes(m.facultyCode.toLowerCase());
      }).length;

      return {
        label: fac.name,
        shortLabel: fac.short,
        count,
      };
    });
  }, [faculties]);

  // Mengatur filter data registrasi berdasarkan pencarian, program studi, dan status
  const filteredStudents = useMemo(() => {
    return MOCK_REGISTRASI_TA.filter(student => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.nim.toLowerCase().includes(q);

      const matchProdi =
        !selectedProdi ||
        String(student.studyProgramId) === String(selectedProdi) ||
        student.studyProgram.toLowerCase() === String(selectedProdi).toLowerCase();

      const matchStatus = !selectedStatus || student.status === selectedStatus;
      return matchSearch && matchProdi && matchStatus;
    });
  }, [searchQuery, selectedProdi, selectedStatus]);

  // Menangani pagination data mahasiswa (10 data per halaman)
  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Unduh data registrasi TA ke format CSV
  const handleExportData = () => {
    const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Fakultas', 'Program Studi', 'Status Registrasi', 'Angkatan'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      s.nim,
      `"${s.name}"`,
      `"${s.facultyCode}"`,
      `"${s.studyProgram}"`,
      `"${s.status}"`,
      s.angkatan,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekapitulasi_Registrasi_TA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Top bar role dosen */}
        <header className="topbar topbar-dosen">
          <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Registrasi Tugas Akhir TUP</div>
          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Bantuan" aria-label="Bantuan">
              <HelpCircle size={20} />
            </button>
            <button className="topbar-icon-btn" title="Notifikasi" aria-label="Notifikasi">
              <Bell size={20} />
            </button>
          </div>
        </header>

        <main className="page-body">
          {/* Header Content */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 6 }}>
                Rekapitulasi Registrasi TA Kampus
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                Data registrasi TA mahasiswa di Telkom University.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn-detail"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1.5px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#374151',
                }}
                onClick={() => {
                  setSelectedProdi('');
                  setSelectedStatus('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                title="Reset Filter"
              >
                <Filter size={14} />
                Filter
              </button>

              <button
                onClick={handleExportData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#7F1D1D',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(127, 29, 29, 0.25)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#6B1212'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#7F1D1D'; }}
              >
                <Download size={15} />
                Unduh Data
              </button>
            </div>
          </div>

          {/* Card Diagram Batang Distribusi Registrasi TA Per Fakultas */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9EDF5',
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            {/* Header Card Diagram */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ color: '#7F1D1D', display: 'flex', alignItems: 'center' }}>
                  <BarChart3 size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Distribusi Registrasi TA Per Fakultas
                </h3>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
                Total: {MOCK_REGISTRASI_TA.length} Mahasiswa
              </span>
            </div>

            {/* Diagram Batang Vertikal */}
            <VerticalBarChart dataList={chartData} />
          </div>

          {/* Search & Filter Row */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9EDF5',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240, display: 'flex', alignItems: 'center' }}>
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  paddingLeft: 38,
                  paddingRight: 14,
                  paddingTop: 9,
                  paddingBottom: 9,
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#111827',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#C0182A'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
              />
            </div>

            {/* Dropdown Major (Dinamis dari API Backend Study Programs) */}
            <div style={{ minWidth: 180 }}>
              <select
                value={selectedProdi}
                onChange={e => {
                  setSelectedProdi(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  background: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Majors</option>
                {studyPrograms.length > 0
                  ? studyPrograms.map(prodi => (
                      <option key={prodi.id} value={prodi.id}>
                        {prodi.name}
                      </option>
                    ))
                  : [
                      <option key="1" value="1">S1 Informatika</option>,
                      <option key="5" value="5">S1 Teknik Elektro</option>,
                      <option key="7" value="7">S1 Teknik Industri</option>,
                      <option key="8" value="8">S1 Sistem Informasi</option>,
                      <option key="11" value="11">S1 Desain Komunikasi Visual (DKV)</option>,
                    ]}
              </select>
            </div>

            {/* Dropdown Status */}
            <div style={{ minWidth: 160 }}>
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  background: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Registrasi Mahasiswa */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9EDF5',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div className="table-scroll-wrap" style={{ maxHeight: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', width: 64, textAlign: 'center' }}>
                      NO
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', minWidth: 220 }}>
                      NAMA &amp; NIM
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', minWidth: 240 }}>
                      FAKULTAS &amp; PRODI
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: 170 }}>
                      STATUS
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: 120 }}>
                      ANGKATAN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          Tidak ada data registrasi TA ditemukan
                        </div>
                        <div style={{ fontSize: 13 }}>
                          Coba sesuaikan kata kunci pencarian atau filter yang digunakan.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const statusCfg = STATUS_CONFIG[student.status] || {
                        label: student.status,
                        bg: '#F3F4F6',
                        color: '#374151',
                        border: '#E5E7EB',
                      };
                      const rowNum = startIndex + idx + 1;

                      return (
                        <tr
                          key={student.id}
                          style={{
                            borderBottom: idx < paginatedStudents.length - 1 ? '1px solid #F1F5F9' : 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FBFCFE'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                        >
                          {/* Nomor Urut */}
                          <td style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                            {rowNum}
                          </td>

                          {/* Nama & NIM */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>
                              {student.nim}
                            </div>
                          </td>

                          {/* Fakultas & Prodi */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B', marginBottom: 2 }}>
                              {student.facultyCode}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {student.studyProgram}
                            </div>
                          </td>

                          {/* Status Registrasi */}
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 14px',
                                borderRadius: 9999,
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                border: `1.5px solid ${statusCfg.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* Angkatan (Tahun saja tanpa icon/menu) */}
                          <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                            {student.angkatan}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #E9EDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Showing <strong style={{ color: '#111827' }}>{totalEntries > 0 ? startIndex + 1 : 0}</strong> to{' '}
                <strong style={{ color: '#111827' }}>{endIndex}</strong> of{' '}
                <strong style={{ color: '#111827' }}>{totalEntries}</strong> entries
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: currentPage === 1 ? '#CBD5E1' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => {
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: isActive ? 'none' : '1px solid transparent',
                        background: isActive ? '#7F1D1D' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = '#F1F5F9';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages || totalEntries === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: currentPage === totalPages || totalEntries === 0 ? '#CBD5E1' : '#374151',
                    cursor: currentPage === totalPages || totalEntries === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Dosen konsisten */}
        <FooterDosen />
      </div>
    </>
  );
};

export default RegistrasiTATUP;
