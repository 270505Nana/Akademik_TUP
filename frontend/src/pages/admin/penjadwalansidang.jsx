import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Calendar, MapPin, Lock, Unlock, 
  CheckCircle, Clock, Users, BarChart2, ShieldAlert, Menu,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import { getStudyPrograms } from '../../service/api';

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
  
  const [selectedMahasiswa, setSelectedMahasiswa] = useState(null);
  const [tglSidang, setTglSidang] = useState('');
  const [ruanganSidangId, setRuanganSidangId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    fetch('/api/ruangan')
      .then(res => res.json())
      .then(json => {
        if (json.data) setRuanganList(json.data);
      })
      .catch(err => console.error("Gagal load ruangan:", err));
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/sidang-registrations?limit=1000');
      if (response.ok) {
        const json = await response.json();
        const allData = json.data || [];
        
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
          }

          if (item.sidangPeriod) {
            const startDate = new Date(item.sidangPeriod.startDate);
            const endDate = new Date(item.sidangPeriod.endDate);
            
            if (now >= startDate && now <= endDate) {
              siapSidang++;
              activePeriodName = item.sidangPeriod.name;
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
    try {
      const params = new URLSearchParams({ page: page, limit: 10 });
      if (searchDebounced) params.append('search', searchDebounced);
      if (selectedProgramStudi) params.append('studyProgramId', selectedProgramStudi);

      const response = await fetch(`/api/penjadwalan-sidang?${params.toString()}`);
      
      if (response.ok) {
        const json = await response.json();
        setData(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error("Gagal mengambil data dari server:", error);
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

  const handleSetJadwalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMahasiswa) return;

    try {
      const response = await fetch(`/api/penjadwalan-sidang/${selectedMahasiswa.id}/set-jadwal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tglSidang, ruanganSidangId })
      });

      if (response.ok) {
        showAlert('success', 'Berhasil', 'Jadwal sidang dan ruangan berhasil ditetapkan!');
        setIsModalOpen(false);
        fetchData(pagination.page);
      } else {
        showAlert('error', 'Gagal', 'Terjadi kesalahan saat menetapkan jadwal.');
      }
    } catch (error) {
      console.error(error);
      showAlert('error', 'Error Jaringan', 'Server tidak merespon saat menyimpan jadwal.');
    }
  };

  const handleToggleLock = async (id) => {
    try {
      const response = await fetch(`/api/penjadwalan-sidang/${id}/toggle-lock`, {
        method: 'PATCH'
      });

      if (response.ok) {
        showAlert('success', 'Berhasil', 'Status kunci penjadwalan diperbarui.');
        fetchData(pagination.page);
      } else {
        showAlert('error', 'Gagal', 'Gagal mengubah status kunci.');
      }
    } catch (error) {
      console.error(error);
      showAlert('error', 'Error Jaringan', 'Gagal menghubungi server.');
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
                  <p className="ps-text-muted ps-text-xs">Belum ada data mahasiswa siap sidang untuk ditampilkan pada grafik.</p>
                )}
              </div>
            </div>

            {/* Area Tabel Data */}
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
                        data.map((item) => (
                          <tr key={item.id} className="ps-table-row">
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
                            <td className="ps-text-xs">
                              {item.tglSidang ? (
                                <span className="ps-flex-center-gap ps-text-dark">
                                  <Calendar size={14} className="ps-text-red" />
                                  {new Date(item.tglSidang).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              ) : (
                                <span className="ps-text-muted italic">- Belum ditentukan</span>
                              )}
                            </td>
                            <td className="ps-text-xs">
                              {item.ruanganSidang?.name ? (
                                <span className="ps-flex-center-gap ps-text-dark">
                                  <MapPin size={14} className="ps-text-red" />
                                  {item.ruanganSidang.name}
                                </span>
                              ) : (
                                <span className="ps-text-muted italic">- Belum ditentukan</span>
                              )}
                            </td>
                            <td className="ps-text-center">
                              <div className="ps-action-buttons">
                                <button 
                                  onClick={() => {
                                    setSelectedMahasiswa(item);
                                    setTglSidang(item.tglSidang ? item.tglSidang.split('T')[0] : '');
                                    setRuanganSidangId(item.ruanganSidang?.id || '');
                                    setIsModalOpen(true);
                                  }}
                                  className="ps-btn-primary"
                                  disabled={!item.dosenPenguji1 || !item.dosenPenguji2}
                                  title={(!item.dosenPenguji1 || !item.dosenPenguji2) ? "Ketua KK belum menentukan penguji" : "Set Jadwal & Ruangan"}
                                >
                                  Set Jadwal
                                </button>
                                <button 
                                  onClick={() => handleToggleLock(item.id)}
                                  className={`ps-btn-lock ${item.isLocked ? 'locked' : 'unlocked'}`}
                                  title={item.isLocked ? "Terkunci (Klik untuk Unlock)" : "Terbuka (Klik untuk Lock)"}
                                >
                                  {item.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
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
        {isModalOpen && (
          <div className="ps-modal-backdrop">
            <motion.div 
              className="ps-modal-card"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              <h3 className="ps-modal-title">Tentukan Jadwal Sidang</h3>
              <p className="ps-modal-subtitle">Mahasiswa: <span className="ps-font-semibold">{selectedMahasiswa?.mahasiswa?.name}</span></p>
              
              <form onSubmit={handleSetJadwalSubmit} className="ps-form">
                <div>
                  <label className="ps-label">Tanggal Sidang</label>
                  <input 
                    type="date" 
                    value={tglSidang}
                    onChange={(e) => setTglSidang(e.target.value)}
                    required
                    className="ps-input"
                  />
                </div>
                <div>
                  <label className="ps-label">Pilih Ruangan</label>
                  <select 
                    value={ruanganSidangId}
                    onChange={(e) => setRuanganSidangId(e.target.value)}
                    required
                    className="ps-input"
                  >
                    <option value="" disabled>-- Pilih Ruangan Sidang --</option>
                    {ruanganList.map(ruang => (
                      <option key={ruang.id} value={ruang.id}>
                        {ruang.name} {ruang.gedung ? `(${ruang.gedung})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ps-modal-actions">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="ps-btn-secondary">
                    Batal
                  </button>
                  <button type="submit" className="ps-btn-primary">
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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