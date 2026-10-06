import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Calendar, MapPin, Lock, Unlock, 
  CheckCircle, Clock, Users, BarChart2, ShieldAlert, Menu,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';

import { 
  getStudyPrograms, 
  getAllPenjadwalanSidang, 
  getAllSidangRegistrations, 
  getAllRuangan, 
  setJadwalSidang, 
  toggleLockJadwal 
} from '../../service/api';

import '../../components/admin/css/penjadwalansidang.css';

export default function PenjadwalanSidang() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });
  
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  
  const [ruanganList, setRuanganList] = useState([]);
  const [prodiList, setProdiList] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
    totalMendaftar: 0,
    siapSidang: 0,
    belumLengkapPenguji: 0,
    periodeAktif: '-'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedProgramStudi, setSelectedProgramStudi] = useState('');
  
  // ==========================================
  // STATE INLINE EDIT (Menggantikan Modal)
  // ==========================================
  const [editingRowId, setEditingRowId] = useState(null); // Menyimpan ID baris yang sedang diedit
  const [editFormData, setEditFormData] = useState({
    tglSidang: '',
    ruanganSidangId: ''
  });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchQuery.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getStudyPrograms()
      .then(res => setProdiList(Array.isArray(res) ? res : []))
      .catch(err => console.error("Gagal load prodi:", err));

    getAllRuangan()
      .then(res => {
        const roomData = res?.data?.data ?? res?.data ?? [];
        setRuanganList(Array.isArray(roomData) ? roomData : []);
      })
      .catch(err => console.error("Gagal load ruangan:", err));
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await getAllSidangRegistrations({ limit: 1000 });
      const allData = res?.data?.data ?? res?.data ?? res ?? [];
      
      if (Array.isArray(allData)) {
        let totalMendaftar = 0;
        let siapSidang = 0;
        let belumLengkap = 0;
        let activePeriodName = '-';
        
        const now = new Date();

        allData.forEach(item => {
          if (item.isDraft === false) {
            totalMendaftar++;
            if (!item.dosenPenguji1 || !item.dosenPenguji2) {
              belumLengkap++;
            }
            if (item.sidangPeriod && item.sidangPeriod.isOpen) {
              const startDate = new Date(item.sidangPeriod.startDate);
              const endDate = new Date(item.sidangPeriod.endDate);
              
              if (now >= startDate && now <= endDate) {
                siapSidang++;
                activePeriodName = item.sidangPeriod.name;
              }
            }
          }
        });

        setDashboardStats({
          totalMendaftar,
          siapSidang,
          belumLengkapPenguji: belumLengkap,
          periodeAktif: activePeriodName !== '-' ? activePeriodName : 'Periode Berjalan'
        });
      }
    } catch (error) {
      console.error("Gagal memuat statistik dashboard:", error);
    }
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    // Tutup mode edit jika berpindah halaman atau me-refresh filter
    setEditingRowId(null); 
    
    try {
      const params = { page, limit: 10 };
      if (searchDebounced) params.search = searchDebounced;
      if (selectedProgramStudi) params.studyProgramId = selectedProgramStudi;

      const res = await getAllPenjadwalanSidang(params);
      
      const resultData = res?.data?.data ?? res?.data ?? [];
      const resultPagination = res?.data?.pagination ?? res?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };
      
      setData(Array.isArray(resultData) ? resultData : []);
      setPagination(resultPagination);
    } catch (error) {
      console.error("Gagal mengambil data penjadwalan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(); 
    fetchData(1);
  }, []);

  useEffect(() => {
    if (searchDebounced !== '' || selectedProgramStudi !== '') {
      fetchData(1);
    }
  }, [searchDebounced, selectedProgramStudi]);

  const chartProdiData = useMemo(() => {
    const prodiMap = {};
    data.forEach(item => {
      if (item.dosenPenguji1 && item.dosenPenguji2) {
        const prodiName = item.mahasiswa?.studyProgram?.name || 'Lainnya';
        prodiMap[prodiName] = (prodiMap[prodiName] || 0) + 1;
      }
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Object.keys(prodiMap).map((key, idx) => ({
      prodi: key,
      jumlah: prodiMap[key],
      color: colors[idx % colors.length]
    })).sort((a, b) => b.jumlah - a.jumlah);
  }, [data]);

  const maxChartValue = chartProdiData.length > 0 ? Math.max(...chartProdiData.map(d => d.jumlah)) : 1;

  // ==========================================
  // HANDLER UNTUK INLINE EDIT
  // ==========================================
  
  // 1. Tombol Set Jadwal diklik -> masuk mode Edit
  const handleEditClick = (item) => {
    setEditingRowId(item.id);
    
    // Konversi format waktu ISO ke format yang bisa dibaca input datetime-local
    let localISOTime = '';
    if (item.tglSidang) {
      const isoDate = new Date(item.tglSidang);
      const tzOffset = isoDate.getTimezoneOffset() * 60000;
      localISOTime = (new Date(isoDate - tzOffset)).toISOString().slice(0, 16);
    }

    setEditFormData({
      tglSidang: localISOTime,
      ruanganSidangId: item.ruanganSidang?.id || ''
    });
  };

  // 2. Tombol Batal diklik
  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  // 3. Tombol Simpan (Ceklis) diklik
  const handleSaveInline = async (id) => {
    if (!editFormData.tglSidang || !editFormData.ruanganSidangId) {
      showAlert('error', 'Validasi Gagal', 'Harap isi Tanggal Sidang dan Ruangan terlebih dahulu!');
      return;
    }

    try {
      await setJadwalSidang(id, { 
        tglSidang: editFormData.tglSidang, 
        ruanganSidangId: editFormData.ruanganSidangId 
      });
      showAlert('success', 'Berhasil', 'Jadwal sidang dan ruangan berhasil disimpan!');
      
      // Keluar dari mode edit & refresh tabel
      setEditingRowId(null);
      fetchData(pagination.page);
    } catch (error) {
      console.error(error);
      showAlert('error', 'Gagal', 'Terjadi kesalahan saat menyimpan jadwal.');
    }
  };

  const handleToggleLock = async (id) => {
    try {
      await toggleLockJadwal(id);
      showAlert('success', 'Berhasil', 'Status kunci penjadwalan berhasil diubah.');
      fetchData(pagination.page);
    } catch (error) {
      console.error(error);
      showAlert('error', 'Gagal', 'Gagal mengubah status kunci.');
    }
  };

  return (
    <div className="ps-page-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="ps-main-content">
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Layanan Penjadwalan</h1>
          </div>

          <div className="content-container">
            <div className="ps-header">
              <div>
                <h2 className="page-title">Penjadwalan Sidang</h2>
                <p className="ps-subtitle">Tentukan dosen penguji, tanggal, dan ruangan sesi sidang mahasiswa.</p>
              </div>
              <div className="ps-alert-box">
                <ShieldAlert size={16} />
                <span>Setelah penguji ditentukan oleh Ketua KK, data dikirim ke Admin untuk penjadwalan akhir.</span>
              </div>
            </div>

            <div className="ps-stats-grid">
              <div className="ps-card">
                <div>
                  <p className="ps-card-label">Total Mendaftar Sidang</p>
                  <h3 className="ps-card-value">{dashboardStats.totalMendaftar}</h3>
                </div>
                <div className="ps-icon-wrapper ps-blue"><Users size={24} /></div>
              </div>
              <div className="ps-card">
                <div>
                  <p className="ps-card-label">Mahasiswa Siap Sidang</p>
                  <h3 className="ps-card-value ps-text-emerald">{dashboardStats.siapSidang}</h3>
                </div>
                <div className="ps-icon-wrapper ps-emerald"><CheckCircle size={24} /></div>
              </div>
              <div className="ps-card">
                <div>
                  <p className="ps-card-label">Belum Lengkap Penguji</p>
                  <h3 className="ps-card-value ps-text-amber">{dashboardStats.belumLengkapPenguji}</h3>
                </div>
                <div className="ps-icon-wrapper ps-amber"><Clock size={24} /></div>
              </div>
            </div>

            <div className="ps-chart-section">
              <div className="ps-chart-header">
                <div className="ps-chart-title-wrapper">
                  <BarChart2 className="ps-text-red" size={20} />
                  <h2>Kontribusi Mahasiswa Siap Sidang per Prodi ({dashboardStats.periodeAktif})</h2>
                </div>
              </div>
              <div className="ps-bar-chart-container">
                {chartProdiData.length > 0 ? chartProdiData.map((item, idx) => {
                  const widthPercent = (item.jumlah / maxChartValue) * 100;
                  return (
                    <div key={idx} className="ps-bar-row">
                      <div className="ps-bar-label">{item.prodi}</div>
                      <div className="ps-bar-track">
                        <div className="ps-bar-fill" style={{ width: `${widthPercent}%`, backgroundColor: item.color }}></div>
                      </div>
                      <div className="ps-bar-value">{item.jumlah} mhs</div>
                    </div>
                  );
                }) : (
                  <p className="ps-text-muted ps-text-xs">Belum ada data mahasiswa untuk ditampilkan pada grafik.</p>
                )}
              </div>
            </div>

            <section className="card-main">
              <div className="card-body">
                <div className="ps-filter-bar">
                  <div className="ps-search-wrapper">
                    <Search className="ps-search-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari nama atau NIM..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-search-input"
                    />
                  </div>
                  <div className="ps-filter-dropdown-wrapper">
                    <Filter size={16} className="ps-filter-icon" />
                    <select 
                      value={selectedProgramStudi}
                      onChange={(e) => setSelectedProgramStudi(e.target.value)}
                      className="ps-dropdown"
                    >
                      <option value="">Semua Prodi</option>
                      {prodiList.map(prodi => (
                        <option key={prodi.id} value={prodi.id}>{prodi.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ps-table-divider" />

                <div className="ps-table-wrap">
                  <table className="ps-table">
                    <thead>
                      <tr>
                        <th>Mahasiswa</th>
                        <th>Dosen Pembimbing</th>
                        <th>Penguji 1</th>
                        <th>Penguji 2</th>
                        <th>Tanggal Sidang</th>
                        <th>Ruangan</th>
                        <th className="ps-text-center">Aksi / Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="7" className="ps-text-center ps-py-6">Memuat data...</td></tr>
                      ) : data.length === 0 ? (
                        <tr><td colSpan="7" className="ps-text-center ps-py-6">Tidak ada data ditemukan.</td></tr>
                      ) : (
                        data.map((item) => {
                          const isPengujiLengkap = item.dosenPenguji1 && item.dosenPenguji2;
                          // Cek apakah baris ini yang sedang ditekan tombol 'Set Jadwal'-nya
                          const isEditing = editingRowId === item.id; 

                          return (
                            <tr key={item.id} className={`ps-table-row ${isEditing ? 'is-editing' : ''}`}>
                              <td>
                                <p className="ps-font-medium">{item.mahasiswa?.name}</p>
                                <p className="ps-text-xs ps-text-muted">{item.mahasiswa?.nim} • {item.mahasiswa?.studyProgram?.name}</p>
                              </td>
                              <td className="ps-text-xs ps-text-muted">
                                <p>1. {item.dosenPembimbing1?.name || '-'}</p>
                                <p>2. {item.dosenPembimbing2?.name || '-'}</p>
                              </td>
                              <td>
                                <span className="ps-text-xs ps-font-medium">
                                  {item.dosenPenguji1?.name || <span className="ps-text-amber italic">Belum dipilih</span>}
                                </span>
                              </td>
                              <td>
                                <span className="ps-text-xs ps-font-medium">
                                  {item.dosenPenguji2?.name || <span className="ps-text-amber italic">Belum dipilih</span>}
                                </span>
                              </td>

                              {/* ========================================================
                                  KOLOM TANGGAL SIDANG (Render Input jika sedang Edit)
                                  ======================================================== */}
                              <td className="ps-text-xs">
                                {isEditing ? (
                                  <input 
                                    type="datetime-local" 
                                    value={editFormData.tglSidang}
                                    onChange={(e) => setEditFormData({...editFormData, tglSidang: e.target.value})}
                                    className="ps-inline-input"
                                    autoFocus // Langsung fokus saat diklik
                                  />
                                ) : (
                                  item.tglSidang ? (
                                    <span className="ps-flex-center-gap ps-text-dark">
                                      <Calendar size={14} className="ps-text-red" />
                                      {new Date(item.tglSidang).toLocaleDateString('id-ID', { 
                                        day: 'numeric', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                      })}
                                    </span>
                                  ) : (
                                    <span className="ps-text-muted italic">- Belum ditentukan</span>
                                  )
                                )}
                              </td>

                              {/* ========================================================
                                  KOLOM RUANGAN (Render Dropdown jika sedang Edit)
                                  ======================================================== */}
                              <td className="ps-text-xs">
                                {isEditing ? (
                                  <select 
                                    value={editFormData.ruanganSidangId}
                                    onChange={(e) => setEditFormData({...editFormData, ruanganSidangId: e.target.value})}
                                    className="ps-inline-input"
                                  >
                                    <option value="" disabled>-- Pilih Ruangan --</option>
                                    {ruanganList.map(ruang => (
                                      <option key={ruang.id} value={ruang.id}>
                                        {ruang.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  item.ruanganSidang?.name ? (
                                    <span className="ps-flex-center-gap ps-text-dark">
                                      <MapPin size={14} className="ps-text-red" />
                                      {item.ruanganSidang.name}
                                    </span>
                                  ) : (
                                    <span className="ps-text-muted italic">- Belum ditentukan</span>
                                  )
                                )}
                              </td>

                              {/* ========================================================
                                  KOLOM AKSI (Tombol berubah menjadi Simpan & Batal jika Edit)
                                  ======================================================== */}
                              <td className="ps-text-center">
                                <div className="ps-action-buttons">
                                  {isEditing ? (
                                    <>
                                      <button 
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="ps-btn-secondary"
                                        title="Batal"
                                      >
                                        <X size={14} />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleSaveInline(item.id)}
                                        className="ps-btn-primary"
                                        title="Simpan Jadwal"
                                      >
                                        <CheckIcon size={14} /> Simpan
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        type="button"
                                        onClick={() => handleEditClick(item)}
                                        className="ps-btn-primary"
                                        disabled={!isPengujiLengkap || item.isLocked}
                                        title={
                                          !isPengujiLengkap ? "Ketua KK belum menentukan penguji" : 
                                          item.isLocked ? "Jadwal terkunci" : "Set Jadwal"
                                        }
                                        style={{ opacity: (!isPengujiLengkap || item.isLocked) ? 0.5 : 1, cursor: (!isPengujiLengkap || item.isLocked) ? 'not-allowed' : 'pointer' }}
                                      >
                                        Set Jadwal
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleToggleLock(item.id)}
                                        className={`ps-btn-lock ${item.isLocked ? 'locked' : 'unlocked'}`}
                                        title={item.isLocked ? "Terkunci (Klik untuk Buka)" : "Terbuka (Klik untuk Kunci)"}
                                      >
                                        {item.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                      </button>
                                    </>
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
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
                    <span className="ps-text-xs ps-text-muted">
                      Halaman {pagination.page} dari {pagination.totalPages}
                    </span>
                    <div className="ps-action-buttons">
                      <button 
                        disabled={pagination.page === 1}
                        onClick={() => fetchData(pagination.page - 1)}
                        className="ps-btn-secondary"
                        style={{ padding: '4px 8px' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => fetchData(pagination.page + 1)}
                        className="ps-btn-secondary"
                        style={{ padding: '4px 8px' }}
                      >
                        <ChevronRight size={16} />
                      </button>
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