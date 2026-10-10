import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Menu, HelpCircle, Bell, Search, Lock,
  ChevronLeft, ChevronRight, Save, Info, Loader2, Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import { getStudyPrograms, getPenjadwalanSidang, getPengujiOptions, setPengujiSidang, setPengujiSidangBatch } from '../../service/api';
import { getInitials, getAvatarTheme, formatTanggal, formatWaktu } from '../../components/dosen/penjadwalansidang/Helpers';
import PengujiSearchable from '../../components/dosen/penjadwalansidang/PengujiSearchable';
import '../dashboard.css';
import '../../components/dosen/penjadwalansidang/penjadwalansidang.css';

const PAGE_SIZE = 5;
const POLLING_INTERVAL_MS = 10000;

const TABLE_COLUMNS = [
  { label: 'No', className: 'ps-col-no', align: 'center' },
  { label: 'Mahasiswa', className: 'ps-col-mhs', align: 'left' },
  { label: 'Dosen Pembimbing', className: 'ps-col-dosbim', align: 'left' },
  { label: 'Penguji 1', className: 'ps-col-penguji', align: 'left' },
  { label: 'Penguji 2', className: 'ps-col-penguji', align: 'left' },
  { label: 'Tanggal', className: 'ps-col-tanggal', align: 'left' },
  { label: 'Waktu', className: 'ps-col-waktu', align: 'left' },
  { label: 'Ruangan', className: 'ps-col-ruangan', align: 'left' },
  { label: 'Aksi', className: 'ps-col-aksi', align: 'center' },
];

const MahasiswaAvatar = ({ student }) => {
  const theme = getAvatarTheme(student.nama);
  return (
    <div
      className="ps-avatar"
      style={{
        background: theme.bg,
        color: theme.color,
      }}
    >
      {student.initials || getInitials(student.nama)}
    </div>
  );
};

const LockedCell = ({ value, onLockedClick, isCompact = false }) => {
  const isEmpty = !value;
  return (
    <div
      onClick={onLockedClick}
      title={value ? `${value} (Hanya Admin)` : 'Belum ditentukan (Hanya Admin)'}
      className={`ps-locked-cell ${isCompact ? 'compact' : ''} ${isEmpty ? 'empty' : ''}`}
    >
      <Lock size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
      <span className="ps-locked-text">
        {value || '—'}
      </span>
    </div>
  );
};

