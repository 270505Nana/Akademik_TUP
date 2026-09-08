import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Save, Edit3, LayoutPanelLeft, Menu, X, RefreshCw, Calendar, Clock, AlertTriangle, Eye, Plus, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert  from '../../components/common/CustomAlert';
import { getYudisiumPeriods, createYudisiumPeriod, updateYudisiumPeriod } from '../../service/api';

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

const getStatus = (start, end, isOpen) => {
  if (!start || !end) return null;
  const now = new Date();
  const s   = new Date(`${start}T00:00:00`);
  const e   = new Date(`${end}T23:59:59`);
  
  if (now < s) return 'Mendatang';
  if (now > e) return 'Selesai';
  return isOpen ? 'Aktif' : 'Nonaktif';
};

const checkGroupStatus = (group) => {
  if (!group) return { isActive: false, isDone: false };
  const hasOpenToggle = group.pendaftaran?.isOpen || group.yudisium?.isOpen;
  
  let s = null;
  let e = null;
  
  if (group.pendaftaran) {
    s = new Date(`${group.pendaftaran.startDate}T00:00:00`);
    e = new Date(`${group.pendaftaran.endDate}T23:59:59`);
  }
  if (group.yudisium) {
    const ys = new Date(`${group.yudisium.startDate}T00:00:00`);
    const ye = new Date(`${group.yudisium.endDate}T23:59:59`);
    if (!s || ys < s) s = ys;
    if (!e || ye > e) e = ye;
  }
  
  if (!s || !e) return { isActive: false, isDone: false };
  
  const now = new Date();
  const isTimeActive = now >= s && now <= e;
  const isDone = now > e;
  
  return {
    isActive: hasOpenToggle && isTimeActive,
    isDone: isDone
  };
};

const getBadgeProps = (stat, type) => {
  if (!stat) return { text: '-', bg: 'bg-gray' };
  if (stat === 'Aktif') return { text: type === 'pend' ? 'Buka' : 'Berjalan', bg: 'bg-blue' };
  if (stat === 'Mendatang') return { text: 'Mendatang', bg: 'bg-gray' };
  if (stat === 'Selesai') return { text: type === 'pend' ? 'Tutup' : 'Selesai', bg: 'bg-red' };
  return { text: 'Nonaktif', bg: 'bg-red' };
};

