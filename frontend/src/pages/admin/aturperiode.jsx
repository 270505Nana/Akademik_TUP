import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, Edit3, Trash2, LayoutPanelLeft, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import '../../components/admin/aturperiode.css';

const AturPeriode = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [sidangPeriods, setSidangPeriods] = useState([]);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: '' // 'sidang' or 'yudisium'
  });

  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  
  const [sidangForm, setSidangForm] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  const [alert, setAlert] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    // dummy data periode yudisium
    const savedYudisium = localStorage.getItem('simta_periods_yudisium');
    if (savedYudisium) {
      setPeriods(JSON.parse(savedYudisium));
    } else {
      const defaults = [
        { id: '1', name: 'Gelombang 2 - Genap', startDate: '2026-05-01', endDate: '2026-05-15' },
        { id: '2', name: 'Gelombang 1 - Genap', startDate: '2026-04-01', endDate: '2026-04-20' },
        { id: '3', name: 'Yudisium Ganjil 2025', startDate: '2025-12-01', endDate: '2025-12-15' }
      ];
      setPeriods(defaults);
      localStorage.setItem('simta_periods_yudisium', JSON.stringify(defaults));
    }

    // dummy data periode sidang
    const savedSidang = localStorage.getItem('simta_periods_sidang');
    if (savedSidang) {
      setSidangPeriods(JSON.parse(savedSidang));
    } else {
      const defaults = [
        { id: 's1', name: 'Periode Sidang Mei 2026', startDate: '2026-05-10', endDate: '2026-05-30' },
        { id: 's2', name: 'Periode Sidang April 2026', startDate: '2026-04-10', endDate: '2026-04-30' }
      ];
      setSidangPeriods(defaults);
      localStorage.setItem('simta_periods_sidang', JSON.stringify(defaults));
    }
  }, []);

  // status [mendatang, aktif, selesai]
  const getStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (now < startDate) return 'Mendatang';
    if (now > endDate) return 'Selesai';
    return 'Aktif';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleSaveYudisium = (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      showAlert('error', 'Gagal', 'Harap lengkapi semua bidang input.');
      return;
    }
    const newPeriod = { id: Date.now().toString(), ...form };
    const updated = [newPeriod, ...periods];
    setPeriods(updated);
    localStorage.setItem('simta_periods_yudisium', JSON.stringify(updated));
    setForm({ name: '', startDate: '', endDate: '' });
    showAlert('success', 'Berhasil', 'Data periode yudisium telah berhasil disimpan.');
  };

  const handleSaveSidang = (e) => {
    e.preventDefault();
    if (!sidangForm.name || !sidangForm.startDate || !sidangForm.endDate) {
      showAlert('error', 'Gagal', 'Harap lengkapi semua bidang input.');
      return;
    }
    const newPeriod = { id: 's' + Date.now().toString(), ...sidangForm };
    const updated = [newPeriod, ...sidangPeriods];
    setSidangPeriods(updated);
    localStorage.setItem('simta_periods_sidang', JSON.stringify(updated));
    setSidangForm({ name: '', startDate: '', endDate: '' });
    showAlert('success', 'Berhasil', 'Data periode sidang telah berhasil disimpan.');
  };

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
  };

  const deletePeriod = (id, type) => {
    if (type === 'yudisium') {
      const updated = periods.filter(p => p.id !== id);
      setPeriods(updated);
      localStorage.setItem('simta_periods_yudisium', JSON.stringify(updated));
    } else {
      const updated = sidangPeriods.filter(p => p.id !== id);
      setSidangPeriods(updated);
      localStorage.setItem('simta_periods_sidang', JSON.stringify(updated));
    }
    showAlert('warning', 'Dihapus', 'Data periode telah dihapus.');
  };

  // Modal handlers
  const openEditModal = (item, type) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      type: type
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      showAlert('error', 'Gagal', 'Harap lengkapi semua bidang input.');
      return;
    }

    if (editForm.type === 'yudisium') {
      const updated = periods.map(p => p.id === editingItem.id ? { ...p, ...editForm } : p);
      setPeriods(updated);
      localStorage.setItem('simta_periods_yudisium', JSON.stringify(updated));
    } else {
      const updated = sidangPeriods.map(p => p.id === editingItem.id ? { ...p, ...editForm } : p);
      setSidangPeriods(updated);
      localStorage.setItem('simta_periods_sidang', JSON.stringify(updated));
    }

    setIsEditModalOpen(false);
    showAlert('success', 'Berhasil', `Periode ${editForm.name} telah diperbarui.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarAdmin
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, icon, type) => showAlert(type === 'warning' ? 'warning' : 'success', 'Info', msg)}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Kelola Periode Sidang & Yudisium</h1>
          </div>

          <div className="content-container">
            <div className="breadcrumb">
              Beranda / Pengaturan Periode / Kelola Periode
            </div>
            <h2 className="page-title">Atur Periode</h2>

            <section className="card-main">
              <div className="card-header">
                <ClipboardList className="card-icon-red" size={24} />
                <h3>Tambah Periode Sidang</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSaveSidang}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nama Periode Sidang</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Contoh: Periode Sidang Semester Genap 2025/2026"
                        value={sidangForm.name}
                        onChange={e => setSidangForm({ ...sidangForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input type="date" className="form-control" value={sidangForm.startDate} onChange={e => setSidangForm({ ...sidangForm, startDate: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai</label>
                          <input type="date" className="form-control" value={sidangForm.endDate} onChange={e => setSidangForm({ ...sidangForm, endDate: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="btn-submit-container">
                    <button type="submit" className="btn-primary-red"><Save size={16} /> Simpan Periode Sidang</button>
                  </div>
                </form>
              </div>
            </section>

            {/* Daftar Periode Sidang */}
            <section className="card-main">
              <div className="card-header">
                <LayoutPanelLeft className="card-icon-red" size={24} />
                <h3>Daftar Periode Sidang</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="periode-table">
                    <thead>
                      <tr>
                        <th>Nama Periode</th>
                        <th>Tanggal Mulai</th>
                        <th>Tanggal Selesai</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sidangPeriods.map(period => {
                        const status = getStatus(period.startDate, period.endDate);
                        return (
                          <tr key={period.id}>
                            <td className="periode-name">{period.name}</td>
                            <td>{formatDate(period.startDate)}</td>
                            <td>{formatDate(period.endDate)}</td>
                            <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
                            <td>
                              <div className="action-stack">
                                {status === 'Mendatang' && (
                                  <button className="btn-outline" onClick={() => openEditModal(period, 'sidang')}><Edit3 size={16} /> Edit</button>
                                )}
                                {status === 'Aktif' && (
                                  <>
                                    <button className="btn-outline btn-outline-red">Tutup</button>
                                    <button className="btn-outline" onClick={() => openEditModal(period, 'sidang')}><Edit3 size={16} /> Edit</button>
                                  </>
                                )}
                                {status === 'Selesai' && (
                                  <button className="btn-outline">Detail</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Tambah Periode Yudisium */}
            <section className="card-main">
              <div className="card-header">
                <ClipboardList className="card-icon-red" size={24} />
                <h3>Tambah Periode Yudisium</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSaveYudisium}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nama Periode Yudisium</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Contoh: Semester Genap 2025/2026 - Gel 2"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input type="date" className="form-control" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai</label>
                          <input type="date" className="form-control" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="btn-submit-container">
                    <button type="submit" className="btn-primary-red"><Save size={16} /> Simpan Periode Yudisium</button>
                  </div>
                </form>
              </div>
            </section>

            {/* Daftar Periode Yudisium */}
            <section className="card-main">
              <div className="card-header">
                <LayoutPanelLeft className="card-icon-red" size={24} />
                <h3>Daftar Periode Yudisium</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="periode-table">
                    <thead>
                      <tr>
                        <th>Nama Periode</th>
                        <th>Tanggal Mulai</th>
                        <th>Tanggal Selesai</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map(period => {
                        const status = getStatus(period.startDate, period.endDate);
                        return (
                          <tr key={period.id}>
                            <td className="periode-name">{period.name}</td>
                            <td>{formatDate(period.startDate)}</td>
                            <td>{formatDate(period.endDate)}</td>
                            <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
                            <td>
                              <div className="action-stack">
                                {status === 'Mendatang' && (
                                  <button className="btn-outline" onClick={() => openEditModal(period, 'yudisium')}><Edit3 size={16} /> Edit</button>
                                )}
                                {status === 'Aktif' && (
                                  <>
                                    <button className="btn-outline btn-outline-red">Tutup</button>
                                    <button className="btn-outline" onClick={() => openEditModal(period, 'yudisium')}><Edit3 size={16} /> Edit</button>
                                  </>
                                )}
                                {status === 'Selesai' && (
                                  <button className="btn-outline">Detail</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Pop up buat edit */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Edit {editingItem?.name}</h3>
                <button className="btn-close" onClick={() => setIsEditModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <form id="editForm" onSubmit={handleUpdate}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nama Periode</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Mulai</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={editForm.startDate}
                        onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Berakhir</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={editForm.endDate}
                        onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button form="editForm" type="submit" className="btn-save-modal">Update Periode</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} style={{ margin: 0, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AturPeriode;
