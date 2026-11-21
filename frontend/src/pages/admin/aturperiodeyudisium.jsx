import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Save, Edit3, LayoutPanelLeft, Menu, X, RefreshCw, Calendar, Clock, AlertTriangle, Eye, Plus, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert  from '../../components/common/CustomAlert';
import { getYudisiumPeriods, createYudisiumPeriod, updateYudisiumPeriod } from '../../service/api';

// --- IMPORT EXTERNAL CSS ---
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

const getStatusTextProps = (stat, type) => {
  if (!stat) return { text: 'Belum dijadwalkan', className: 'aps-status-text-muted' };
  if (stat === 'Aktif') return { text: type === 'pend' ? 'Pendaftaran Dibuka' : 'Yudisium Berjalan', className: 'aps-status-text-green' };
  if (stat === 'Mendatang') return { text: type === 'pend' ? 'Pendaftaran Mendatang' : 'Yudisium Mendatang', className: 'aps-status-text-muted' };
  if (stat === 'Selesai') return { text: type === 'pend' ? 'Pendaftaran Ditutup' : 'Yudisium Selesai', className: 'aps-status-text-red' };
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
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const diffDays = Math.round((e - s) / (1000 * 3600 * 24));
  return diffDays >= 0 ? diffDays + 1 : 0;
};

