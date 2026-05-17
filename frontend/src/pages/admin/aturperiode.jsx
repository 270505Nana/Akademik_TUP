import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, Edit3, Trash2, LayoutPanelLeft, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin  from '../../components/sidebar/SidebarAdmin';
import CustomAlert   from '../../components/common/CustomAlert';
import '../../components/admin/css/aturperiode.css';
import {
  getSidangPeriods,
  createSidangPeriod,
  updateSidangPeriod,
  getYudisiumPeriods,
  createYudisiumPeriod,
  updateYudisiumPeriod,
} from '../../service/api';

const AturPeriode = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidangPeriods, setSidangPeriods] = useState([]);
  const [sidangLoading, setSidangLoading] = useState(true);
  const [sidangForm,    setSidangForm]    = useState({ name: '', startDate: '', endDate: '' });
  const [yudisiumPeriods, setYudisiumPeriods] = useState([]);
  const [yudisiumLoading, setYudisiumLoading] = useState(true);
  const [yudisiumForm,    setYudisiumForm]    = useState({ name: '', startDate: '', endDate: '' });
  const [isEditModalOpen,    setIsEditModalOpen]    = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingItem,        setEditingItem]        = useState(null);
  const [pendingUpdate,      setPendingUpdate]      = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', startDate: '', endDate: '', type: '', isOpen: true,
  });

  const [alert, setAlert] = useState({
    show: false, type: 'success', title: '', message: '',
  });

  useEffect(() => {
    const fetchSidang = async () => {
      try {
        setSidangLoading(true);
        const data = await getSidangPeriods();
        const normalized = (data ?? []).map(normalizeDates);
        setSidangPeriods(normalized);
      } catch (err) {
        console.error('Gagal fetch sidang periods:', err);
        showAlert('error', 'Gagal', 'Gagal memuat data periode sidang dari server.');
      } finally {
        setSidangLoading(false);
      }
    };

    const fetchYudisium = async () => {
      try {
        setYudisiumLoading(true);
        const data = await getYudisiumPeriods();
        const normalized = (data ?? []).map(normalizeDates);
        setYudisiumPeriods(normalized);
      } catch (err) {
        console.error('Gagal fetch yudisium periods:', err);
        showAlert('error', 'Gagal', 'Gagal memuat data periode yudisium dari server.');
      } finally {
        setYudisiumLoading(false);
      }
    };

    fetchSidang();
    fetchYudisium();
  }, []);

  const normalizeDates = (p) => ({
    ...p,
    startDate: p.startDate?.slice(0, 10) ?? p.startDate,
    endDate:   p.endDate?.slice(0, 10)   ?? p.endDate,
  });

  const getStatus = (start, end) => {
    const now = new Date();
    const s   = new Date(start);
    const e   = new Date(end);
    if (now < s) return 'Mendatang';
    if (now > e) return 'Selesai';
    return 'Aktif';
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
  };

  const handleSaveSidang = async (e) => {
    e.preventDefault();
    if (!sidangForm.name || !sidangForm.startDate || !sidangForm.endDate) {
      showAlert('error', 'Gagal', 'Harap lengkapi semua bidang input.');
      return;
    }
    try {
      const created = await createSidangPeriod(sidangForm);
      setSidangPeriods(prev => [normalizeDates(created), ...prev]);
      setSidangForm({ name: '', startDate: '', endDate: '' });
      showAlert('success', 'Berhasil', 'Data periode sidang telah berhasil disimpan.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan periode sidang.';
      showAlert('error', 'Gagal', msg);
    }
  };

  const handleSaveYudisium = async (e) => {
    e.preventDefault();
    if (!yudisiumForm.name || !yudisiumForm.startDate || !yudisiumForm.endDate) {
      showAlert('error', 'Gagal', 'Harap lengkapi semua bidang input.');
      return;
    }
    try {
      const created = await createYudisiumPeriod(yudisiumForm);
      setYudisiumPeriods(prev => [normalizeDates(created), ...prev]);
      setYudisiumForm({ name: '', startDate: '', endDate: '' });
      showAlert('success', 'Berhasil', 'Data periode yudisium telah berhasil disimpan.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan periode yudisium.';
      showAlert('error', 'Gagal', msg);
    }
  };

  const openEditModal = (item, type) => {
    setEditingItem(item);
    setEditForm({
      name:      item.name,
      startDate: formatDateForInput(item.startDate),
      endDate:   formatDateForInput(item.endDate),
      isOpen:    item.isOpen ?? true,
      type,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      showAlert('error', 'Gagal', 'Harap lengkapi semua bidang input.');
      return;
    }
    setPendingUpdate({ ...editForm });
    setIsEditModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate || !editingItem) return;
    setIsConfirmModalOpen(false);

    try {
      if (pendingUpdate.type === 'sidang') {
        const updated = await updateSidangPeriod(editingItem.id, {
          name:      pendingUpdate.name,
          startDate: pendingUpdate.startDate,
          endDate:   pendingUpdate.endDate,
        });
        setSidangPeriods(prev =>
          prev.map(p => p.id === editingItem.id ? normalizeDates(updated) : p)
        );
      } else {
        const updated = await updateYudisiumPeriod(editingItem.id, {
          name:      pendingUpdate.name,
          startDate: pendingUpdate.startDate,
          endDate:   pendingUpdate.endDate,
        });
        setYudisiumPeriods(prev =>
          prev.map(p => p.id === editingItem.id ? normalizeDates(updated) : p)
        );
      }
      showAlert('success', 'Berhasil', `Periode ${pendingUpdate.name} telah diperbarui.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui periode.';
      showAlert('error', 'Gagal', msg);
    } finally {
      setPendingUpdate(null);
      setEditingItem(null);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6FB' }}>
      {/* ── Responsive layout styles ── */}
      <style>{`
        /* Desktop: main content offset tepat 240px sesuai --sidebar-width di sidebar.css */
        .main-content-area {
          margin-left: 240px;
          min-width: 0;
          flex: 1;
          transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
          background: #F4F6FB;
          min-height: 100vh;
        }
        /* Mobile/tablet ≤991.98px: sidebar jadi overlay, konten full width */
        @media (max-width: 991.98px) {
          .main-content-area {
            margin-left: 0 !important;
          }
          .mobile-menu-bar {
            display: flex !important;
          }
        }
        /* Sembunyikan topbar mobile di desktop */
        @media (min-width: 992px) {
          .mobile-menu-bar {
            display: none !important;
          }
        }
        .page-wrapper {
          overflow-x: hidden;
          width: 100%;
        }
        .top-bar-red {
          width: 100%;
          box-sizing: border-box;
        }
        .content-container {
          padding: 32px 32px 48px;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 600px) {
          .content-container {
            padding: 20px 16px 40px;
          }
        }
      `}</style>
      <SidebarAdmin
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, icon, type) =>
          showAlert(type === 'warning' ? 'warning' : 'success', 'Info', msg)
        }
      />

      <div className="main-content-area">
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Kelola Periode Sidang &amp; Yudisium</h1>
          </div>

          <div className="content-container">
            <h2 className="page-title">Atur Periode</h2>

            {/*  Tambah Periode Sidang  */}
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
                        type="text" className="form-control"
                        placeholder="Contoh: Periode Sidang Semester Genap 2025/2026"
                        value={sidangForm.name}
                        onChange={e => setSidangForm({ ...sidangForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input
                          type="date" className="form-control"
                          value={sidangForm.startDate}
                          onChange={e => setSidangForm({ ...sidangForm, startDate: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai</label>
                          <input
                            type="date" className="form-control"
                            value={sidangForm.endDate}
                            onChange={e => setSidangForm({ ...sidangForm, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="btn-submit-container">
                    <button type="submit" className="btn-primary-red">
                      <Save size={16} /> Simpan Periode Sidang
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/*  Daftar Periode Sidang  */}
            <section className="card-main">
              <div className="card-header">
                <LayoutPanelLeft className="card-icon-red" size={24} />
                <h3>Daftar Periode Sidang</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {sidangLoading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                    Memuat data periode sidang...
                  </div>
                ) : (
                  <PeriodeTable
                    periods={sidangPeriods}
                    type="sidang"
                    getStatus={getStatus}
                    formatDate={formatDate}
                    onEdit={openEditModal}
                  />
                )}
              </div>
            </section>
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
                        type="text" className="form-control"
                        placeholder="Contoh: Semester Genap 2025/2026 - Gel 2"
                        value={yudisiumForm.name}
                        onChange={e => setYudisiumForm({ ...yudisiumForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input
                          type="date" className="form-control"
                          value={yudisiumForm.startDate}
                          onChange={e => setYudisiumForm({ ...yudisiumForm, startDate: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai</label>
                          <input
                            type="date" className="form-control"
                            value={yudisiumForm.endDate}
                            onChange={e => setYudisiumForm({ ...yudisiumForm, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="btn-submit-container">
                    <button type="submit" className="btn-primary-red">
                      <Save size={16} /> Simpan Periode Yudisium
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/*  Daftar Periode Yudisium  */}
            <section className="card-main">
              <div className="card-header">
                <LayoutPanelLeft className="card-icon-red" size={24} />
                <h3>Daftar Periode Yudisium</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {yudisiumLoading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                    Memuat data periode yudisium...
                  </div>
                ) : (
                  <PeriodeTable
                    periods={yudisiumPeriods}
                    type="yudisium"
                    getStatus={getStatus}
                    formatDate={formatDate}
                    onEdit={openEditModal}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

  
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{    scale: 0.9, opacity: 0 }}
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
                        type="text" className="form-control"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Mulai</label>
                      <input
                        type="date" className="form-control"
                        value={editForm.startDate}
                        onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Berakhir</label>
                      <input
                        type="date" className="form-control"
                        value={editForm.endDate}
                        onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button form="editForm" type="submit" className="btn-save-modal">
                  Lanjutkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{    scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Konfirmasi Perubahan</h3>
                <button className="btn-close" onClick={() => setIsConfirmModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Apakah Anda yakin ingin memperbarui periode{' '}
                  <strong>{pendingUpdate?.name}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsConfirmModalOpen(false)}>
                  Batal
                </button>
                <button className="btn-save-modal" onClick={handleConfirmUpdate}>
                  Ya, Perbarui
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div
            className="alert-overlay"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: 300, opacity: 0 }}
          >
            <CustomAlert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              style={{ margin: 0, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const PeriodeTable = ({ periods, type, getStatus, formatDate, onEdit }) => {
  if (periods.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px', fontSize: 13 }}>
        Belum ada data periode.
      </div>
    );
  }

  return (
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
                <td>
                  <span className={`badge badge-${status.toLowerCase()}`}>
                    {status}
                  </span>
                </td>
                <td>
                  <div className="action-stack">
                    {status === 'Mendatang' && (
                      <button className="btn-outline" onClick={() => onEdit(period, type)}>
                        <Edit3 size={16} /> Edit
                      </button>
                    )}
                    {status === 'Aktif' && (
                      <>
                        <button className="btn-outline">Detail Periode</button>
                        <button className="btn-outline" onClick={() => onEdit(period, type)}>
                          <Edit3 size={16} /> Edit
                        </button>
                      </>
                    )}
                    {status === 'Selesai' && (
                      <button className="btn-outline">Detail Periode</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AturPeriode;