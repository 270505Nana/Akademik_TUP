import React, { useState, useMemo, useEffect } from 'react';
import {
  Menu, HelpCircle, Bell, Search, Lock,
  ChevronLeft, ChevronRight, Save, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import { getStudyPrograms } from '../../service/api';
import '../dashboard.css';

// ---------------------------------------------------------------------------
// Mock data mahasiswa yang akan dijadwalkan sidangnya.
// TODO: replace with API call — GET /api/dosen/penjadwalan-sidang
// ---------------------------------------------------------------------------
const MOCK_DAFTAR_PENGUJI = [
  'Dr. Rina Permata, M.Kom.',
  'Dr. Anwar Sanusi, M.T.',
  'Prof. Hendra Wijaya, M.Kom.',
  'Dr. Siti Aminah, M.Si.',
  'Ir. Maya Setiawan, M.T.',
  'Dr. Budi Santoso, S.T., M.Kom.',
];

// TODO: replace with API call — GET /api/dosen/penjadwalan-sidang/mahasiswa
const MOCK_MAHASISWA = [
  {
    id: 1,
    nama: 'Andi Pratama',
    nim: '2010400',
    prodi: 'S1 Rekayasa Perangkat Lunak',
    initials: 'AP',
    avatarBg: '#DBEAFE',
    avatarColor: '#1E40AF',
    dosenPembimbing: 'Dr. Budi Santoso, S.T., M.Kom.',
    penguji1: 'Dr. Rina Permata, M.Kom.',
    penguji2: 'Dr. Anwar Sanusi, M.T.',
    jadwal: null,
    ruangan: null,
  },
  {
    id: 2,
    nama: 'Siti Nurhalliza',
    nim: '2010455',
    prodi: 'S1 Sistem Informasi',
    initials: 'SN',
    avatarBg: '#FEE2E2',
    avatarColor: '#991B1B',
    dosenPembimbing: 'Prof. Hendra Wijaya, M.Kom.',
    penguji1: 'Dr. Siti Aminah, M.Si.',
    penguji2: null,
    jadwal: null,
    ruangan: null,
  },
  {
    id: 3,
    nama: 'Kevin Sanjaya',
    nim: '2010412',
    prodi: 'S1 Informatika',
    initials: 'KS',
    avatarBg: '#D1FAE5',
    avatarColor: '#065F46',
    dosenPembimbing: 'Ir. Maya Setiawan, M.T.',
    penguji1: 'Dr. Rina Permata, M.Kom.',
    penguji2: 'Dr. Anwar Sanusi, M.T.',
    jadwal: 'Senin, 24 Agu 2026',
    ruangan: 'Lab 302',
  },
  {
    id: 4,
    nama: 'Diana Larasati',
    nim: '2010488',
    prodi: 'S1 Rekayasa Perangkat Lunak',
    initials: 'DL',
    avatarBg: '#FEF3C7',
    avatarColor: '#92400E',
    dosenPembimbing: 'Dr. Budi Santoso, S.T., M.Kom.',
    penguji1: 'Prof. Hendra Wijaya, M.Kom.',
    penguji2: 'Dr. Siti Aminah, M.Si.',
    jadwal: null,
    ruangan: null,
  },
  {
    id: 5,
    nama: 'Fajar Setiawan',
    nim: '2010420',
    prodi: 'S1 Sistem Informasi',
    initials: 'FA',
    avatarBg: '#E0E7FF',
    avatarColor: '#3730A3',
    dosenPembimbing: 'Ir. Maya Setiawan, M.T.',
    penguji1: null,
    penguji2: null,
    jadwal: null,
    ruangan: null,
  },
  {
    id: 6,
    nama: 'Rizky Ramadhan',
    nim: '2010391',
    prodi: 'S1 Informatika',
    initials: 'RR',
    avatarBg: '#FEE2E2',
    avatarColor: '#991B1B',
    dosenPembimbing: 'Dr. Rina Permata, M.Kom.',
    penguji1: 'Dr. Anwar Sanusi, M.T.',
    penguji2: null,
    jadwal: null,
    ruangan: null,
  },
  {
    id: 7,
    nama: 'Putri Ayu Lestari',
    nim: '2010377',
    prodi: 'S1 Rekayasa Perangkat Lunak',
    initials: 'PL',
    avatarBg: '#D1FAE5',
    avatarColor: '#065F46',
    dosenPembimbing: 'Prof. Hendra Wijaya, M.Kom.',
    penguji1: 'Dr. Siti Aminah, M.Si.',
    penguji2: 'Ir. Maya Setiawan, M.T.',
    jadwal: 'Rabu, 26 Agu 2026',
    ruangan: 'GKB 201',
  },
  {
    id: 8,
    nama: 'Hendra Kurniawan',
    nim: '2010334',
    prodi: 'S1 Sistem Informasi',
    initials: 'HK',
    avatarBg: '#DBEAFE',
    avatarColor: '#1E40AF',
    dosenPembimbing: 'Dr. Budi Santoso, S.T., M.Kom.',
    penguji1: null,
    penguji2: null,
    jadwal: null,
    ruangan: null,
  },
];

const PAGE_SIZE = 5;
const MahasiswaAvatar = ({ student }) => (
  <div
    style={{
      width: 38,
      height: 38,
      borderRadius: '50%',
      background: student.avatarBg || '#FEE2E2',
      color: student.avatarColor || '#991B1B',
      fontWeight: 700,
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: '1.5px solid #E2E8F0',
    }}
  >
    {student.initials}
  </div>
);

// Sel kolom read-only (Jadwal / Ruangan) dengan ikon gembok.
// Klik → trigger toast "hanya Admin" melalui onLockedClick callback.
const LockedCell = ({ value, onLockedClick }) => (
  <div
    onClick={onLockedClick}
    title="Klik untuk info lebih lanjut"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '7px 10px',
      borderRadius: 8,
      background: '#F8FAFC',
      border: '1.5px solid #E2E8F0',
      cursor: 'pointer',
      color: value ? '#374151' : '#94A3B8',
      fontSize: 13,
      fontWeight: value ? 500 : 400,
      fontStyle: value ? 'normal' : 'italic',
      transition: 'border-color 0.2s, background 0.2s',
      minWidth: 160,
      userSelect: 'none',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#C0182A';
      e.currentTarget.style.background = '#FFF0F1';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#E2E8F0';
      e.currentTarget.style.background = '#F8FAFC';
    }}
  >
    <Lock size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
    {value || '— Belum ditentukan'}
  </div>
);