// Prioritaskan nama kustom dari BE (pendaftaran.name / yudisium.name), fallback ke format Semester/Tahun Ajaran
const getDisplayPeriodName = (group) => {
  if (!group) return '-';
  const customName = (group.pendaftaran?.name || group.yudisium?.name || '').trim();
  if (customName) return customName;
  if (group.semester && group.semester !== 'Umum') {
    return `Semester ${group.semester} ${group.period}`;
  }
  return `Tahun Ajaran ${group.period || ''}`;
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
    name: '', category: 'pendaftaran', period: '', startDate: '', endDate: '' 
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', pendaftaran: null, yudisium: null });
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
      showAlert('error', 'Gagal Memuat', 'Gagal memuat data periode yudisium dari server.');
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
        map[groupKey] = { id: groupKey, period: periodVal, semester, pendaftaran: null, yudisium: null };
      }
      
      const catLower = (p.category || '').toLowerCase();
      if (catLower.includes('pendaftaran')) {
        map[groupKey].pendaftaran = p;
      } else if (catLower === 'yudisium' || catLower.includes('yudisium') || catLower === 'pelaksanaan') {
        map[groupKey].yudisium = p;
      }
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
    const anyOpen = groupedPeriods.find(g => g.pendaftaran?.isOpen || g.yudisium?.isOpen);
    if (anyOpen) return anyOpen;
    return groupedPeriods[0];
  }, [groupedPeriods]);

  const { isActive: isActiveMain, isDone: isDoneMain } = checkGroupStatus(activeGroup);

  const pStatMain = activeGroup?.pendaftaran ? getStatus(activeGroup.pendaftaran.startDate, activeGroup.pendaftaran.endDate, activeGroup.pendaftaran.isOpen) : null;
  const yStatMain = activeGroup?.yudisium ? getStatus(activeGroup.yudisium.startDate, activeGroup.yudisium.endDate, activeGroup.yudisium.isOpen) : null;

  const textPendMain = getStatusTextProps(pStatMain, 'pend');
  const textYudisiumMain = getStatusTextProps(yStatMain, 'yudisium');

  // Mengizinkan tanggal mulai === tanggal selesai (durasi 1 hari), hanya melarang tanggal selesai sebelum tanggal mulai
  const validateDates = (start, end) => {
    const s = new Date(`${start}T00:00:00`).getTime();
    const e = new Date(`${end}T00:00:00`).getTime();
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
        showAlert('error', 'Validasi Gagal', `Data Pendaftaran Yudisium rujukan tidak valid atau tidak ditemukan.`); 
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
        const hasOtherActive = groupedPeriods.some(g => g.pendaftaran?.isOpen || g.yudisium?.isOpen);
        if (hasOtherActive) {
          autoOpen = false;
          autoOpenPrevented = true;
        }
      }

      await createYudisiumPeriod({
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
        showAlert('success', 'Berhasil', 'Data periode yudisium telah berhasil disimpan.');
      }
      
      setForm({ name: '', category: 'pendaftaran', period: '', startDate: '', endDate: '' });
      setIsCreateModalOpen(false);
      fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal menyimpan periode yudisium.');
    } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (group, currentToggleState) => {
    const isTurningOn = !currentToggleState;
    
    if (isTurningOn) {
      const hasOtherActive = groupedPeriods.some(g => g.id !== group.id && (g.pendaftaran?.isOpen || g.yudisium?.isOpen));
      if (hasOtherActive) {
        showAlert('error', 'Gagal Mengaktifkan', 'Terdapat periode lain yang masih Aktif. Nonaktifkan periode tersebut terlebih dahulu!');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (group.pendaftaran) {
        await updateYudisiumPeriod(group.pendaftaran.id, {
          name: group.pendaftaran.name,
          category: group.pendaftaran.category || 'pendaftaran',
          period: group.pendaftaran.period,
          startDate: new Date(`${group.pendaftaran.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${group.pendaftaran.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: isTurningOn 
        });
      }
      if (group.yudisium) {
        await updateYudisiumPeriod(group.yudisium.id, {
          name: group.yudisium.name,
          category: group.yudisium.category || 'pelaksanaan',
          period: group.yudisium.period,
          startDate: new Date(`${group.yudisium.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${group.yudisium.endDate}T23:59:59.000Z`).toISOString(),
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
      name: group.pendaftaran?.name || group.yudisium?.name || '',
      pendaftaran: group.pendaftaran ? { ...group.pendaftaran, startDate: formatDateForInput(group.pendaftaran.startDate), endDate: formatDateForInput(group.pendaftaran.endDate) } : null,
      yudisium: group.yudisium ? { ...group.yudisium, startDate: formatDateForInput(group.yudisium.startDate), endDate: formatDateForInput(group.yudisium.endDate) } : null,
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
    if (editForm.yudisium) {
      const yErr = validateDates(editForm.yudisium.startDate, editForm.yudisium.endDate);
      if (yErr) { showAlert('error', 'Validasi Yudisium', yErr); return; }
    }

    setSubmitting(true);
    try {
      // Sementara di-handle di FE: update nama pada kategori pendaftaran & pelaksanaan sekaligus agar sinkron
      if (editForm.pendaftaran) {
        await updateYudisiumPeriod(editForm.pendaftaran.id, {
          name: trimmedName,
          category: editForm.pendaftaran.category || 'pendaftaran',
          period: editForm.pendaftaran.period,
          startDate: new Date(`${editForm.pendaftaran.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${editForm.pendaftaran.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: Boolean(editForm.pendaftaran.isOpen),
        });
      }
      if (editForm.yudisium) {
        await updateYudisiumPeriod(editForm.yudisium.id, {
          name: trimmedName,
          category: editForm.yudisium.category || 'pelaksanaan',
          period: editForm.yudisium.period,
          startDate: new Date(`${editForm.yudisium.startDate}T00:00:00.000Z`).toISOString(),
          endDate: new Date(`${editForm.yudisium.endDate}T23:59:59.000Z`).toISOString(),
          isOpen: Boolean(editForm.yudisium.isOpen),
        });
      }
      showAlert('success', 'Berhasil', `Periode "${trimmedName}" telah diperbarui.`);
      setIsEditModalOpen(false);
      await fetchPeriods();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Gagal memperbarui periode.');
    } finally { setSubmitting(false); }
  };

  const availableGroupsForYudisium = groupedPeriods.filter(g => g.pendaftaran && !g.yudisium);

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
            <h1>Kelola Periode Yudisium</h1>
          </div>

          <div className="aps-content-container">
            <div className="aps-header-row">
              <div className="aps-header-title">
                <h2>Atur Periode & Jadwal Yudisium</h2>
                <p>Konfigurasi terpadu masa pendaftaran mahasiswa dan pelaksanaan yudisium.</p>
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
                    <p className="aps-summary-subtitle">Periode yudisium Tugas Akhir Telkom University.</p>
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
                    <span className="aps-summary-label">MASA PELAKSANAAN SIDANG YUDISIUM</span>
                    <span className={`aps-badge-pill ${yStatMain === 'Aktif' ? 'aps-bg-blue' : (yStatMain === 'Mendatang' ? 'aps-bg-gray' : 'aps-bg-red')}`}>
                      {yStatMain === 'Aktif' ? 'Berjalan' : (yStatMain === 'Mendatang' ? 'Mendatang' : 'Selesai')}
                    </span>
                  </div>
                  {activeGroup.yudisium ? (
                    <div>
                      <h3 className="aps-summary-title-sm">
                        {formatDate(activeGroup.yudisium.startDate)} – {formatDate(activeGroup.yudisium.endDate)}
                      </h3>
                      <div className="aps-summary-info">
                        <span className="aps-tag-purple">Durasi: {getDuration(activeGroup.yudisium.startDate, activeGroup.yudisium.endDate)} Hari</span>
                        <span className={`aps-status-text ${textYudisiumMain.className}`}>{textYudisiumMain.text}</span>
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
                <button className={`aps-filter-btn ${activeFilter === 'Pelaksanaan Yudisium' ? 'active' : ''}`} onClick={() => setActiveFilter('Pelaksanaan Yudisium')}>Pelaksanaan Yudisium</button>
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
                      <th>Masa Pelaksanaan Sidang Yudisium</th>
                      <th>Status Alur</th>
                      <th>Aktif</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group) => {
                      const { isActive, isDone } = checkGroupStatus(group);
                      const pStat = group.pendaftaran ? getStatus(group.pendaftaran.startDate, group.pendaftaran.endDate, group.pendaftaran.isOpen) : null;
                      const yStat = group.yudisium ? getStatus(group.yudisium.startDate, group.yudisium.endDate, group.yudisium.isOpen) : null;
                      
                      const mainName = getDisplayPeriodName(group);
                      const isToggleOn = Boolean(group.pendaftaran?.isOpen || group.yudisium?.isOpen);

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
                            {group.yudisium ? (
                              <>
                                <div className="aps-date-main-purple">{formatDate(group.yudisium.startDate)} - {formatDate(group.yudisium.endDate)}</div>
                                <div className="aps-date-sub-purple">{getDuration(group.yudisium.startDate, group.yudisium.endDate)} Hari ({yStat})</div>
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
                        <option value="pendaftaran">Pendaftaran Yudisium</option>
                        <option value="pelaksanaan">Pelaksanaan Yudisium</option>
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
                          <input type="text" placeholder="Contoh: Periode Yudisium Gelombang 1 2026/2027" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="aps-form-control" />
                        </div>
                      </>
                    ) : (
                      <div className="aps-form-group">
                        <label className="aps-form-label">PILIH MASA PENDAFTARAN REFERENSI *</label>
                        {availableGroupsForYudisium.length > 0 ? (
                          <select className="aps-form-control" onChange={e => {
                              const sel = availableGroupsForYudisium.find(g => g.id === e.target.value);
                              if (sel?.pendaftaran) setForm({...form, name: sel.pendaftaran.name, period: sel.period});
                            }}>
                            <option value="">-- Silakan Pilih --</option>
                            {availableGroupsForYudisium.map(g => (
                              <option key={g.id} value={g.id}>
                                {getDisplayPeriodName(g)} ({g.period})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="aps-error-box">
                            Semua Pendaftaran sudah memiliki jadwal Yudisium, atau belum ada Pendaftaran sama sekali. Buat "Pendaftaran Yudisium" baru terlebih dahulu!
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
                  disabled={submitting || ((form.category === 'pelaksanaan') && availableGroupsForYudisium.length === 0)}
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
                      placeholder="Contoh: Periode Yudisium Gelombang 1 2026/2027"
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
                  {editForm.yudisium && (
                    <div className="aps-edit-section-purple">
                      <h4 className="aps-section-title-purple"><Clock size={16}/> Masa Pelaksanaan Sidang Yudisium</h4>
                      <div className="aps-form-grid-2">
                        <div className="aps-form-group">
                          <label className="aps-label-purple">TANGGAL MULAI</label>
                          <input type="date" value={editForm.yudisium.startDate} onChange={e => setEditForm({...editForm, yudisium: {...editForm.yudisium, startDate: e.target.value}})} className="aps-input-purple" />
                        </div>
                        <div className="aps-form-group">
                          <label className="aps-label-purple">TANGGAL SELESAI</label>
                          <input type="date" value={editForm.yudisium.endDate} min={editForm.yudisium.startDate} onChange={e => setEditForm({...editForm, yudisium: {...editForm.yudisium, endDate: e.target.value}})} className="aps-input-purple" />
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

export default AturPeriodeYudisium;