const PenjadwalanSidang = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);

  const [prodiOptions, setProdiOptions] = useState([{ value: '', label: 'Semua Prodi' }]);
  const [prodiFetchError, setProdiFetchError] = useState(false);
  const [isLoadingProdi, setIsLoadingProdi] = useState(true);
  const [pengujiOptions, setPengujiOptions] = useState([]);
  const [isLoadingPenguji, setIsLoadingPenguji] = useState(true);
  const [pengujiFetchError, setPengujiFetchError] = useState(false);
  const [sidangList, setSidangList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataFetchError, setDataFetchError] = useState(false);
  const [rowStatus, setRowStatus] = useState({});
  const [rowSaving, setRowSaving] = useState({});

  const isFetchingRef = useRef(false);
  const rowStatusRef = useRef({});

  useEffect(() => {
    rowStatusRef.current = rowStatus;
  }, [rowStatus]);

  const unsavedCount = useMemo(() => {
    return Object.values(rowStatus).filter(s => s === 'unsaved').length;
  }, [rowStatus]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedCount > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    if (unsavedCount > 0) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedCount]);

  // Toast Notification helper
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // 1. Fetch Program Studi
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
            { value: '', label: 'Semua Prodi' },
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

  useEffect(() => {
    let isMounted = true;
    const fetchPenguji = async () => {
      try {
        setIsLoadingPenguji(true);
        setPengujiFetchError(false);
        const dosens = await getPengujiOptions();
        if (isMounted) {
          const mapped = dosens.map(d => ({
            value: d.id,
            label: d.kodeDosen ? `${d.kodeDosen} - ${d.name}` : d.name,
            researchGroupId: d.researchGroupId || null,
          }));
          setPengujiOptions(mapped);
          setPengujiFetchError(false);
        }
      } catch (err) {
        console.error('Gagal memuat daftar dosen penguji:', err);
        if (isMounted) {
          setPengujiOptions([]);
          setPengujiFetchError(true);
        }
      } finally {
        if (isMounted) setIsLoadingPenguji(false);
      }
    };

    fetchPenguji();
    return () => { isMounted = false; };
  }, []);

  const fetchSidangData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!isSilent) {
        setIsLoadingData(true);
        setDataFetchError(false);
      }
      const res = await getPenjadwalanSidang({ limit: 20 });
      const rawList = Array.isArray(res) ? res : res?.data || [];

      const mapped = rawList.map(item => {
        const mhs = item.mahasiswa || {};
        const prodiName = mhs.studyProgram?.name || '-';
        const dosenPembimbing1Name = item.dosenPembimbing1?.name || null;
        const dosenPembimbing2Name = item.dosenPembimbing2?.name || null;
        const penguji1Id = item.dosenPenguji1?.id || null;
        const penguji2Id = item.dosenPenguji2?.id || null;
        const ruanganName = item.ruanganSidang
          ? `${item.ruanganSidang.name}${item.ruanganSidang.gedung ? ` (${item.ruanganSidang.gedung})` : ''}`
          : null;
        const researchGroupId = item.dosenPembimbing1?.researchGroupId || item.researchGroupId || null;

        return {
          id: item.id,
          raw: item,
          nama: mhs.name || 'Mahasiswa',
          nim: mhs.nim || '-',
          prodi: prodiName,
          initials: getInitials(mhs.name || 'M'),
          dosenPembimbing1: dosenPembimbing1Name,
          dosenPembimbing2: dosenPembimbing2Name,
          dosenPembimbing: dosenPembimbing1Name || '-',
          penguji1: penguji1Id,
          penguji2: penguji2Id,
          jadwal: formatTanggal(item.tglSidang),
          waktu: formatWaktu(item.tglSidang),
          ruangan: ruanganName,
          researchGroupId,
          isLocked: Boolean(item.isLocked),
        };
      });

      if (!isSilent) {
        const initialStatus = {};
        mapped.forEach(item => {
          const isComplete = Boolean(item.penguji1 && item.penguji2);
          initialStatus[item.id] = isComplete ? 'saved' : 'incomplete';
        });

        setSidangList(mapped);
        setRowStatus(initialStatus);
        setDataFetchError(false);
      } else {
        const currentStatusMap = rowStatusRef.current;
        const nextStatus = { ...currentStatusMap };

        setSidangList(prevList => {
          const prevMap = new Map(prevList.map(item => [item.id, item]));

          return mapped.map(newItem => {
            const oldItem = prevMap.get(newItem.id);
            const isUnsaved = oldItem && currentStatusMap[newItem.id] === 'unsaved';

            if (newItem.isLocked) {
              const isComplete = Boolean(newItem.penguji1 && newItem.penguji2);
              nextStatus[newItem.id] = isComplete ? 'saved' : 'incomplete';
              return newItem;
            } else if (isUnsaved) {
              return {
                ...newItem,
                penguji1: oldItem.penguji1,
                penguji2: oldItem.penguji2,
              };
            } else {
              const isComplete = Boolean(newItem.penguji1 && newItem.penguji2);
              nextStatus[newItem.id] = isComplete ? 'saved' : 'incomplete';
              return newItem;
            }
          });
        });

        setRowStatus(nextStatus);
      }
    } catch (err) {
      if (!isSilent) {
        console.error('Gagal memuat data penjadwalan sidang:', err);
        setSidangList([]);
        setDataFetchError(true);
      }
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) {
        setIsLoadingData(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSidangData(false);

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchSidangData(true);
      }
    }, POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSidangData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSidangData]);

  const handleLockedFieldClick = () => {
    showToast('Kolom ini hanya dapat diisi oleh Admin.', 'warning');
  };

  const handlePengujiChange = useCallback((id, field, value) => {
    setSidangList(prev => {
      const targetMhs = prev.find(m => m.id === id);
      if (targetMhs?.isLocked) return prev;

      const updatedList = prev.map(m => (m.id === id ? { ...m, [field]: value } : m));
      const updatedTarget = updatedList.find(m => m.id === id);

      if (!updatedTarget.penguji1 || !updatedTarget.penguji2) {
        setRowStatus(rs => ({ ...rs, [id]: 'incomplete' }));
      } else {
        setRowStatus(rs => ({ ...rs, [id]: 'unsaved' }));
      }
      return updatedList;
    });
  }, []);

  // Simpan per baris (Aksi) — value = dosen id
  const handleSaveRow = async (mhs) => {
    if (mhs.isLocked) {
      showToast('❌ Data telah dikunci oleh Admin. Dosen penguji tidak dapat diubah.', 'error');
      return;
    }
    const status = rowStatus[mhs.id];
    if (status !== 'unsaved') return;

    setRowSaving(prev => ({ ...prev, [mhs.id]: true }));
    try {
      await setPengujiSidang(mhs.id, {
        dosenPenguji1Id: mhs.penguji1,
        dosenPenguji2Id: mhs.penguji2,
      });
      setRowStatus(prev => ({ ...prev, [mhs.id]: 'saved' }));
      showToast(`✅ Penguji ${mhs.nama} berhasil disimpan.`, 'success');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menyimpan penguji.';
      showToast(`❌ ${message}`, 'error');
      fetchSidangData();
    } finally {
      setRowSaving(prev => ({ ...prev, [mhs.id]: false }));
    }
  };

  // Simpan semua row yang unsaved — payload pakai dosen id
  const handleSimpanData = async () => {
    if (unsavedCount === 0) return;
    const unsavedRows = sidangList.filter(m => rowStatus[m.id] === 'unsaved' && !m.isLocked);
    if (unsavedRows.length === 0) return;
    const payload = unsavedRows.map(m => ({
      id: m.id,
      dosenPenguji1Id: m.penguji1,
      dosenPenguji2Id: m.penguji2,
    }));
    try {
      await setPengujiSidangBatch(payload);
      setRowStatus(prev => {
        const next = { ...prev };
        unsavedRows.forEach(m => { next[m.id] = 'saved'; });
        return next;
      });
      showToast('Semua perubahan penguji berhasil disimpan!', 'success');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menyimpan data batch.';
      showToast(`❌ ${message}`, 'error');
      fetchSidangData();
    }
  };

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const prodiFilter = selectedProdi.toLowerCase().trim();

    return sidangList.filter(m => {
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
  }, [sidangList, searchQuery, selectedProdi]);

  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleSearchChange = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const handleProdiChange = (val) => { setSelectedProdi(val); setCurrentPage(1); };

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
        </header>

        <main className="page-body">
          {/* Content Header: judul halaman + info banner */}
          <div className="ps-header-wrap">
            <div>
              <h1 className="ps-title">Penjadwalan Sidang</h1>
              <p className="ps-subtitle">
                Tentukan dosen penguji mahasiswa untuk proses penjadwalan sidang.
              </p>
            </div>

            {/* Info banner — menjelaskan alur data ke Admin */}
            <div className="ps-info-banner">
              <Info size={16} color="#3B82F6" className="ps-info-icon" />
              <p className="ps-info-text">
                Setelah dosen penguji ditentukan, data akan dikirim ke Admin untuk penjadwalan tanggal, waktu dan ruangan.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar + tombol Simpan Data */}
          <div className="ps-filter-container">
            <div className="ps-search-wrap">
              <Search size={15} color="#9CA3AF" className="ps-search-icon" />
              <input
                id="penjadwalan-search"
                type="text"
                placeholder="Cari nama mahasiswa atau NIM..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="ps-search-input"
              />
            </div>

            {/* Filter Program Studi */}
            <div className="ps-prodi-wrap">
              <select
                id="penjadwalan-filter-prodi"
                value={selectedProdi}
                onChange={e => handleProdiChange(e.target.value)}
                disabled={isLoadingProdi || prodiFetchError}
                className={`ps-prodi-select ${isLoadingProdi ? 'loading' : ''} ${prodiFetchError ? 'error' : ''}`}
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
                <span className="ps-error-text">
                  Gagal memuat data program studi. Silakan muat ulang halaman.
                </span>
              )}
            </div>

            {/* Badge jumlah perubahan belum disimpan */}
            <div className="ps-action-group">
              {unsavedCount > 0 && (
                <span className="ps-unsaved-badge">
                  {unsavedCount} perubahan belum disimpan
                </span>
              )}
            </div>
          </div>

          <div className="ps-table-card">
            <div className="table-scroll-wrap ps-table-scroll">
              <table className="ps-table">
                <thead>
                  <tr className="ps-thead-row">
                    {TABLE_COLUMNS.map(col => (
                      <th
                        key={col.label}
                        className={`ps-th ${col.align === 'center' ? 'ps-th-center' : 'ps-th-left'} ${col.className}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {isLoadingData ? (
                    <tr>
                      <td colSpan={9} className="ps-empty-row">
                        <div className="ps-loading-inline">
                          <Loader size={20} className="ps-spin" />
                          <span className="ps-loading-text">Memuat data penjadwalan sidang...</span>
                        </div>
                      </td>
                    </tr>
                  ) : dataFetchError ? (
                    <tr>
                      <td colSpan={9} className="ps-empty-row">
                        <div className="ps-empty-title ps-empty-title-error">
                          Gagal memuat data penjadwalan sidang
                        </div>
                        <div className="ps-empty-desc">
                          Terjadi kesalahan saat menghubungi server. Silakan coba muat ulang halaman.
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="ps-empty-row">
                        <div className="ps-empty-title">
                          Tidak ada mahasiswa ditemukan
                        </div>
                        <div className="ps-empty-desc">
                          Coba sesuaikan kata kunci pencarian atau filter program studi.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((m, idx) => {
                      const currentStatus = rowStatus[m.id] || (m.penguji1 && m.penguji2 ? 'saved' : 'incomplete');
                      const isSaving = Boolean(rowSaving[m.id]);
                      const isUnsaved = currentStatus === 'unsaved';

                      return (
                        <tr
                          key={m.id}
                          className={`ps-tr ${idx < paginatedData.length - 1 ? 'ps-tr-bordered' : ''}`}
                        >
                          {/* 1. Kolom: No */}
                          <td className="ps-td-no">
                            {startIndex + idx + 1}
                          </td>

                          {/* 2. Kolom: Identitas Mahasiswa */}
                          <td className="ps-td-mhs">
                            <div className="ps-mhs-wrap">
                              <MahasiswaAvatar student={m} />
                              <div className="ps-mhs-info">
                                <div>
                                  <span title={m.nama} className="ps-mhs-name">
                                    {m.nama}
                                  </span>
                                </div>
                                <div title={m.nim} className="ps-mhs-nim">
                                  {m.nim}
                                </div>
                                <div title={m.prodi} className="ps-mhs-prodi">
                                  {m.prodi}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="ps-td-dosbim">
                            {m.dosenPembimbing1 && m.dosenPembimbing2 && m.dosenPembimbing2 !== '-' ? (
                              <div className="ps-dosbim-list">
                                <span className="ps-dosbim-item">1. {m.dosenPembimbing1}</span>
                                <span className="ps-dosbim-item">2. {m.dosenPembimbing2}</span>
                              </div>
                            ) : (
                              <span className="ps-dosbim-text">
                                {m.dosenPembimbing1 || m.dosenPembimbing || '-'}
                              </span>
                            )}
                          </td>

                          <td className="ps-td-penguji">
                            <PengujiSearchable
                              value={m.penguji1}
                              placeholder={isLoadingPenguji ? 'Memuat...' : 'Pilih Penguji 1'}
                              otherValue={m.penguji2}
                              options={m.researchGroupId
                                ? pengujiOptions.filter(p => p.researchGroupId === m.researchGroupId)
                                : pengujiOptions}
                              status={currentStatus}
                              disabled={m.isLocked}
                              onChange={val => handlePengujiChange(m.id, 'penguji1', val)}
                            />
                            {!m.penguji1 && (
                              <div className="ps-validation-msg">
                                Penguji 1 wajib diisi
                              </div>
                            )}
                          </td>

                          <td className="ps-td-penguji">
                            <PengujiSearchable
                              value={m.penguji2}
                              placeholder={isLoadingPenguji ? 'Memuat...' : 'Pilih Penguji 2'}
                              otherValue={m.penguji1}
                              options={m.researchGroupId
                                ? pengujiOptions.filter(p => p.researchGroupId === m.researchGroupId)
                                : pengujiOptions}
                              status={currentStatus}
                              disabled={m.isLocked}
                              onChange={val => handlePengujiChange(m.id, 'penguji2', val)}
                            />
                            {!m.penguji2 && (
                              <div className="ps-validation-msg">
                                Penguji 2 wajib diisi
                              </div>
                            )}
                          </td>

                          <td className="ps-td-locked">
                            <LockedCell value={m.jadwal} onLockedClick={handleLockedFieldClick} />
                          </td>

                          <td className="ps-td-locked">
                            <LockedCell value={m.waktu || null} onLockedClick={handleLockedFieldClick} isCompact={true} />
                          </td>

                          <td className="ps-td-locked">
                            <LockedCell value={m.ruangan} onLockedClick={handleLockedFieldClick} />
                          </td>

                          <td className="ps-td-aksi">
                            <button
                              className={`btn-verif ps-btn-simpan-row ${(!isUnsaved || isSaving || m.isLocked) ? 'disabled' : 'active'}`}
                              disabled={!isUnsaved || isSaving || m.isLocked}
                              title={m.isLocked ? "Data dikunci oleh Admin" : (isUnsaved ? "Simpan Perubahan" : "Tidak ada perubahan")}
                              onClick={() => handleSaveRow(m)}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 size={11} className="ps-spin" />
                                  <span>Simpan</span>
                                </>
                              ) : (
                                <>
                                  <Save size={11} />
                                  <span>Simpan</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="ps-pagination-wrap">
              <div className="ps-pagination-info">
                Menampilkan{' '}{totalEntries > 0 ? startIndex + 1 : 0}
                {' '}-{' '}{endIndex}{' '}dari{' '}{totalEntries}{' '}data
              </div>

              <div className="ps-pagination-controls">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="ps-page-arrow"
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
                      className={`ps-page-num ${isActive ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages || totalEntries === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="ps-page-arrow"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>

        <FooterDosen />

        {/* Toast Notification  */}
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