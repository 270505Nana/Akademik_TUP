import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Save, Edit3, LayoutPanelLeft, Menu, X, RefreshCw, Calendar, Clock, AlertTriangle, Eye, Plus, Search, Grid, List, Check, FileText, GraduationCap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert  from '../../components/common/CustomAlert';
import { getSidangPeriods, createSidangPeriod, updateSidangPeriod } from '../../service/api';

const toArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

const normalizeDates = (p) => {
  if (!p || typeof p !== 'object') return p;
  return { ...p, startDate: (p.startDate ?? '').slice(0, 10), endDate: (p.endDate ?? '').slice(0, 10) };
};

const unwrapSingle = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data;
  return raw;
};

const getStatus = (start, end) => {
  if (!start || !end) return 'Mendatang';
  const now = new Date();
  const s   = new Date(`${start}T00:00:00`);
  const e   = new Date(`${end}T23:59:59`);
  if (now < s) return 'Mendatang';
  if (now > e) return 'Selesai';
  return 'Aktif';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const getDuration = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 3600 * 24));
};

const AturPeriodeSidang = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periods,     setPeriods]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  const [form, setForm] = useState({ 
    name: '', category: 'pendaftaran sidang', period: '2026/2027', startDate: '', endDate: '' 
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({
    pendaftaran: null, sidang: null
  });

  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  }, []);

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const raw  = await getSidangPeriods();
      const list = toArray(raw);
      setPeriods(list.map(normalizeDates));
    } catch (err) {
      showAlert('error', 'Gagal Memuat', 'Gagal memuat data periode sidang dari server.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  // --- GROUPING LOGIC ---
  const groupedPeriods = useMemo(() => {
    const map = {};
    periods.forEach(p => {
      if (!map[p.period]) map[p.period] = { period: p.period, pendaftaran: null, sidang: null };
      if (p.category === 'pendaftaran sidang') map[p.period].pendaftaran = p;
      if (p.category === 'sidang') map[p.period].sidang = p;
    });
    return Object.values(map).sort((a, b) => {
      const d1 = a.pendaftaran?.startDate || a.sidang?.startDate || '1970-01-01';
      const d2 = b.pendaftaran?.startDate || b.sidang?.startDate || '1970-01-01';
      return new Date(d2) - new Date(d1);
    });
  }, [periods]);

  // Filter Grouped Periods based on Search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedPeriods;
    return groupedPeriods.filter(g => {
      const q = searchQuery.toLowerCase();
      const nameMatch = (g.pendaftaran?.name || g.sidang?.name || '').toLowerCase().includes(q);
      const periodMatch = g.period.toLowerCase().includes(q);
      return nameMatch || periodMatch;
    });
  }, [groupedPeriods, searchQuery]);

  const activeGroup = useMemo(() => {
    if (groupedPeriods.length === 0) return null;
    const active = groupedPeriods.find(g => {
      const pStat = g.pendaftaran ? getStatus(g.pendaftaran.startDate, g.pendaftaran.endDate) : null;
      const sStat = g.sidang ? getStatus(g.sidang.startDate, g.sidang.endDate) : null;
      return pStat === 'Aktif' || sStat === 'Aktif';
    });
    return active || groupedPeriods[0];
  }, [groupedPeriods]);

  // --- HANDLERS ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate || !form.category || !form.period) {
      showAlert('error', 'Validasi', 'Harap lengkapi semua bidang input.'); return;
    }
    if (form.startDate > form.endDate) {
      showAlert('error', 'Validasi', 'Tanggal mulai tidak boleh lebih dari tanggal selesai.'); return;
    }
    if (form.category === 'sidang') {
      const pend = periods.find(p => p.category === 'pendaftaran sidang' && p.period === form.period);
      if (!pend) { showAlert('error', 'Validasi Gagal', `Masa Pendaftaran untuk TA ${form.period} belum ada.`); return; }
      const diffDays = (new Date(form.startDate) - new Date(pend.endDate)) / (1000 * 3600 * 24);
      if (diffDays < 14) { showAlert('error', 'Pelanggaran Aturan', 'Jadwal Sidang wajib berjarak MINIMAL 14 HARI setelah penutupan Pendaftaran.'); return; }
    }
    setSubmitting(true);
    try {
      await createSidangPeriod(form);
      showAlert('success', 'Berhasil', 'Data periode sidang telah berhasil disimpan.');
      setForm({ name: '', category: 'pendaftaran sidang', period: '2026/2027', startDate: '', endDate: '' });
      setIsCreateModalOpen(false);
      fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal menyimpan periode sidang.');
    } finally { setSubmitting(false); }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditForm({
      pendaftaran: group.pendaftaran ? { ...group.pendaftaran, startDate: formatDateForInput(group.pendaftaran.startDate), endDate: formatDateForInput(group.pendaftaran.endDate) } : null,
      sidang: group.sidang ? { ...group.sidang, startDate: formatDateForInput(group.sidang.startDate), endDate: formatDateForInput(group.sidang.endDate) } : null,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editForm.pendaftaran) await updateSidangPeriod(editForm.pendaftaran.id, editForm.pendaftaran);
      if (editForm.sidang) await updateSidangPeriod(editForm.sidang.id, editForm.sidang);
      showAlert('success', 'Berhasil', `Periode TA ${editingGroup.period} telah diperbarui.`);
      setIsEditModalOpen(false);
      fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal memperbarui periode.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', margin: 0, padding: 0 }}>
      <style>{`
        body, html { margin: 0; padding: 0; background: #F8FAFC; font-family: sans-serif; }
        .main-content-area { margin-left: var(--sidebar-width, 260px); width: calc(100% - var(--sidebar-width, 260px)); display: flex; flex-direction: column; min-height: 100vh; }
        
        /* SKALA UI DITURUNKAN KE 80% (0.8) AGAR LEBIH COMPACT */
        .zoom-wrapper { zoom: 0.8; width: 100%; display: flex; flex-direction: column; flex: 1; }
        
        .top-bar-red { width: 100%; box-sizing: border-box; background-color: #C0182A; height: 80px; display: flex; align-items: center; padding: 0 40px; color: white; }
        .content-container { padding: 32px 40px 60px; width: 100%; box-sizing: border-box; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .summary-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; }
        .summary-card.main-active { border: 1px solid #FECACA; background: #FFFAFA; }
        
        .badge-pill { padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; display: inline-flex; alignItems: center; gap: 4px; }
        .bg-green { background: #DCFCE7; color: #166534; }
        .bg-gray { background: #F1F5F9; color: #475569; }
        .bg-blue { background: #DBEAFE; color: #1E40AF; }
        
        .text-blue { color: #2563EB; }
        .text-purple { color: #7C3AED; }

        .btn-add { background: #C0182A; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; display: flex; alignItems: center; gap: 8px; font-size: 14px; }
        .btn-add:hover { background: #9F1222; }

        .filter-bar-container { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px; border-radius: 16px; border: 1px solid #E2E8F0; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .filter-tabs { display: flex; gap: 8px; overflow-x: auto; }
        .filter-btn { padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 600; border: none; background: transparent; color: #64748B; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .filter-btn.active { background: #C0182A; color: #fff; }
        
        .search-view-wrap { display: flex; align-items: center; gap: 12px; }
        .search-box { position: relative; display: flex; align-items: center; }
        .search-box input { padding: 8px 16px 8px 36px; border-radius: 99px; border: 1px solid #E2E8F0; font-size: 13px; outline: none; width: 200px; transition: 0.2s; }
        .search-box input:focus { border-color: #C0182A; width: 240px; }
        .search-icon { position: absolute; left: 12px; color: #94A3B8; }
        .view-toggle { display: flex; background: #F1F5F9; border-radius: 8px; padding: 4px; }
        .view-btn { padding: 6px 10px; border-radius: 6px; border: none; background: transparent; color: #64748B; cursor: pointer; transition: 0.2s; }
        .view-btn.active { background: #fff; color: #C0182A; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        /* PERIOD CARDS GRID */
        .period-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 24px; }
        .period-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: 0.2s; }
        .period-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: #CBD5E1; }
        .period-card.card-active { border: 2px solid #FECACA; background: #FFFAFA; }

        .pc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .pc-toggle { display: flex; alignItems: center; gap: 8px; font-size: 12px; font-weight: 700; color: #64748B; }
        .toggle-switch { width: 36px; height: 20px; border-radius: 20px; background: #E2E8F0; position: relative; cursor: default; }
        .toggle-switch.on { background: #1E293B; }
        .toggle-switch::after { content: ''; position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: 0.2s; }
        .toggle-switch.on::after { left: 19px; }

        .pc-inner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
        .pc-inner-card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: #fff; }
        .pc-inner-card.bg-blue-light { border-color: #BFDBFE; background: #F8FAFC; }
        .pc-inner-card.bg-purple-light { border-color: #E9D5FF; background: #FAF5FF; }

        /* TIMELINE STEPS */
        .timeline-steps { display: flex; align-items: flex-start; justify-content: space-between; margin-top: 24px; position: relative; padding: 16px 20px; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; }
        .tl-line { position: absolute; top: 30px; left: 40px; right: 40px; height: 2px; background: #E2E8F0; z-index: 1; }
        .tl-step { display: flex; flex-direction: column; align-items: center; z-index: 2; gap: 8px; position: relative; }
        .tl-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: #fff; border: 2px solid #E2E8F0; color: #94A3B8; }
        .tl-circle.done { background: #16A34A; border-color: #16A34A; color: #fff; }
        .tl-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
        .tl-date { font-size: 10px; color: #94A3B8; }

        .table-wrap { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #F8FAFC; padding: 16px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; border-bottom: 1px solid #E2E8F0; }
        .data-table td { padding: 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
        .action-btns button { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E2E8F0; background: #fff; color: #64748B; cursor: pointer; display: inline-flex; alignItems: center; justifyContent: center; transition: 0.2s; margin-right: 6px; }
        .action-btns button:hover { border-color: #C0182A; color: #C0182A; background: #FEF2F2; }

        @media (max-width: 991.98px) {
          .main-content-area { margin-left: 0; width: 100%; }
          .zoom-wrapper { zoom: 1; }
          .top-bar-red { display: none; }
          .dashboard-grid { grid-template-columns: 1fr; }
          .period-cards-grid { grid-template-columns: 1fr; }
          .pc-inner-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content-area">
        <div className="mobile-menu-bar" style={{ display: 'none', height: 60, background: '#C0182A', alignItems: 'center', padding: '0 16px', color: '#fff' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#fff' }}><Menu size={24} /></button>
          <span style={{ fontSize: 18, fontWeight: 800, marginLeft: 16 }}>SIMTA</span>
        </div>

        <div className="zoom-wrapper">
          <div className="top-bar-red">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Kelola Periode Sidang</h1>
          </div>

          <div className="content-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 800, color: '#0F172A' }}>Atur Periode & Jadwal Sidang</h2>
                <p style={{ margin: 0, color: '#64748B', fontSize: 15 }}>Konfigurasi terpadu masa pendaftaran mahasiswa dan pelaksanaan sidang.</p>
              </div>
              <button className="btn-add" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} /> Tambah Periode Baru
              </button>
            </div>

            {/* Dashboard Summary Cards */}
            {activeGroup && (
              <div className="dashboard-grid">
                <div className="summary-card main-active">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1 }}>PERIODE AKTIF UTAMA</span>
                    <span className="badge-pill bg-green"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }}/> Aktif</span>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{activeGroup.pendaftaran?.name || activeGroup.sidang?.name || `Tahun Ajaran ${activeGroup.period}`}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Periode sidang Tugas Akhir Telkom University.</p>
                  </div>
                </div>

                <div className="summary-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} className="text-blue" /> MASA PENDAFTARAN
                    </span>
                    {activeGroup.pendaftaran ? (
                       <span className={`badge-pill ${getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate) === 'Aktif' ? 'bg-blue' : 'bg-gray'}`}>
                         {getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate) === 'Aktif' ? 'Buka' : 'Tutup'}
                       </span>
                    ) : <span className="badge-pill bg-gray">-</span>}
                  </div>
                  {activeGroup.pendaftaran ? (
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={18} className="text-blue" /> {formatDate(activeGroup.pendaftaran.startDate)} – {formatDate(activeGroup.pendaftaran.endDate)}
                      </h3>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', background: '#EFF6FF', padding: '4px 8px', borderRadius: 6 }}>Durasi: {getDuration(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate)} Hari</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate) === 'Aktif' ? '#16A34A' : '#64748B' }}>
                          {getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate) === 'Aktif' ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
                        </span>
                      </div>
                    </div>
                  ) : <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>Belum dijadwalkan</p>}
                </div>

                <div className="summary-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} className="text-purple" /> MASA PELAKSANAAN SIDANG
                    </span>
                    {activeGroup.sidang ? (
                       <span className={`badge-pill ${getStatus(activeGroup.sidang.startDate, activeGroup.sidang.endDate) === 'Aktif' ? 'bg-blue' : 'bg-gray'}`}>
                         {getStatus(activeGroup.sidang.startDate, activeGroup.sidang.endDate) === 'Aktif' ? 'Berjalan' : 'Selesai'}
                       </span>
                    ) : <span className="badge-pill bg-gray">-</span>}
                  </div>
                  {activeGroup.sidang ? (
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={18} className="text-purple" /> {formatDate(activeGroup.sidang.startDate)} – {formatDate(activeGroup.sidang.endDate)}
                      </h3>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9333EA', background: '#FAF5FF', padding: '4px 8px', borderRadius: 6 }}>Durasi: {getDuration(activeGroup.sidang.startDate, activeGroup.sidang.endDate)} Hari</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: getStatus(activeGroup.sidang.startDate, activeGroup.sidang.endDate) === 'Aktif' ? '#16A34A' : '#64748B' }}>
                          {getStatus(activeGroup.sidang.startDate, activeGroup.sidang.endDate) === 'Aktif' ? 'Sidang Berjalan' : 'Sidang Selesai'}
                        </span>
                      </div>
                    </div>
                  ) : <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>Belum dijadwalkan</p>}
                </div>
              </div>
            )}

            {/* Filter & View Controls */}
            <div className="filter-bar-container">
              <div className="filter-tabs">
                <button className="filter-btn active">Semua Periode <span style={{ background: '#fff', color: '#C0182A', padding: '2px 6px', borderRadius: 20, marginLeft: 6, fontSize: 11 }}>{filteredGroups.length}</span></button>
                <button className="filter-btn">Aktif Utama <span style={{ background: '#F1F5F9', color: '#64748B', padding: '2px 6px', borderRadius: 20, marginLeft: 6, fontSize: 11 }}>1</span></button>
                <button className="filter-btn">Pendaftaran Dibuka</button>
                <button className="filter-btn">Pelaksanaan Sidang</button>
                <button className="filter-btn">Akan Datang</button>
              </div>
              <div className="search-view-wrap">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input type="text" placeholder="Cari nama periode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="view-toggle">
                  <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={18} /></button>
                  <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                </div>
              </div>
            </div>

            {/* Data Rendering (Grid / List) */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Memuat data...</div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Tidak ada periode yang ditemukan.</div>
            ) : viewMode === 'grid' ? (
              /* --- GRID / CARD VIEW --- */
              <div className="period-cards-grid">
                {filteredGroups.map((group, idx) => {
                  const pStat = group.pendaftaran ? getStatus(group.pendaftaran.startDate, group.pendaftaran.endDate) : null;
                  const sStat = group.sidang ? getStatus(group.sidang.startDate, group.sidang.endDate) : null;
                  const isActive = pStat === 'Aktif' || sStat === 'Aktif';
                  const isDone = pStat === 'Selesai' && sStat === 'Selesai';
                  const mainName = group.pendaftaran?.name || group.sidang?.name || `Tahun Ajaran ${group.period}`;

                  return (
                    <div key={idx} className={`period-card ${isActive ? 'card-active' : ''}`}>
                      <div className="pc-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ background: isActive ? '#C0182A' : '#F1F5F9', color: isActive ? '#fff' : '#475569', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isActive && <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }}/>} 
                            {isActive ? 'Aktif Utama' : isDone ? 'Periode Selesai' : 'Mendatang'}
                          </span>
                        </div>
                        <div className="pc-toggle">
                          {isActive ? 'Aktif' : 'Nonaktif'}
                          <div className={`toggle-switch ${isActive ? 'on' : ''}`} />
                        </div>
                      </div>

                      <h3 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{mainName}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Periode sidang Tugas Akhir Telkom University.</p>

                      <div className="pc-inner-grid">
                        <div className="pc-inner-card bg-blue-light">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} /> MASA PENDAFTARAN</span>
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 4 }}>{pStat || 'Belum Set'}</span>
                          </div>
                          {group.pendaftaran ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 12 }}>{formatDate(group.pendaftaran.startDate)} s/d {formatDate(group.pendaftaran.endDate)}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                                <span style={{ color: '#64748B' }}>Durasi: {getDuration(group.pendaftaran.startDate, group.pendaftaran.endDate)} Hari</span>
                                <span style={{ color: pStat === 'Aktif' ? '#2563EB' : '#64748B' }}>{pStat === 'Aktif' ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup'}</span>
                              </div>
                            </>
                          ) : <div style={{ fontSize: 12, color: '#94A3B8' }}>Belum dikonfigurasi</div>}
                        </div>

                        <div className="pc-inner-card bg-purple-light">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#6B21A8', display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={14} /> MASA SIDANG</span>
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#E9D5FF', color: '#6B21A8', padding: '2px 8px', borderRadius: 4 }}>{sStat || 'Belum Set'}</span>
                          </div>
                          {group.sidang ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 12 }}>{formatDate(group.sidang.startDate)} s/d {formatDate(group.sidang.endDate)}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                                <span style={{ color: '#64748B' }}>Durasi: {getDuration(group.sidang.startDate, group.sidang.endDate)} Hari</span>
                                <span style={{ color: sStat === 'Aktif' ? '#9333EA' : '#64748B' }}>{sStat === 'Aktif' ? 'Sidang berjalan' : 'Sidang selesai'}</span>
                              </div>
                            </>
                          ) : <div style={{ fontSize: 12, color: '#94A3B8' }}>Belum dikonfigurasi</div>}
                        </div>
                      </div>

                      {/* Timeline Alur Sidang */}
                      <div className="timeline-steps">
                        <span style={{ position: 'absolute', right: 16, top: 12, fontSize: 10, fontWeight: 800, color: isActive ? '#C0182A' : '#94A3B8', letterSpacing: 0.5 }}>SELURUH TAHAPAN SIDANG {isDone ? 'SELESAI' : 'AKTIF'}</span>
                        <div className="tl-line" />
                        
                        <div className="tl-step">
                          <div className={`tl-circle ${pStat === 'Selesai' || pStat === 'Aktif' ? 'done' : ''}`}>{pStat === 'Selesai' || pStat === 'Aktif' ? <Check size={16}/> : 1}</div>
                          <span className="tl-label" style={{ color: pStat === 'Selesai' || pStat === 'Aktif' ? '#16A34A' : '' }}>Pendaftaran</span>
                          <span className="tl-date">{group.pendaftaran ? formatDate(group.pendaftaran.startDate).split(' ')[0] + ' ' + formatDate(group.pendaftaran.startDate).split(' ')[1] : '-'}</span>
                        </div>
                        
                        <div className="tl-step">
                          <div className={`tl-circle ${pStat === 'Selesai' ? 'done' : ''}`}>{pStat === 'Selesai' ? <Check size={16}/> : 2}</div>
                          <span className="tl-label" style={{ color: pStat === 'Selesai' ? '#16A34A' : '' }}>Verifikasi</span>
                          <span className="tl-date">{group.pendaftaran ? formatDate(group.pendaftaran.endDate).split(' ')[0] + ' ' + formatDate(group.pendaftaran.endDate).split(' ')[1] : '-'}</span>
                        </div>
                        
                        <div className="tl-step">
                          <div className={`tl-circle ${sStat === 'Selesai' || sStat === 'Aktif' ? 'done' : ''}`}>{sStat === 'Selesai' || sStat === 'Aktif' ? <Check size={16}/> : 3}</div>
                          <span className="tl-label" style={{ color: sStat === 'Selesai' || sStat === 'Aktif' ? '#16A34A' : '' }}>Sidang</span>
                          <span className="tl-date">{group.sidang ? formatDate(group.sidang.startDate).split(' ')[0] + ' ' + formatDate(group.sidang.startDate).split(' ')[1] : '-'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                        <button className="btn-outline" onClick={() => alert('Fitur Detail Mahasiswa akan segera hadir!')}><Eye size={14}/> Detail</button>
                        <button className="btn-outline btn-outline-blue" onClick={() => openEditModal(group)}><Edit3 size={14}/> Edit</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- LIST / TABLE VIEW --- */
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Periode</th>
                      <th>Masa Pendaftaran</th>
                      <th>Masa Pelaksanaan Sidang</th>
                      <th>Status Alur</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group, idx) => {
                      const pStat = group.pendaftaran ? getStatus(group.pendaftaran.startDate, group.pendaftaran.endDate) : null;
                      const sStat = group.sidang ? getStatus(group.sidang.startDate, group.sidang.endDate) : null;
                      const isActive = pStat === 'Aktif' || sStat === 'Aktif';
                      const isDone = pStat === 'Selesai' && sStat === 'Selesai';
                      
                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>Tahun Ajaran {group.period}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>{group.pendaftaran?.name || group.sidang?.name || '-'}</div>
                          </td>
                          <td>
                            {group.pendaftaran ? (
                              <>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{formatDate(group.pendaftaran.startDate)} — {formatDate(group.pendaftaran.endDate)}</div>
                                <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>{getDuration(group.pendaftaran.startDate, group.pendaftaran.endDate)} Hari ({pStat})</div>
                              </>
                            ) : <span style={{ color: '#94A3B8', fontSize: 12 }}>Belum dikonfigurasi</span>}
                          </td>
                          <td>
                            {group.sidang ? (
                              <>
                                <div style={{ fontWeight: 700, color: '#4C1D95', marginBottom: 4 }}>{formatDate(group.sidang.startDate)} — {formatDate(group.sidang.endDate)}</div>
                                <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>{getDuration(group.sidang.startDate, group.sidang.endDate)} Hari ({sStat})</div>
                              </>
                            ) : <span style={{ color: '#94A3B8', fontSize: 12 }}>Belum dikonfigurasi</span>}
                          </td>
                          <td>
                            <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: isActive ? '#DCFCE7' : isDone ? '#F1F5F9' : '#DBEAFE', color: isActive ? '#166534' : isDone ? '#475569' : '#1E40AF' }}>
                              {isActive ? 'Sedang Berjalan' : isDone ? 'Periode Selesai' : 'Mendatang'}
                            </span>
                          </td>
                          <td>
                            <div className="action-btns">
                              <button title="Lihat Detail" onClick={() => alert('Fitur Detail Mahasiswa akan segera hadir!')}><Eye size={16} /></button>
                              <button title="Edit Periode" onClick={() => openEditModal(group)}><Edit3 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CREATE */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div className="modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 550 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Tambah Jadwal Baru</h3>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B"/></button>
              </div>
              <div style={{ padding: 24 }}>
                <form id="createForm" onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>KATEGORI *</label>
                        <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}>
                          <option value="pendaftaran sidang">Pendaftaran Sidang</option>
                          <option value="sidang">Pelaksanaan Sidang</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>TAHUN AJARAN *</label>
                        <select className="form-control" value={form.period} onChange={e => setForm({...form, period: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}>
                          <option value="2025/2026">2025/2026</option>
                          <option value="2026/2027">2026/2027</option>
                          <option value="2027/2028">2027/2028</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>NAMA JUDUL PERIODE *</label>
                      <input type="text" placeholder="Contoh: Semester Ganjil 2026/2027" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>TANGGAL MULAI *</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>TANGGAL SELESAI *</label>
                        <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={e => setForm({...form, endDate: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" form="createForm" disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#C0182A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div className="modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 650 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Jadwal (TA {editingGroup?.period})</h3>
                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B"/></button>
              </div>
              <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto' }}>
                <form id="editGroupForm" onSubmit={handleUpdateGroup}>
                  {editForm.pendaftaran && (
                    <div style={{ marginBottom: 24, padding: 16, border: '1px solid #BFDBFE', borderRadius: 12, background: '#EFF6FF' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16}/> Masa Pendaftaran</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A' }}>TANGGAL MULAI</label>
                          <input type="date" value={editForm.pendaftaran.startDate} onChange={e => setEditForm({...editForm, pendaftaran: {...editForm.pendaftaran, startDate: e.target.value}})} style={{ padding: '8px 12px', border: '1px solid #93C5FD', borderRadius: 6, outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#1E3A8A' }}>TANGGAL SELESAI</label>
                          <input type="date" value={editForm.pendaftaran.endDate} min={editForm.pendaftaran.startDate} onChange={e => setEditForm({...editForm, pendaftaran: {...editForm.pendaftaran, endDate: e.target.value}})} style={{ padding: '8px 12px', border: '1px solid #93C5FD', borderRadius: 6, outline: 'none' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {editForm.sidang && (
                    <div style={{ padding: 16, border: '1px solid #E9D5FF', borderRadius: 12, background: '#FAF5FF' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#6B21A8', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16}/> Masa Pelaksanaan Sidang</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#581C87' }}>TANGGAL MULAI</label>
                          <input type="date" value={editForm.sidang.startDate} onChange={e => setEditForm({...editForm, sidang: {...editForm.sidang, startDate: e.target.value}})} style={{ padding: '8px 12px', border: '1px solid #D8B4FE', borderRadius: 6, outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#581C87' }}>TANGGAL SELESAI</label>
                          <input type="date" value={editForm.sidang.endDate} min={editForm.sidang.startDate} onChange={e => setEditForm({...editForm, sidang: {...editForm.sidang, endDate: e.target.value}})} style={{ padding: '8px 12px', border: '1px solid #D8B4FE', borderRadius: 6, outline: 'none' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" form="editGroupForm" disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#C0182A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} style={{ position: 'fixed', top: 24, right: 24, zIndex: 99999 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} style={{ margin: 0, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AturPeriodeSidang;