// Dropdown pemilihan penguji.
const PengujiSelect = ({ value, placeholder, otherValue, onChange }) => {
  const available = MOCK_DAFTAR_PENGUJI.filter(p => p !== otherValue);

  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      style={{
        width: '100%',
        padding: '7px 10px',
        border: '1.5px solid #E2E8F0',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        color: value ? '#374151' : '#94A3B8',
        background: '#FFFFFF',
        outline: 'none',
        cursor: 'pointer',
        minWidth: 180,
        transition: 'border-color 0.2s',
      }}
      onFocus={e => { e.target.style.borderColor = '#C0182A'; }}
      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
    >
      <option value="">{placeholder}</option>
      {available.map(p => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
};

const PenjadwalanSidang = () => {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [toasts, setToasts]               = useState([]);

  const [prodiOptions, setProdiOptions]   = useState([
    { value: '', label: 'All Major' }
  ]);
  const [prodiFetchError, setProdiFetchError] = useState(false);
  const [isLoadingProdi, setIsLoadingProdi] = useState(true);
  const [mahasiswaList, setMahasiswaList] = useState(MOCK_MAHASISWA);
  useEffect(() => {
    let isMounted = true;

    const fetchStudyPrograms = async () => {
      try {
        setIsLoadingProdi(true);
        setProdiFetchError(false);
        const res = await getStudyPrograms();
        const data = Array.isArray(res) ? res : res?.data || [];
        if (isMounted) {
          const activeProdi = data.filter(sp => sp.isActive !== false);
          const dynamicOptions = [
            { value: '', label: 'All Major' },
            ...activeProdi.map(sp => ({
              value: sp.name,
              label: sp.name,
              id: sp.id,
            })),
          ];
          setProdiOptions(dynamicOptions);
          setProdiFetchError(false);
        }
      } catch (err) {
        console.error('Gagal memuat program studi dari database API:', err);
        if (isMounted) {
          setProdiOptions([]);
          setProdiFetchError(true);
        }
      } finally {
        if (isMounted) setIsLoadingProdi(false);
      }
    };

    fetchStudyPrograms();
    return () => { isMounted = false; };
  }, []);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Handler klik kolom Jadwal / Ruangan (read-only field)
  const handleLockedFieldClick = () => {
    showToast('Kolom ini hanya dapat diisi oleh Admin.', 'warning');
  };

  const handlePengujiChange = (id, field, value) => {
    setMahasiswaList(prev =>
      prev.map(m => m.id === id ? { ...m, [field]: value } : m)
    );
  };

  const handleSimpanData = () => {
    console.log('[PenjadwalanSidang] Data yang akan disimpan:', mahasiswaList);
    showToast('Data penguji berhasil disimpan!', 'success');
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const prodiFilter = selectedProdi.toLowerCase().trim();

    return mahasiswaList.filter(m => {
      const matchSearch =
        !q ||
        m.nama.toLowerCase().includes(q) ||
        m.nim.toLowerCase().includes(q);

      const mProdi = (m.prodi || '').toLowerCase();
      const matchProdi =
        !selectedProdi ||
        mProdi === prodiFilter ||
        mProdi.includes(prodiFilter) ||
        prodiFilter.includes(mProdi) ||
        (selectedProdi === 'S1 Informatika' && (mProdi === 'informatika' || mProdi === 'if')) ||
        (selectedProdi === 'S1 Sistem Informasi' && (mProdi === 'si' || mProdi === 'sistem informasi')) ||
        (selectedProdi === 'S1 Rekayasa Perangkat Lunak' && (mProdi === 'rpl' || mProdi === 'rekayasa perangkat lunak'));

      return matchSearch && matchProdi;
    });
  }, [mahasiswaList, searchQuery, selectedProdi]);

  const totalEntries  = filteredData.length;
  const totalPages    = Math.ceil(totalEntries / PAGE_SIZE) || 1;
  const startIndex    = (currentPage - 1) * PAGE_SIZE;
  const endIndex      = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleSearchChange = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const handleProdiChange  = (val) => { setSelectedProdi(val); setCurrentPage(1); };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        <header className="topbar topbar-dosen">
          <button
            className="topbar-toggle topbar-toggle-dosen"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Penjadwalan Sidang</div>
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
          {/* Content Header: judul halaman + info banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 6 }}>
                Penjadwalan Sidang
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                Tentukan dosen penguji mahasiswa untuk proses penjadwalan sidang.
              </p>
            </div>

            {/* Info banner — menjelaskan alur data ke Admin */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 10,
                padding: '10px 14px',
                maxWidth: 380,
                flex: '0 0 auto',
              }}
            >
              <Info size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#1D4ED8', margin: 0, lineHeight: 1.55 }}>
                Setelah dosen penguji ditentukan, data akan dikirim ke Admin untuk penjadwalan hari, tanggal, dan ruangan.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar + tombol Simpan Data */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9EDF5',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 220, display: 'flex', alignItems: 'center' }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                id="penjadwalan-search"
                type="text"
                placeholder="Cari nama mahasiswa atau NIM..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 36,
                  paddingRight: 14,
                  paddingTop: 8,
                  paddingBottom: 8,
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

            {/* Filter Program Studi — Dinamis dari Database API */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <select
                id="penjadwalan-filter-prodi"
                value={selectedProdi}
                onChange={e => handleProdiChange(e.target.value)}
                disabled={isLoadingProdi || prodiFetchError}
                style={{
                  padding: '8px 12px',
                  border: `1.5px solid ${prodiFetchError ? '#FCA5A5' : '#E2E8F0'}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: prodiFetchError ? '#991B1B' : '#374151',
                  background: prodiFetchError ? '#FEF2F2' : isLoadingProdi ? '#F8FAFC' : '#FFFFFF',
                  outline: 'none',
                  cursor: (isLoadingProdi || prodiFetchError) ? 'not-allowed' : 'pointer',
                  minWidth: 200,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#C0182A'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
              >
                {isLoadingProdi ? (
                  <option value="">Memuat program studi...</option>
                ) : prodiFetchError ? (
                  <option value="">Gagal memuat program studi</option>
                ) : (
                  prodiOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))
                )}
              </select>
              {prodiFetchError && (
                <span style={{ fontSize: 11, color: '#DC2626', lineHeight: 1.3 }}>
                  Gagal memuat data program studi. Silakan muat ulang halaman.
                </span>
              )}
            </div>

            {/* Tombol Simpan Data — reuse class btn-verif dari dashboard.css */}
            <button
              id="penjadwalan-btn-simpan"
              className="btn-verif"
              onClick={handleSimpanData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Save size={14} />
              Simpan Data
            </button>
          </div>

          {/* Tabel Penjadwalan Sidang — scrollable horizontal di layar kecil */}
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
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                {/* Table Header */}
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    {[
                      { label: 'Mahasiswa' },
                      { label: 'Dosen Pembimbing', width: 180 },
                      { label: 'Penguji 1',         width: 210 },
                      { label: 'Penguji 2',         width: 210 },
                      { label: 'Jadwal',            width: 190 },
                      { label: 'Ruangan',           width: 190 },
                    ].map(col => (
                      <th
                        key={col.label}
                        style={{
                          padding: '13px 18px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#64748B',
                          textTransform: 'uppercase',
                          textAlign: 'left',
                          letterSpacing: '0.04em',
                          width: col.width,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          Tidak ada mahasiswa ditemukan
                        </div>
                        <div style={{ fontSize: 13 }}>
                          Coba sesuaikan kata kunci pencarian atau filter program studi.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((m, idx) => (
                      <tr
                        key={m.id}
                        style={{
                          borderBottom: idx < paginatedData.length - 1 ? '1px solid #F1F5F9' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FBFCFE'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                      >
                        {/* Kolom: Identitas Mahasiswa */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <MahasiswaAvatar student={m} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 1 }}>
                                {m.nama}
                              </div>
                              <div style={{ fontSize: 12, color: '#6B7280' }}>
                                {m.nim} &bull; {m.prodi}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kolom: Dosen Pembimbing (read-only, tidak diedit dosen) */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                            {m.dosenPembimbing}
                          </span>
                        </td>

                        {/* Kolom: Penguji 1 (editable dropdown) */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <PengujiSelect
                            value={m.penguji1}
                            placeholder="Pilih Penguji 1"
                            otherValue={m.penguji2}
                            onChange={val => handlePengujiChange(m.id, 'penguji1', val)}
                          />
                        </td>

                        {/* Kolom: Penguji 2 (editable dropdown) */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <PengujiSelect
                            value={m.penguji2}
                            placeholder="Pilih Penguji 2"
                            otherValue={m.penguji1}
                            onChange={val => handlePengujiChange(m.id, 'penguji2', val)}
                          />
                        </td>

                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <LockedCell value={m.jadwal} onLockedClick={handleLockedFieldClick} />
                        </td>

                        {/* Kolom: Ruangan (read-only — diisi Admin, klik tampilkan toast) */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                          <LockedCell value={m.ruangan} onLockedClick={handleLockedFieldClick} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: '14px 20px',
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
                Showing{' '}
                <strong style={{ color: '#111827' }}>{totalEntries > 0 ? startIndex + 1 : 0}</strong>
                {' '}to{' '}
                <strong style={{ color: '#111827' }}>{endIndex}</strong>
                {' '}of{' '}
                <strong style={{ color: '#111827' }}>{totalEntries}</strong>
                {' '}entries
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #E2E8F0', background: '#FFFFFF',
                    color: currentPage === 1 ? '#CBD5E1' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: isActive ? 'none' : '1px solid transparent',
                        background: isActive ? '#7F1D1D' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F1F5F9'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages || totalEntries === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #E2E8F0', background: '#FFFFFF',
                    color: currentPage === totalPages || totalEntries === 0 ? '#CBD5E1' : '#374151',
                    cursor: currentPage === totalPages || totalEntries === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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

        <FooterDosen />

        {/* Toast Notification — reuse .toast-container-custom & .simta-toast dari dashboard.css */}
        <div className="toast-container-custom">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className={`simta-toast ${toast.type}`}
              >
                <span className="toast-msg">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default PenjadwalanSidang;