const getStatusTextProps = (stat, type) => {
  if (!stat) return { text: 'Belum dijadwalkan', color: '#94A3B8' };
  if (stat === 'Aktif') return { text: type === 'pend' ? 'Pendaftaran Dibuka' : 'Yudisium Berjalan', color: '#16A34A' };
  if (stat === 'Mendatang') return { text: type === 'pend' ? 'Pendaftaran Mendatang' : 'Yudisium Mendatang', color: '#64748B' };
  if (stat === 'Selesai') return { text: type === 'pend' ? 'Pendaftaran Ditutup' : 'Yudisium Selesai', color: '#991B1B' };
  return { text: 'Nonaktif', color: '#991B1B' };
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

const AturPeriodeYudisium = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periods,     setPeriods]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua Periode');
  
  const [form, setForm] = useState({ 
    name: '', category: 'pendaftaran yudisium', period: '', startDate: '', endDate: '' 
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({ pendaftaran: null, yudisium: null });
  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  }, []);

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const raw  = await getYudisiumPeriods();
      const list = toArray(raw);
      setPeriods(list.map(normalizeDates));
    } catch (err) {
      showAlert('error', 'Gagal Memuat', 'Gagal memuat data periode yudisium dari server.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  const groupedPeriods = useMemo(() => {
    const map = {};
    periods.forEach(p => {
      const nameLower = p.name.toLowerCase();
      const semester = nameLower.includes('genap') ? 'Genap' : (nameLower.includes('ganjil') ? 'Ganjil' : 'Umum');
      const groupKey = `${p.period}-${semester}`;

      if (!map[groupKey]) {
        map[groupKey] = { id: groupKey, period: p.period, semester, pendaftaran: null, yudisium: null };
      }
      
      if (p.category === 'pendaftaran yudisium') map[groupKey].pendaftaran = p;
      if (p.category === 'yudisium') map[groupKey].yudisium = p;
    });

    return Object.values(map).sort((a, b) => {
      const d1 = a.pendaftaran?.startDate || a.yudisium?.startDate || '1970-01-01';
      const d2 = b.pendaftaran?.startDate || b.yudisium?.startDate || '1970-01-01';
      return new Date(d2) - new Date(d1);
    });
  }, [periods]);

  const filteredGroups = useMemo(() => {
    let result = groupedPeriods;

    if (activeFilter === 'Periode Aktif') {
      result = result.filter(g => checkGroupStatus(g).isActive);
    } else if (activeFilter === 'Pendaftaran Dibuka') {
      result = result.filter(g => g.pendaftaran && getStatus(g.pendaftaran.startDate, g.pendaftaran.endDate, g.pendaftaran.isOpen) === 'Aktif');
    } else if (activeFilter === 'Pelaksanaan Yudisium') {
      result = result.filter(g => g.yudisium && getStatus(g.yudisium.startDate, g.yudisium.endDate, g.yudisium.isOpen) === 'Aktif');
    } else if (activeFilter === 'Akan Datang') {
      result = result.filter(g => {
        const { isActive, isDone } = checkGroupStatus(g);
        return !isActive && !isDone;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => {
        const nameMatch = (g.pendaftaran?.name || g.yudisium?.name || '').toLowerCase().includes(q);
        const periodMatch = g.period.toLowerCase().includes(q);
        return nameMatch || periodMatch;
      });
    }

    return result;
  }, [groupedPeriods, searchQuery, activeFilter]);

  const activeGroup = useMemo(() => {
    if (groupedPeriods.length === 0) return null;
    const trulyActive = groupedPeriods.find(g => checkGroupStatus(g).isActive);
    if (trulyActive) return trulyActive;
    const anyOpen = groupedPeriods.find(g => g.pendaftaran?.isOpen || g.yudisium?.isOpen);
    if (anyOpen) return anyOpen;
    return groupedPeriods[0];
  }, [groupedPeriods]);

  const { isActive: isActiveMain, isDone: isDoneMain } = checkGroupStatus(activeGroup);

  const pStatMain = activeGroup?.pendaftaran ? getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate, activeGroup.pendaftaran.isOpen) : null;
  const yStatMain = activeGroup?.yudisium ? getStatus(activeGroup.yudisium.startDate, activeGroup.yudisium.endDate, activeGroup.yudisium.isOpen) : null;

  const badgePendMain = getBadgeProps(pStatMain, 'pend');
  const badgeYudisiumMain = getBadgeProps(yStatMain, 'yudisium');
  const textPendMain = getStatusTextProps(pStatMain, 'pend');
  const textYudisiumMain = getStatusTextProps(yStatMain, 'yudisium');

  const validateDates = (start, end) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (s === e) return "Tanggal selesai tidak boleh sama persis dengan tanggal mulai.";
    if (e < s) return "Tanggal selesai tidak boleh mundur (sebelum tanggal mulai).";
    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate || !form.category || !form.period.trim()) {
      showAlert('error', 'Validasi', 'Harap lengkapi semua bidang input.'); return;
    }
    
    const dateError = validateDates(form.startDate, form.endDate);
    if (dateError) { showAlert('error', 'Validasi Tanggal', dateError); return; }

    if (form.category === 'yudisium') {
      const pend = periods.find(p => p.category === 'pendaftaran yudisium' && p.period === form.period && p.name === form.name);

      if (!pend) { 
        showAlert('error', 'Validasi Gagal', `Data Pendaftaran Yudisium rujukan tidak valid atau tidak ditemukan.`); 
        return; 
      }
      
      const pendEndDate = new Date(pend.endDate).getTime();
      const yudisiumStartDate = new Date(form.startDate).getTime();
      const diffDays = (yudisiumStartDate - pendEndDate) / (1000 * 3600 * 24);
      
      if (diffDays < 14) { 
        showAlert('error', 'Pelanggaran Aturan', `Jadwal Pelaksanaan Yudisium wajib berjarak MINIMAL 14 HARI setelah penutupan Pendaftaran (${formatDate(pend.endDate)}).`); 
        return; 
      }
    }

    setSubmitting(true);
    try {
      const startObj = new Date(`${form.startDate}T00:00:00.000Z`);
      const endObj = new Date(`${form.endDate}T23:59:59.000Z`);
      const now = new Date();
      const autoOpen = now >= startObj && now <= endObj;

      await createYudisiumPeriod({
        name: form.name,
        category: form.category,
        period: form.period,
        startDate: startObj.toISOString(),
        endDate: endObj.toISOString(),
        isOpen: autoOpen
      });
      
      showAlert('success', 'Berhasil', 'Data periode yudisium telah berhasil disimpan.');
      setForm({ name: '', category: 'pendaftaran yudisium', period: '', startDate: '', endDate: '' });
      setIsCreateModalOpen(false);
      fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal menyimpan periode yudisium.');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (group, isActive) => {
    const newStatus = !isActive;
    try {
      if (group.pendaftaran) {
        await updateYudisiumPeriod(group.pendaftaran.id, {
          ...group.pendaftaran, 
          startDate: new Date(`${group.pendaftaran.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${group.pendaftaran.endDate}T00:00:00.000Z`).toISOString(),
          isOpen: newStatus 
        });
      }
      if (group.yudisium) {
        await updateYudisiumPeriod(group.yudisium.id, {
          ...group.yudisium, 
          startDate: new Date(`${group.yudisium.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${group.yudisium.endDate}T00:00:00.000Z`).toISOString(),
          isOpen: newStatus 
        });
      }
      fetchPeriods();
      showAlert('success', 'Berhasil', `Status Periode TA ${group.period} diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`);
    } catch (err) {
      showAlert('error', 'Gagal', 'Gagal mengubah status periode.');
    }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditForm({
      pendaftaran: group.pendaftaran ? { ...group.pendaftaran, startDate: formatDateForInput(group.pendaftaran.startDate), endDate: formatDateForInput(group.pendaftaran.endDate) } : null,
      yudisium: group.yudisium ? { ...group.yudisium, startDate: formatDateForInput(group.yudisium.startDate), endDate: formatDateForInput(group.yudisium.endDate) } : null,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();

    if (editForm.pendaftaran) {
      const pErr = validateDates(editForm.pendaftaran.startDate, editForm.pendaftaran.endDate);
      if (pErr) { showAlert('error', 'Validasi Pendaftaran', pErr); return; }
    }
    if (editForm.yudisium) {
      const yErr = validateDates(editForm.yudisium.startDate, editForm.yudisium.endDate);
      if (yErr) { showAlert('error', 'Validasi Yudisium', yErr); return; }
    }

    if (editForm.pendaftaran && editForm.yudisium) {
      const pEnd = new Date(editForm.pendaftaran.endDate).getTime();
      const yStart = new Date(editForm.yudisium.startDate).getTime();
      const diffDays = (yStart - pEnd) / (1000 * 3600 * 24);
      
      if (diffDays < 14) {
        showAlert('error', 'Pelanggaran Aturan', 'Masa Pelaksanaan Yudisium wajib berjarak MINIMAL 14 HARI setelah masa pendaftaran ditutup.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editForm.pendaftaran) {
        await updateYudisiumPeriod(editForm.pendaftaran.id, {
          ...editForm.pendaftaran,
          startDate: new Date(`${editForm.pendaftaran.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${editForm.pendaftaran.endDate}T00:00:00.000Z`).toISOString()
        });
      }
      if (editForm.yudisium) {
        await updateYudisiumPeriod(editForm.yudisium.id, {
          ...editForm.yudisium,
          startDate: new Date(`${editForm.yudisium.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${editForm.yudisium.endDate}T00:00:00.000Z`).toISOString()
        });
      }
      showAlert('success', 'Berhasil', `Periode TA ${editingGroup.period} telah diperbarui.`);
      setIsEditModalOpen(false);
      fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal memperbarui periode.');
    } finally { setSubmitting(false); }
  };

  const availableGroupsForYudisium = groupedPeriods.filter(g => g.pendaftaran && !g.yudisium);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', margin: 0, padding: 0 }}>
      <style>{`
        body, html { margin: 0; padding: 0; background-color: #F8FAFC; }
        .main-content-area { margin-left: var(--sidebar-width, 260px); width: calc(100% - var(--sidebar-width, 260px)); display: flex; flex-direction: column; min-height: 100vh; }
        .zoom-wrapper { zoom: 0.8; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .top-bar-red { width: 100%; box-sizing: border-box; background-color: #C0182A; height: 80px; display: flex; align-items: center; padding: 0 40px; color: white; }
        .content-container { padding: 32px 40px 60px; width: 100%; box-sizing: border-box; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .summary-card { background-color: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; }
        .summary-card.main-active { position: relative; overflow: hidden; background-color: #fff; border: 1px solid #E2E8F0; }
        .summary-card.main-active::before { content: ''; position: absolute; top: -60px; right: -40px; width: 180px; height: 180px; background-color: #FFF1F2; border-radius: 50%; z-index: 0; }
        .summary-card.main-active > div { position: relative; z-index: 1; }

        .badge-pill { padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }
        .bg-green { background-color: #DCFCE7; color: #166534; }
        .bg-gray { background-color: #F1F5F9; color: #475569; }
        .bg-blue { background-color: #DBEAFE; color: #1E40AF; }
        .bg-red { background-color: #FEE2E2; color: #991B1B; }

        .btn-add { background-color: #C0182A; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .btn-add:hover { background-color: #9F1222; }

        .filter-bar-container { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 12px; border-radius: 16px; border: 1px solid #E2E8F0; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .filter-tabs { display: flex; gap: 8px; overflow-x: auto; }
        .filter-btn { padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 600; border: none; background-color: transparent; color: #64748B; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .filter-btn.active { background-color: #C0182A; color: #fff; }
        
        .search-view-wrap { display: flex; align-items: center; gap: 12px; }
        .search-box { position: relative; display: flex; align-items: center; }
        .search-box input { padding: 8px 16px 8px 36px; border-radius: 99px; border: 1px solid #E2E8F0; font-size: 13px; outline: none; width: 200px; transition: 0.2s; }
        .search-box input:focus { border-color: #C0182A; width: 240px; }
        .search-icon { position: absolute; left: 12px; color: #94A3B8; }

        .pc-toggle { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #64748B; cursor: pointer; }
        .toggle-switch { width: 36px; height: 20px; border-radius: 20px; background-color: #E2E8F0; position: relative; transition: 0.3s; }
        .toggle-switch.on { background-color: #1E293B; }
        .toggle-switch::after { content: ''; position: absolute; width: 14px; height: 14px; background-color: #fff; border-radius: 50%; top: 3px; left: 3px; transition: 0.2s; }
        .toggle-switch.on::after { left: 19px; }

        .table-wrap { background-color: #fff; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background-color: #F8FAFC; padding: 16px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; border-bottom: 1px solid #E2E8F0; }
        .data-table td { padding: 16px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #1E293B; vertical-align: middle; }
        .action-btns { display: flex; gap: 8px; align-items: center; }
        .action-btns button { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #CBD5E1; background-color: #fff; color: #475569; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: 0.2s; padding: 0; margin: 0; }
        .action-btns button:hover { border-color: #C0182A; color: #C0182A; background-color: #FEF2F2; }

        @media (max-width: 991.98px) {
          .main-content-area { margin-left: 0; width: 100%; }
          .zoom-wrapper { zoom: 1; }
          .top-bar-red { display: none; }
          .dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content-area">
        <div className="mobile-menu-bar" style={{ display: 'none', height: 60, backgroundColor: '#C0182A', alignItems: 'center', padding: '0 16px', color: '#fff' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ backgroundColor: 'transparent', border: 'none', color: '#fff' }}><Menu size={24} /></button>
          <span style={{ fontSize: 18, fontWeight: 800, marginLeft: 16 }}>SIMTA</span>
        </div>

        <div className="zoom-wrapper">
          <div className="top-bar-red">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Kelola Periode Yudisium</h1>
          </div>

          <div className="content-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 800, color: '#0F172A' }}>Atur Periode & Jadwal Yudisium</h2>
                <p style={{ margin: 0, color: '#64748B', fontSize: 15 }}>Konfigurasi terpadu masa pendaftaran mahasiswa dan pelaksanaan yudisium.</p>
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
                    <span className={`badge-pill ${isActiveMain ? 'bg-green' : (isDoneMain ? 'bg-gray' : 'bg-red')}`}>
                      {isActiveMain && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A', marginRight: 4 }}/>} 
                      {isActiveMain ? 'Aktif' : isDoneMain ? 'Selesai' : 'Mendatang/Nonaktif'}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                      {activeGroup.semester !== 'Umum' ? `Semester ${activeGroup.semester} ${activeGroup.period}` : (activeGroup.pendaftaran?.name || activeGroup.yudisium?.name || `Tahun Ajaran ${activeGroup.period}`)}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Periode yudisium Tugas Akhir Telkom University.</p>
                  </div>
                </div>

                <div className="summary-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1 }}>MASA PENDAFTARAN</span>
                    <span className={`badge-pill ${pStatMain === 'Aktif' ? 'bg-blue' : (pStatMain === 'Mendatang' ? 'bg-gray' : 'bg-red')}`}>
                      {pStatMain === 'Aktif' ? 'Buka' : (pStatMain === 'Mendatang' ? 'Mendatang' : 'Tutup')}
                    </span>
                  </div>
                  {activeGroup.pendaftaran ? (
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
                        {formatDate(activeGroup.pendaftaran.startDate)} – {formatDate(activeGroup.pendaftaran.endDate)}
                      </h3>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: 6 }}>Durasi: {getDuration(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate)} Hari</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pStatMain === 'Aktif' ? '#16A34A' : (pStatMain === 'Mendatang' ? '#64748B' : '#991B1B') }}>
                          {pStatMain === 'Aktif' ? 'Pendaftaran Dibuka' : (pStatMain === 'Mendatang' ? 'Pendaftaran Mendatang' : 'Pendaftaran Ditutup')}
                        </span>
                      </div>
                    </div>
                  ) : <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>Belum dijadwalkan</p>}
                </div>

                <div className="summary-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1 }}>MASA PELAKSANAAN YUDISIUM</span>
                    <span className={`badge-pill ${yStatMain === 'Aktif' ? 'bg-blue' : (yStatMain === 'Mendatang' ? 'bg-gray' : 'bg-red')}`}>
                      {yStatMain === 'Aktif' ? 'Berjalan' : (yStatMain === 'Mendatang' ? 'Mendatang' : 'Selesai')}
                    </span>
                  </div>
                  {activeGroup.yudisium ? (
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
                        {formatDate(activeGroup.yudisium.startDate)} – {formatDate(activeGroup.yudisium.endDate)}
                      </h3>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9333EA', backgroundColor: '#FAF5FF', padding: '4px 8px', borderRadius: 6 }}>Durasi: {getDuration(activeGroup.yudisium.startDate, activeGroup.yudisium.endDate)} Hari</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: yStatMain === 'Aktif' ? '#16A34A' : (yStatMain === 'Mendatang' ? '#64748B' : '#991B1B') }}>
                          {yStatMain === 'Aktif' ? 'Yudisium Berjalan' : (yStatMain === 'Mendatang' ? 'Yudisium Mendatang' : 'Yudisium Selesai')}
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
                <button className={`filter-btn ${activeFilter === 'Semua Periode' ? 'active' : ''}`} onClick={() => setActiveFilter('Semua Periode')}>
                  Semua Periode <span style={{ backgroundColor: activeFilter === 'Semua Periode' ? '#fff' : '#F1F5F9', color: activeFilter === 'Semua Periode' ? '#C0182A' : '#64748B', padding: '2px 6px', borderRadius: 20, marginLeft: 6, fontSize: 11 }}>{groupedPeriods.length}</span>
                </button>
                <button className={`filter-btn ${activeFilter === 'Periode Aktif' ? 'active' : ''}`} onClick={() => setActiveFilter('Periode Aktif')}>Periode Aktif</button>
                <button className={`filter-btn ${activeFilter === 'Pendaftaran Dibuka' ? 'active' : ''}`} onClick={() => setActiveFilter('Pendaftaran Dibuka')}>Pendaftaran Dibuka</button>
                <button className={`filter-btn ${activeFilter === 'Pelaksanaan Yudisium' ? 'active' : ''}`} onClick={() => setActiveFilter('Pelaksanaan Yudisium')}>Pelaksanaan Yudisium</button>
                <button className={`filter-btn ${activeFilter === 'Akan Datang' ? 'active' : ''}`} onClick={() => setActiveFilter('Akan Datang')}>Akan Datang</button>
              </div>
              <div className="search-view-wrap">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input type="text" placeholder="Cari nama periode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Data Rendering */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Memuat data...</div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Tidak ada periode yang ditemukan.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Periode</th>
                      <th>Masa Pendaftaran</th>
                      <th>Masa Pelaksanaan Yudisium</th>
                      <th>Status Alur</th>
                      <th>Aktif</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group, idx) => {
                      const { isActive, isDone } = checkGroupStatus(group);
                      const pStat = group.pendaftaran ? getStatus(group.pendaftaran.startDate, group.pendaftaran.endDate, group.pendaftaran.isOpen) : null;
                      const yStat = group.yudisium ? getStatus(group.yudisium.startDate, group.yudisium.endDate, group.yudisium.isOpen) : null;
                      
                      const mainName = group.semester !== 'Umum' ? `Semester ${group.semester} ${group.period}` : (group.pendaftaran?.name || group.yudisium?.name || `Tahun Ajaran ${group.period}`);
                      
                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 4 }}>{mainName}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>Tahun Ajaran {group.period}</div>
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
                            {group.yudisium ? (
                              <>
                                <div style={{ fontWeight: 700, color: '#4C1D95', marginBottom: 4 }}>{formatDate(group.yudisium.startDate)} — {formatDate(group.yudisium.endDate)}</div>
                                <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>{getDuration(group.yudisium.startDate, group.yudisium.endDate)} Hari ({yStat})</div>
                              </>
                            ) : <span style={{ color: '#94A3B8', fontSize: 12 }}>Belum dikonfigurasi</span>}
                          </td>
                          <td>
                            <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, backgroundColor: isActive ? '#DCFCE7' : isDone ? '#F1F5F9' : '#DBEAFE', color: isActive ? '#166534' : isDone ? '#475569' : '#1E40AF' }}>
                              {isActive ? 'Sedang Berjalan' : isDone ? 'Periode Selesai' : 'Mendatang'}
                            </span>
                          </td>
                          <td>
                            <div className="pc-toggle" style={{ justifyContent: 'flex-start' }} onClick={() => handleToggleActive(group, isActive)}>
                              <div className={`toggle-switch ${isActive ? 'on' : ''}`} />
                            </div>
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

      {/* MODAL CREATE OTOMATIS */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div className="modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 550 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Tambah Jadwal Baru</h3>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B"/></button>
              </div>
              <div style={{ padding: 24 }}>
                <form id="createForm" onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>KATEGORI *</label>
                      <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value, name: '', period: ''})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}>
                        <option value="pendaftaran yudisium">Pendaftaran Yudisium</option>
                        <option value="yudisium">Pelaksanaan Yudisium</option>
                      </select>
                    </div>

                    {form.category === 'pendaftaran yudisium' ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>TAHUN AJARAN *</label>
                          <input type="text" placeholder="Contoh: 2026/2027" value={form.period} onChange={e => setForm({...form, period: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>NAMA JUDUL PERIODE *</label>
                          <input type="text" placeholder="Contoh: Semester Ganjil 2026/2027" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }} />
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>PILIH MASA PENDAFTARAN REFERENSI *</label>
                        {availableGroupsForYudisium.length > 0 ? (
                          <select className="form-control" onChange={e => {
                              const sel = availableGroupsForYudisium.find(g => g.id === e.target.value);
                              if (sel) setForm({...form, name: sel.pendaftaran.name, period: sel.period});
                            }} style={{ padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}>
                            <option value="">-- Silakan Pilih --</option>
                            {availableGroupsForYudisium.map(g => (
                              <option key={g.id} value={g.id}>{g.pendaftaran.name} (TA {g.period})</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #FECACA' }}>
                            Semua Pendaftaran sudah memiliki jadwal Yudisium, atau belum ada Pendaftaran sama sekali. Buat "Pendaftaran Yudisium" baru terlebih dahulu!
                          </div>
                        )}
                      </div>
                    )}

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
              <div style={{ padding: '16px 24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#fff', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" form="createForm" disabled={submitting || (form.category === 'yudisium' && availableGroupsForYudisium.length === 0)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: (form.category === 'yudisium' && availableGroupsForYudisium.length === 0) ? '#94A3B8' : '#C0182A', color: '#fff', fontWeight: 700, cursor: (form.category === 'yudisium' && availableGroupsForYudisium.length === 0) ? 'not-allowed' : 'pointer' }}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div className="modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 650 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Jadwal (TA {editingGroup?.period})</h3>
                <button onClick={() => setIsEditModalOpen(false)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B"/></button>
              </div>
              <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto' }}>
                <form id="editGroupForm" onSubmit={handleUpdateGroup}>
                  {editForm.pendaftaran && (
                    <div style={{ marginBottom: 24, padding: 16, border: '1px solid #BFDBFE', borderRadius: 12, backgroundColor: '#EFF6FF' }}>
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
                  {editForm.yudisium && (
                    <div style={{ padding: 16, border: '1px solid #E9D5FF', borderRadius: 12, backgroundColor: '#FAF5FF' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#6B21A8', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16}/> Masa Pelaksanaan Yudisium</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#581C87' }}>TANGGAL MULAI</label>
                          <input type="date" value={editForm.yudisium.startDate} onChange={e => setEditForm({...editForm, yudisium: {...editForm.yudisium, startDate: e.target.value}})} style={{ padding: '8px 12px', border: '1px solid #D8B4FE', borderRadius: 6, outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#581C87' }}>TANGGAL SELESAI</label>
                          <input type="date" value={editForm.yudisium.endDate} min={editForm.yudisium.startDate} onChange={e => setEditForm({...editForm, yudisium: {...editForm.yudisium, endDate: e.target.value}})} style={{ padding: '8px 12px', border: '1px solid #D8B4FE', borderRadius: 6, outline: 'none' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <div style={{ padding: '16px 24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#fff', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button type="submit" form="editGroupForm" disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#C0182A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
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

export default AturPeriodeYudisium;