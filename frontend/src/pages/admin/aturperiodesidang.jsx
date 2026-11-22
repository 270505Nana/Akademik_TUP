import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Save, Edit3, LayoutPanelLeft, Menu, X, RefreshCw, Calendar, Clock, AlertTriangle, Eye, Plus, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert  from '../../components/common/CustomAlert';
import { getSidangPeriods, createSidangPeriod, updateSidangPeriod } from '../../service/api';
import '../../style/css/admin/aturperiode.css';

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
  const hasOpenToggle = group.pendaftaran?.isOpen || group.sidang?.isOpen;
  
  let s = null;
  let e = null;
  
  if (group.pendaftaran) {
    s = new Date(`${group.pendaftaran.startDate}T00:00:00`);
    e = new Date(`${group.pendaftaran.endDate}T23:59:59`);
  }
  if (group.sidang) {
    const ss = new Date(`${group.sidang.startDate}T00:00:00`);
    const se = new Date(`${group.sidang.endDate}T23:59:59`);
    if (!s || ss < s) s = ss;
    if (!e || se > e) e = se;
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

const getStatusTextProps = (stat, type) => {
  if (!stat) return { text: 'Belum dijadwalkan', className: 'aps-status-text-muted' };
  if (stat === 'Aktif') return { text: type === 'pend' ? 'Pendaftaran Dibuka' : 'Sidang Berjalan', className: 'aps-status-text-green' };
  if (stat === 'Mendatang') return { text: type === 'pend' ? 'Pendaftaran Mendatang' : 'Sidang Mendatang', className: 'aps-status-text-muted' };
  if (stat === 'Selesai') return { text: type === 'pend' ? 'Pendaftaran Ditutup' : 'Sidang Selesai', className: 'aps-status-text-red' };
  return { text: 'Nonaktif', className: 'aps-status-text-red' };
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

const getDisplayPeriodName = (group) => {
  if (!group) return '-';
  const customName = (group.pendaftaran?.name || group.sidang?.name || '').trim();
  if (customName) return customName;
  if (group.semester && group.semester !== 'Umum') {
    return `Semester ${group.semester} ${group.period}`;
  }
  return `Tahun Ajaran ${group.period || ''}`;
};

const AturPeriodeSidang = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periods,     setPeriods]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua Periode');
  
  const [form, setForm] = useState({ 
    name: '', category: 'pendaftaran', period: '', startDate: '', endDate: '' 
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', pendaftaran: null, sidang: null });
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
      
      const flatList = [];
      list.forEach((item) => {
        if (!item) return;
        if ('pendaftaran' in item || 'pelaksanaan' in item) {
          if (item.pendaftaran) flatList.push(normalizeDates(item.pendaftaran));
          if (item.pelaksanaan) flatList.push(normalizeDates(item.pelaksanaan));
        } else {
          flatList.push(normalizeDates(item));
        }
      });

      setPeriods(flatList);
    } catch (err) {
      showAlert('error', 'Gagal Memuat', 'Gagal memuat data periode sidang dari server.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  const groupedPeriods = useMemo(() => {
    const map = {};
    periods.forEach(p => {
      if (!p) return;
      const nameLower = (p.name || '').toLowerCase();
      const semester = nameLower.includes('genap') ? 'Genap' : (nameLower.includes('ganjil') ? 'Ganjil' : 'Umum');
      const periodVal = p.period || '';
      const normalizedNameKey = (p.name || '').trim().toLowerCase();
      const groupKey = normalizedNameKey ? `${periodVal}-${normalizedNameKey}` : `${periodVal}-${semester}`;

      if (!map[groupKey]) {
        map[groupKey] = { id: groupKey, period: periodVal, semester, pendaftaran: null, sidang: null };
      }
      
      const catLower = (p.category || '').toLowerCase();
      if (catLower.includes('pendaftaran')) {
        map[groupKey].pendaftaran = p;
      } else if (catLower === 'sidang' || catLower.includes('sidang') || catLower === 'pelaksanaan') {
        map[groupKey].sidang = p;
      }
    });

    return Object.values(map).sort((a, b) => {
      const d1 = a.pendaftaran?.startDate || a.sidang?.startDate || '1970-01-01';
      const d2 = b.pendaftaran?.startDate || b.sidang?.startDate || '1970-01-01';
      return new Date(d2) - new Date(d1);
    });
  }, [periods]);

  const filteredGroups = useMemo(() => {
    let result = groupedPeriods;

    if (activeFilter === 'Periode Aktif') {
      result = result.filter(g => checkGroupStatus(g).isActive);
    } else if (activeFilter === 'Pendaftaran Dibuka') {
      result = result.filter(g => g.pendaftaran && getStatus(g.pendaftaran.startDate, g.pendaftaran.endDate, g.pendaftaran.isOpen) === 'Aktif');
    } else if (activeFilter === 'Pelaksanaan Sidang') {
      result = result.filter(g => g.sidang && getStatus(g.sidang.startDate, g.sidang.endDate, g.sidang.isOpen) === 'Aktif');
    } else if (activeFilter === 'Akan Datang') {
      result = result.filter(g => {
        const { isActive, isDone } = checkGroupStatus(g);
        return !isActive && !isDone;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => {
        const nameMatch = getDisplayPeriodName(g).toLowerCase().includes(q);
        const periodMatch = (g.period || '').toLowerCase().includes(q);
        return nameMatch || periodMatch;
      });
    }

    return result;
  }, [groupedPeriods, searchQuery, activeFilter]);

  const activeGroup = useMemo(() => {
    if (groupedPeriods.length === 0) return null;
    const trulyActive = groupedPeriods.find(g => checkGroupStatus(g).isActive);
    if (trulyActive) return trulyActive;
    const anyOpen = groupedPeriods.find(g => g.pendaftaran?.isOpen || g.sidang?.isOpen);
    if (anyOpen) return anyOpen;
    return groupedPeriods[0];
  }, [groupedPeriods]);

  const { isActive: isActiveMain, isDone: isDoneMain } = checkGroupStatus(activeGroup);

  const pStatMain = activeGroup?.pendaftaran ? getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate, activeGroup.pendaftaran.isOpen) : null;
  const sStatMain = activeGroup?.sidang ? getStatus(activeGroup.sidang.startDate, activeGroup.sidang.endDate, activeGroup.sidang.isOpen) : null;

  const textPendMain = getStatusTextProps(pStatMain, 'pend');
  const textSidangMain = getStatusTextProps(sStatMain, 'sidang');

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

    if (form.category === 'pelaksanaan') {
      const pend = periods.find(p => (p?.category === 'pendaftaran') && p?.period === form.period && p?.name === form.name);

      if (!pend) { 
        showAlert('error', 'Validasi Gagal', `Data Pendaftaran Sidang rujukan tidak valid atau tidak ditemukan.`); 
        return; 
      }
    }

    setSubmitting(true);
    try {
      const startObj = new Date(`${form.startDate}T00:00:00.000Z`);
      const endObj = new Date(`${form.endDate}T23:59:59.000Z`);
      const now = new Date();
      
      let autoOpen = now >= startObj && now <= endObj;
      let autoOpenPrevented = false;

      if (autoOpen) {
        const hasOtherActive = groupedPeriods.some(g => g.pendaftaran?.isOpen || g.sidang?.isOpen);
        if (hasOtherActive) {
          autoOpen = false;
          autoOpenPrevented = true;
        }
      }

      await createSidangPeriod({
        name: form.name.trim(),
        category: form.category,
        period: form.period.trim(),
        startDate: startObj.toISOString(),
        endDate: endObj.toISOString(),
        isOpen: autoOpen
      });
      
      if (autoOpenPrevented) {
        showAlert('success', 'Berhasil', 'Jadwal disimpan. Status diset Nonaktif karena masih ada periode lain yang sedang aktif.');
      } else {
        showAlert('success', 'Berhasil', 'Data periode sidang telah berhasil disimpan.');
      }
      
      setForm({ name: '', category: 'pendaftaran', period: '', startDate: '', endDate: '' });
      setIsCreateModalOpen(false);
      fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal menyimpan periode sidang.');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (group, currentToggleState) => {
    const isTurningOn = !currentToggleState;
    
    if (isTurningOn) {
      const hasOtherActive = groupedPeriods.some(g => g.id !== group.id && (g.pendaftaran?.isOpen || g.sidang?.isOpen));
      if (hasOtherActive) {
        showAlert('error', 'Gagal Mengaktifkan', 'Terdapat periode lain yang masih Aktif. Nonaktifkan periode tersebut terlebih dahulu!');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (group.pendaftaran) {
        await updateSidangPeriod(group.pendaftaran.id, {
          name: group.pendaftaran.name,
          category: group.pendaftaran.category || 'pendaftaran',
          period: group.pendaftaran.period,
          startDate: new Date(`${group.pendaftaran.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${group.pendaftaran.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: isTurningOn 
        });
      }
      if (group.sidang) {
        await updateSidangPeriod(group.sidang.id, {
          name: group.sidang.name,
          category: group.sidang.category || 'pelaksanaan',
          period: group.sidang.period,
          startDate: new Date(`${group.sidang.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${group.sidang.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: isTurningOn 
        });
      }
      await fetchPeriods();
      showAlert('success', 'Berhasil', `Status Periode TA ${group.period} diubah menjadi ${isTurningOn ? 'Aktif' : 'Nonaktif'}.`);
    } catch (err) {
      showAlert('error', 'Gagal', 'Gagal mengubah status periode.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditForm({
      name: group.pendaftaran?.name || group.sidang?.name || '',
      pendaftaran: group.pendaftaran ? { ...group.pendaftaran, startDate: formatDateForInput(group.pendaftaran.startDate), endDate: formatDateForInput(group.pendaftaran.endDate) } : null,
      sidang: group.sidang ? { ...group.sidang, startDate: formatDateForInput(group.sidang.startDate), endDate: formatDateForInput(group.sidang.endDate) } : null,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();

    const trimmedName = (editForm.name || '').trim();
    if (!trimmedName) {
      showAlert('error', 'Validasi', 'Nama periode tidak boleh kosong.');
      return;
    }

    if (editForm.pendaftaran) {
      const pErr = validateDates(editForm.pendaftaran.startDate, editForm.pendaftaran.endDate);
      if (pErr) { showAlert('error', 'Validasi Pendaftaran', pErr); return; }
    }
    if (editForm.sidang) {
      const sErr = validateDates(editForm.sidang.startDate, editForm.sidang.endDate);
      if (sErr) { showAlert('error', 'Validasi Sidang', sErr); return; }
    }

    setSubmitting(true);
    try {
      if (editForm.pendaftaran) {
        await updateSidangPeriod(editForm.pendaftaran.id, {
          name: trimmedName,
          category: editForm.pendaftaran.category || 'pendaftaran',
          period: editForm.pendaftaran.period,
          startDate: new Date(`${editForm.pendaftaran.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${editForm.pendaftaran.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: Boolean(editForm.pendaftaran.isOpen),
        });
      }
      if (editForm.sidang) {
        await updateSidangPeriod(editForm.sidang.id, {
          name: trimmedName,
          category: editForm.sidang.category || 'pelaksanaan',
          period: editForm.sidang.period,
          startDate: new Date(`${editForm.sidang.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${editForm.sidang.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: Boolean(editForm.sidang.isOpen),
        });
      }
      showAlert('success', 'Berhasil', `Periode "${trimmedName}" telah diperbarui.`);
      setIsEditModalOpen(false);
      await fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal memperbarui periode.');
    } finally { setSubmitting(false); }
  };

  const handleOpenDetail = (group) => {
    navigate('/akademik/atur-periode/sidang/detail', {
      state: { periodGroup: group },
    });
  };

  const availableGroupsForSidang = groupedPeriods.filter(g => g.pendaftaran && !g.sidang);

  return (
    <div className="aps-page-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="aps-main-content">
        <div className="aps-mobile-bar">
          <button onClick={() => setSidebarOpen(true)} className="aps-mobile-menu-btn"><Menu size={24} /></button>
          <span className="aps-mobile-brand">SIMTA</span>
        </div>

        <div className="aps-zoom-wrapper">
          <div className="aps-top-bar-red">
            <h1>Kelola Periode Sidang</h1>
          </div>

          <div className="aps-content-container">
            <div className="aps-header-row">
              <div className="aps-header-title">
                <h2>Atur Periode & Jadwal Sidang</h2>
                <p>Konfigurasi terpadu masa pendaftaran mahasiswa dan pelaksanaan sidang.</p>
              </div>
              <button className="aps-btn-add" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} /> Tambah Periode Baru
              </button>
            </div>

            {activeGroup && (
              <div className="aps-dashboard-grid">
                <div className="aps-summary-card main-active">
                  <div className="aps-summary-header">
                    <span className="aps-summary-label">PERIODE AKTIF UTAMA</span>
                    <span className={`aps-badge-pill ${isActiveMain ? 'aps-bg-green' : (isDoneMain ? 'aps-bg-gray' : 'aps-bg-red')}`}>
                      {isActiveMain && <span className="aps-dot-green"/>} 
                      {isActiveMain ? 'Aktif' : isDoneMain ? 'Selesai' : 'Mendatang/Nonaktif'}
                    </span>
                  </div>
                  <div>
                    <h3 className="aps-summary-title">
                      {getDisplayPeriodName(activeGroup)}
                    </h3>
                    <p className="aps-summary-subtitle">Periode sidang Tugas Akhir Telkom University.</p>
                  </div>
                </div>

                <div className="aps-summary-card">
                  <div className="aps-summary-header">
                    <span className="aps-summary-label">MASA PENDAFTARAN</span>
                    <span className={`aps-badge-pill ${pStatMain === 'Aktif' ? 'aps-bg-blue' : (pStatMain === 'Mendatang' ? 'aps-bg-gray' : 'aps-bg-red')}`}>
                      {pStatMain === 'Aktif' ? 'Buka' : (pStatMain === 'Mendatang' ? 'Mendatang' : 'Tutup')}
                    </span>
                  </div>
                  {activeGroup.pendaftaran ? (
                    <div>
                      <h3 className="aps-summary-title-sm">
                        {formatDate(activeGroup.pendaftaran.startDate)} – {formatDate(activeGroup.pendaftaran.endDate)}
                      </h3>
                      <div className="aps-summary-info">
                        <span className="aps-tag-blue">Durasi: {getDuration(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate)} Hari</span>
                        <span className={`aps-status-text ${textPendMain.className}`}>{textPendMain.text}</span>
                      </div>
                    </div>
                  ) : <p className="aps-empty-inline">Belum dijadwalkan</p>}
                </div>

                <div className="aps-summary-card">
                  <div className="aps-summary-header">
                    <span className="aps-summary-label">MASA PELAKSANAAN SIDANG</span>
                    <span className={`aps-badge-pill ${sStatMain === 'Aktif' ? 'aps-bg-blue' : (sStatMain === 'Mendatang' ? 'aps-bg-gray' : 'aps-bg-red')}`}>
                      {sStatMain === 'Aktif' ? 'Berjalan' : (sStatMain === 'Mendatang' ? 'Mendatang' : 'Selesai')}
                    </span>
                  </div>
                  {activeGroup.sidang ? (
                    <div>
                      <h3 className="aps-summary-title-sm">
                        {formatDate(activeGroup.sidang.startDate)} – {formatDate(activeGroup.sidang.endDate)}
                      </h3>
                      <div className="aps-summary-info">
                        <span className="aps-tag-purple">Durasi: {getDuration(activeGroup.sidang.startDate, activeGroup.sidang.endDate)} Hari</span>
                        <span className={`aps-status-text ${textSidangMain.className}`}>{textSidangMain.text}</span>
                      </div>
                    </div>
                  ) : <p className="aps-empty-inline">Belum dijadwalkan</p>}
                </div>
              </div>
            )}

            <div className="aps-filter-bar">
              <div className="aps-filter-tabs">
                <button className={`aps-filter-btn ${activeFilter === 'Semua Periode' ? 'active' : ''}`} onClick={() => setActiveFilter('Semua Periode')}>
                  Semua Periode <span className={`aps-filter-count ${activeFilter === 'Semua Periode' ? 'active' : 'inactive'}`}>{groupedPeriods.length}</span>
                </button>
                <button className={`aps-filter-btn ${activeFilter === 'Periode Aktif' ? 'active' : ''}`} onClick={() => setActiveFilter('Periode Aktif')}>Periode Aktif</button>
                <button className={`aps-filter-btn ${activeFilter === 'Pendaftaran Dibuka' ? 'active' : ''}`} onClick={() => setActiveFilter('Pendaftaran Dibuka')}>Pendaftaran Dibuka</button>
                <button className={`aps-filter-btn ${activeFilter === 'Pelaksanaan Sidang' ? 'active' : ''}`} onClick={() => setActiveFilter('Pelaksanaan Sidang')}>Pelaksanaan Sidang</button>
                <button className={`aps-filter-btn ${activeFilter === 'Akan Datang' ? 'active' : ''}`} onClick={() => setActiveFilter('Akan Datang')}>Akan Datang</button>
              </div>
              <div className="aps-search-box">
                <Search className="aps-search-icon" size={16} />
                <input type="text" placeholder="Cari nama periode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="aps-loading-state">Memuat data...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="aps-empty-state">Tidak ada periode yang ditemukan.</div>
            ) : (
              <div className="aps-table-wrap">
                <table className="aps-data-table">
                  <thead>
                    <tr>
                      <th>Nama Periode</th>
                      <th>Masa Pendaftaran</th>
                      <th>Masa Pelaksanaan Sidang</th>
                      <th>Status Alur</th>
                      <th>Aktif</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group) => {
                      const { isActive, isDone } = checkGroupStatus(group);
                      const pStat = group.pendaftaran ? getStatus(group.pendaftaran.startDate, group.pendaftaran.endDate, group.pendaftaran.isOpen) : null;
                      const sStat = group.sidang ? getStatus(group.sidang.startDate, group.sidang.endDate, group.sidang.isOpen) : null;
                      
                      const mainName = getDisplayPeriodName(group);
                      const isToggleOn = Boolean(group.pendaftaran?.isOpen || group.sidang?.isOpen);

                      return (
                        <tr key={group.id}>
                          <td>
                            <div className="aps-cell-title">{mainName}</div>
                            <div className="aps-cell-subtitle">Tahun Ajaran {group.period}</div>
                          </td>
                          <td>
                            {group.pendaftaran ? (
                              <>
                                <div className="aps-date-main">{formatDate(group.pendaftaran.startDate)} - {formatDate(group.pendaftaran.endDate)}</div>
                                <div className="aps-date-sub-blue">{getDuration(group.pendaftaran.startDate, group.pendaftaran.endDate)} Hari ({pStat})</div>
                              </>
                            ) : <span className="aps-unconfigured-text">Belum dikonfigurasi</span>}
                          </td>
                          <td>
                            {group.sidang ? (
                              <>
                                <div className="aps-date-main-purple">{formatDate(group.sidang.startDate)} - {formatDate(group.sidang.endDate)}</div>
                                <div className="aps-date-sub-purple">{getDuration(group.sidang.startDate, group.sidang.endDate)} Hari ({sStat})</div>
                              </>
                            ) : <span className="aps-unconfigured-text">Belum dikonfigurasi</span>}
                          </td>
                          <td>
                            <span className={`aps-flow-badge ${isActive ? 'aps-bg-green' : isDone ? 'aps-bg-gray' : 'aps-bg-blue'}`}>
                              {isActive ? 'Sedang Berjalan' : isDone ? 'Periode Selesai' : 'Mendatang'}
                            </span>
                          </td>
                          <td>
                            <div className={`aps-pc-toggle ${submitting ? 'is-disabled' : ''}`} onClick={() => !submitting && handleToggleActive(group, isToggleOn)}>
                              <div className={`aps-toggle-switch ${isToggleOn ? 'on' : ''}`} />
                            </div>
                          </td>
                          <td>
                            <div className="aps-action-btns">
                              <button title="Lihat Detail Mahasiswa" onClick={() => handleOpenDetail(group)}><Eye size={16} /></button>
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
          <div className="aps-modal-overlay">
            <motion.div className="aps-modal-container" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="aps-modal-header">
                <h3>Tambah Jadwal Baru</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="aps-modal-close-btn"><X size={20} /></button>
              </div>
              <div className="aps-modal-body">
                <form id="createForm" onSubmit={handleCreate}>
                  <div className="aps-form-stack">
                    <div className="aps-form-group">
                      <label className="aps-form-label">KATEGORI *</label>
                      <select className="aps-form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value, name: '', period: ''})}>
                        <option value="pendaftaran">Pendaftaran Sidang</option>
                        <option value="pelaksanaan">Pelaksanaan Sidang</option>
                      </select>
                    </div>

                    {form.category === 'pendaftaran' ? (
                      <>
                        <div className="aps-form-group">
                          <label className="aps-form-label">TAHUN AJARAN *</label>
                          <input type="text" placeholder="Contoh: 2026/2027" value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="aps-form-control" />
                        </div>
                        <div className="aps-form-group">
                          <label className="aps-form-label">NAMA JUDUL PERIODE *</label>
                          <input type="text" placeholder="Contoh: Periode Sidang Gelombang 1 2026/2027" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="aps-form-control" />
                        </div>
                      </>
                    ) : (
                      <div className="aps-form-group">
                        <label className="aps-form-label">PILIH MASA PENDAFTARAN REFERENSI *</label>
                        {availableGroupsForSidang.length > 0 ? (
                          <select className="aps-form-control" onChange={e => {
                              const sel = availableGroupsForSidang.find(g => g.id === e.target.value);
                              if (sel?.pendaftaran) setForm({...form, name: sel.pendaftaran.name, period: sel.period});
                            }}>
                            <option value="">-- Silakan Pilih --</option>
                            {availableGroupsForSidang.map(g => (
                              <option key={g.id} value={g.id}>
                                {getDisplayPeriodName(g)} ({g.period})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="aps-error-box">
                            Semua Pendaftaran sudah memiliki jadwal Sidang, atau belum ada Pendaftaran sama sekali. Buat "Pendaftaran Sidang" baru terlebih dahulu!
                          </div>
                        )}
                      </div>
                    )}

                    <div className="aps-form-grid-2">
                      <div className="aps-form-group">
                        <label className="aps-form-label">TANGGAL MULAI *</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="aps-form-control" />
                      </div>
                      <div className="aps-form-group">
                        <label className="aps-form-label">TANGGAL SELESAI *</label>
                        <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={e => setForm({...form, endDate: e.target.value})} className="aps-form-control" />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="aps-modal-footer">
                <button onClick={() => setIsCreateModalOpen(false)} className="aps-btn-secondary">Batal</button>
                <button
                  type="submit"
                  form="createForm"
                  disabled={submitting || ((form.category === 'pelaksanaan') && availableGroupsForSidang.length === 0)}
                  className="aps-btn-primary-modal"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDIT */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="aps-modal-overlay">
            <motion.div className="aps-modal-container modal-lg" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="aps-modal-header">
                <h3>Edit Jadwal (TA {editingGroup?.period})</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="aps-modal-close-btn"><X size={20} /></button>
              </div>
              <div className="aps-modal-body scrollable">
                <form id="editGroupForm" onSubmit={handleUpdateGroup}>
                  <div className="aps-form-group aps-mb-24">
                    <label className="aps-form-label">NAMA JUDUL PERIODE *</label>
                    <input 
                      type="text" 
                      value={editForm.name || ''} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})} 
                      className="aps-form-control"
                      placeholder="Contoh: Periode Sidang Gelombang 1 2026/2027"
                      required
                    />
                  </div>

                  {editForm.pendaftaran && (
                    <div className="aps-edit-section-blue">
                      <h4 className="aps-section-title-blue"><Calendar size={16}/> Masa Pendaftaran</h4>
                      <div className="aps-form-grid-2">
                        <div className="aps-form-group">
                          <label className="aps-label-blue">TANGGAL MULAI</label>
                          <input type="date" value={editForm.pendaftaran.startDate} onChange={e => setEditForm({...editForm, pendaftaran: {...editForm.pendaftaran, startDate: e.target.value}})} className="aps-input-blue" />
                        </div>
                        <div className="aps-form-group">
                          <label className="aps-label-blue">TANGGAL SELESAI</label>
                          <input type="date" value={editForm.pendaftaran.endDate} min={editForm.pendaftaran.startDate} onChange={e => setEditForm({...editForm, pendaftaran: {...editForm.pendaftaran, endDate: e.target.value}})} className="aps-input-blue" />
                        </div>
                      </div>
                    </div>
                  )}
                  {editForm.sidang && (
                    <div className="aps-edit-section-purple">
                      <h4 className="aps-section-title-purple"><Clock size={16}/> Masa Pelaksanaan Sidang</h4>
                      <div className="aps-form-grid-2">
                        <div className="aps-form-group">
                          <label className="aps-label-purple">TANGGAL MULAI</label>
                          <input type="date" value={editForm.sidang.startDate} onChange={e => setEditForm({...editForm, sidang: {...editForm.sidang, startDate: e.target.value}})} className="aps-input-purple" />
                        </div>
                        <div className="aps-form-group">
                          <label className="aps-label-purple">TANGGAL SELESAI</label>
                          <input type="date" value={editForm.sidang.endDate} min={editForm.sidang.startDate} onChange={e => setEditForm({...editForm, sidang: {...editForm.sidang, endDate: e.target.value}})} className="aps-input-purple" />
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <div className="aps-modal-footer">
                <button onClick={() => setIsEditModalOpen(false)} className="aps-btn-secondary">Batal</button>
                <button type="submit" form="editGroupForm" disabled={submitting} className="aps-btn-primary-modal">{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="aps-alert-floating">
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AturPeriodeSidang;