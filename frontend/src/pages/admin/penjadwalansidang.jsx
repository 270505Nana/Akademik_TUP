import '../../components/admin/css/penjadwalansidang.css';
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Lock, Unlock, Menu,
  ChevronLeft, ChevronRight, Save, AlertTriangle, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';

import { 
  getStudyPrograms, 
  getPenjadwalanSidang, 
  getAllRuangan, 
  setJadwalSidangAdmin, 
  setJadwalSidangBatchAdmin,
  toggleLockJadwalAdmin 
} from '../../service/api';

export default function PenjadwalanSidang() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar Mobile
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // Sidebar Desktop

  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });
  
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  
  const [ruanganList, setRuanganList] = useState([]);
  const [prodiList, setProdiList] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedProgramStudi, setSelectedProgramStudi] = useState('');
  
  const [drafts, setDrafts] = useState({}); 

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 992) {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    } else {
      setSidebarOpen(true);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(drafts).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [drafts]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchQuery.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getStudyPrograms().then(res => setProdiList(Array.isArray(res) ? res : []));
    getAllRuangan().then(res => setRuanganList(Array.isArray(res?.data?.data ?? res?.data) ? (res?.data?.data ?? res?.data) : []));
  }, []);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (searchDebounced) params.search = searchDebounced;
      if (selectedProgramStudi) params.studyProgramId = selectedProgramStudi;

      const res = await getPenjadwalanSidang(params); 
      setData(Array.isArray(res?.data?.data ?? res?.data) ? (res?.data?.data ?? res?.data) : []);
      setPagination(res?.data?.pagination ?? res?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 });
      setDrafts({}); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(1); }, []);

  useEffect(() => {
    if (searchDebounced !== '' || selectedProgramStudi !== '') {
      if (Object.keys(drafts).length > 0) {
        showAlert('warning', 'Aksi Dicegah', 'Data penjadwalan sidang belum tersimpan, silakan simpan terlebih dahulu!');
        return;
      }
      fetchData(1);
    }
  }, [searchDebounced, selectedProgramStudi]);

  const formatLocal = (isoString) => {
    if (!isoString) return { date: '', time: '' };
    const d = new Date(isoString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, 16);
    return { date: localISOTime.split('T')[0], time: localISOTime.split('T')[1] };
  };

  const getISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  };

  const handleDraftChange = (id, field, value) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleCancelRow = (id) => {
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[id];
      return newDrafts;
    });
  };

  const handleSaveRow = async (id) => {
    const draft = drafts[id];
    const original = data.find(d => d.id === id);
    const origDT = formatLocal(original.tglSidang);
    
    const tgl = draft?.tanggal !== undefined ? draft.tanggal : origDT.date;
    const wkt = draft?.waktu !== undefined ? draft.waktu : origDT.time;
    const ruangId = draft?.ruanganSidangId !== undefined ? draft.ruanganSidangId : original.ruanganSidang?.id;

    if (!tgl || !wkt || !ruangId) {
      showAlert('error', 'Validasi Gagal', 'Tanggal, Waktu, dan Ruangan harus diisi lengkap!');
      return;
    }

    try {
      await setJadwalSidangAdmin(id, { tglSidang: getISO(tgl, wkt), ruanganSidangId: ruangId });
      showAlert('success', 'Tersimpan', 'Jadwal sidang berhasil disimpan.');
      handleCancelRow(id);
      fetchData(pagination.page);
    } catch (error) {
      showAlert('error', 'Gagal', 'Terjadi kesalahan saat menyimpan jadwal.');
    }
  };

  const handleBatchSave = async () => {
    const payload = Object.keys(drafts).map(id => {
      const draft = drafts[id];
      const original = data.find(d => d.id === id);
      const origDT = formatLocal(original.tglSidang);
      
      const tgl = draft.tanggal !== undefined ? draft.tanggal : origDT.date;
      const wkt = draft.waktu !== undefined ? draft.waktu : origDT.time;
      const ruangId = draft.ruanganSidangId !== undefined ? draft.ruanganSidangId : original.ruanganSidang?.id;

      return { id, tglSidang: getISO(tgl, wkt), ruanganSidangId: ruangId };
    });

    if (payload.some(p => !p.tglSidang || !p.ruanganSidangId)) {
      showAlert('error', 'Validasi Gagal', 'Harap lengkapi semua baris yang diedit sebelum menyimpan massal.');
      return;
    }

    try {
      await setJadwalSidangBatchAdmin(payload);
      showAlert('success', 'Berhasil', `${payload.length} jadwal berhasil disimpan massal.`);
      setDrafts({});
      fetchData(pagination.page);
    } catch (error) {
      showAlert('error', 'Gagal', 'Terjadi kesalahan saat menyimpan data massal.');
    }
  };

  const handleToggleLock = async (id) => {
    try {
      await toggleLockJadwalAdmin(id);
      showAlert('success', 'Berhasil', 'Status kunci jadwal berhasil diubah.');
      fetchData(pagination.page);
    } catch (error) {
      showAlert('error', 'Gagal', 'Gagal mengubah status kunci.');
    }
  };

  const handlePageChange = (newPage) => {
    if (Object.keys(drafts).length > 0) {
      showAlert('warning', 'Aksi Dicegah', 'Data penjadwalan sidang belum tersimpan, silakan simpan terlebih dahulu!');
      return;
    }
    fetchData(newPage);
  };

  const draftCount = Object.keys(drafts).length;

  return (
    <div className={`ps-page-root ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="ps-main-content">
        {/* TOPBAR RESPONSIVE */}
        <header className="ps-topbar">
          <button className="ps-toggle-btn" onClick={handleToggleSidebar}>
            <Menu size={20} />
          </button>
          <h1 className="ps-topbar-title">Penjadwalan Sidang</h1>
        </header>

        <div className="ps-page-wrapper">
          <div className="ps-content-container">
            <div className="ps-header-info">
              <p className="ps-subtitle">Tentukan dosen penguji, tanggal, dan ruangan sesi sidang mahasiswa secara massal maupun individu.</p>
            </div>

            <section className="ps-card-main">
              <div className="ps-card-body">
                
                {/* TOOLBAR (SEARCH & FILTER) */}
                <div className="ps-filter-bar">
                  <div className="ps-filter-left">
                    <div className="ps-search-wrapper">
                      <Search className="ps-search-icon" size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari nama atau NIM..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ps-search-input"
                      />
                    </div>
                    <div className="ps-filter-dropdown-wrapper">
                      <Filter size={14} className="ps-filter-icon" />
                      <select value={selectedProgramStudi} onChange={(e) => setSelectedProgramStudi(e.target.value)} className="ps-dropdown">
                        <option value="">Semua Prodi</option>
                        {prodiList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {draftCount > 0 && (
                    <div className="ps-header-actions">
                      <div className="ps-badge-warning">
                        <AlertTriangle size={14} /> {draftCount} belum disimpan
                      </div>
                      <button onClick={handleBatchSave} className="ps-btn-primary">
                        <Save size={14} /> SIMPAN DATA
                      </button>
                    </div>
                  )}
                </div>

                <div className="ps-table-divider" />
                
                {/* TABEL RESPONSIVE */}
                <div className="ps-table-wrap">
                  <table className="ps-table">
                    <thead>
                      <tr>
                        <th className="col-no text-center">No</th>
                        <th className="col-mhs">Mahasiswa</th>
                        <th className="col-pembimbing">Pembimbing</th>
                        <th className="col-penguji">Penguji 1</th>
                        <th className="col-penguji">Penguji 2</th>
                        <th className="col-tanggal">Tanggal</th>
                        <th className="col-waktu">Waktu</th>
                        <th className="col-ruang">Ruangan</th>
                        <th className="col-aksi text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="9" className="text-center ps-py-6">Memuat data...</td></tr>
                      ) : data.length === 0 ? (
                        <tr><td colSpan="9" className="text-center ps-py-6">Tidak ada data ditemukan.</td></tr>
                      ) : (
                        data.map((item, idx) => {
                          const isPengujiLengkap = item.dosenPenguji1 && item.dosenPenguji2;
                          const isLocked = item.isLocked;
                          const rowDraft = drafts[item.id];
                          const isEdited = rowDraft !== undefined;

                          const origDT = formatLocal(item.tglSidang);
                          const valTanggal = rowDraft?.tanggal !== undefined ? rowDraft.tanggal : origDT.date;
                          const valWaktu = rowDraft?.waktu !== undefined ? rowDraft.waktu : origDT.time;
                          const valRuang = rowDraft?.ruanganSidangId !== undefined ? rowDraft.ruanganSidangId : (item.ruanganSidang?.id || '');

                          const isInputDisabled = !isPengujiLengkap || isLocked;

                          return (
                            <tr key={item.id} className={isEdited ? 'is-editing' : ''}>
                              <td className="ps-text-center">{((pagination.page - 1) * pagination.limit) + idx + 1}</td>
                              
                              <td>
                                <p className="ps-mhs-name">{item.mahasiswa?.name}</p>
                                <p className="ps-mhs-nim">{item.mahasiswa?.nim}</p>
                              </td>
                              
                              <td>
                                <div className="ps-dosen-list">
                                  <span className="ps-dosen-item">1. {item.dosenPembimbing1?.name || '-'}</span>
                                  <span className="ps-dosen-item">2. {item.dosenPembimbing2?.name || '-'}</span>
                                </div>
                              </td>

                              {/* PENGUJI 1 (Badge) */}
                              <td>
                                <div className={`ps-badge-dosen ${!item.dosenPenguji1 ? 'empty' : ''}`}>
                                  {item.dosenPenguji1?.name || 'Belum diplot'}
                                </div>
                              </td>

                              {/* PENGUJI 2 (Badge) */}
                              <td>
                                <div className={`ps-badge-dosen ${!item.dosenPenguji2 ? 'empty' : ''}`}>
                                  {item.dosenPenguji2?.name || 'Belum diplot'}
                                </div>
                              </td>
                              
                              <td>
                                <input 
                                  type="date" 
                                  value={valTanggal}
                                  onChange={(e) => handleDraftChange(item.id, 'tanggal', e.target.value)}
                                  disabled={isInputDisabled}
                                  className="ps-inline-input"
                                />
                              </td>

                              <td>
                                <input 
                                  type="time" 
                                  value={valWaktu}
                                  onChange={(e) => handleDraftChange(item.id, 'waktu', e.target.value)}
                                  disabled={isInputDisabled}
                                  className="ps-inline-input"
                                />
                              </td>

                              <td>
                                <select 
                                  value={valRuang}
                                  onChange={(e) => handleDraftChange(item.id, 'ruanganSidangId', e.target.value)}
                                  disabled={isInputDisabled}
                                  className="ps-inline-input"
                                >
                                  <option value="" disabled>Pilih Ruang</option>
                                  {ruanganList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                              </td>

                              <td className="text-center">
                                <div className="ps-action-buttons">
                                  {isEdited ? (
                                    <>
                                      <button onClick={() => handleCancelRow(item.id)} className="ps-btn-cancel" title="Batal">
                                        <RotateCcw size={14} />
                                      </button>
                                      <button onClick={() => handleSaveRow(item.id)} className="ps-btn-save-sm" title="Simpan">
                                        Simpan
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleToggleLock(item.id)}
                                      disabled={!item.tglSidang} 
                                      className={`ps-btn-lock ${isLocked ? 'locked' : 'unlocked'}`}
                                      title={isLocked ? "Terbuka untuk diubah" : "Kunci dari perubahan"}
                                    >
                                      {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                    </button>
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

                {pagination.totalPages > 1 && (
                  <div className="ps-table-footer">
                    <span className="ps-page-info">Halaman <strong>{pagination.page}</strong> dari <strong>{pagination.totalPages}</strong></span>
                    <div className="ps-pagination">
                      <button disabled={pagination.page === 1} onClick={() => handlePageChange(pagination.page - 1)} className="btn-page"><ChevronLeft size={14} /></button>
                      <button disabled={pagination.page === pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)} className="btn-page"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                )}

              </div>
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}