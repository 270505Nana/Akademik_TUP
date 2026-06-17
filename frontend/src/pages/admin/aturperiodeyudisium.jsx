import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Save, Edit3, LayoutPanelLeft, Menu, X, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert  from '../../components/common/CustomAlert';
import '../../components/admin/css/aturperiode.css';
import {
  getYudisiumPeriods,
  createYudisiumPeriod,
  updateYudisiumPeriod,
} from '../../service/api';

const toArray = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  return [];
};

/**
 * Normalisasi tanggal ke "YYYY-MM-DD".
 */
const normalizeDates = (p) => {
  if (!p || typeof p !== 'object') return p;
  return {
    ...p,
    startDate: (p.startDate ?? '').slice(0, 10),
    endDate:   (p.endDate   ?? '').slice(0, 10),
  };
};

const unwrapSingle = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data;
  return raw;
};


const getStatus = (start, end) => {
  if (!start || !end) return 'Mendatang';
  const now = new Date();
  const s   = new Date(`${start}T12:00:00`);
  const e   = new Date(`${end}T12:00:00`);
  if (now < s) return 'Mendatang';
  if (now > e) return 'Selesai';
  return 'Aktif';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const FIELD_LABEL = {
  startDate : 'Tanggal Mulai',
  endDate   : 'Tanggal Selesai',
  name      : 'Nama Periode',
};

const parseBeError = (err) => {
  const data = err?.response?.data;
  if (!data) return { title: 'Terjadi Kesalahan', message: err?.message || 'Gagal menghubungi server.' };

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const lines = data.errors.map((e) => {
      const label = FIELD_LABEL[e.field] || e.field;
      let msg = e.message || '';
      if (msg.toLowerCase().includes('masa lalu') || msg.toLowerCase().includes('past')) {
        msg = 'Tanggal yang dipilih sudah lewat. Pilih tanggal hari ini atau setelahnya.';
      } else if (msg.toLowerCase().includes('required') || msg.toLowerCase().includes('wajib')) {
        msg = 'Wajib diisi.';
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('tidak valid')) {
        msg = 'Format tidak valid.';
      }
      return `• ${label}: ${msg}`;
    });
    return { title: 'Periksa Kembali Data Periode', message: lines.join('\n') };
  }

  const rawMsg = data.message || '';
  if (rawMsg.toLowerCase().includes('masa lalu') || rawMsg.toLowerCase().includes('past')) {
    return {
      title   : 'Tanggal Tidak Valid',
      message : 'Tanggal mulai yang dipilih sudah lewat. Silakan pilih tanggal hari ini atau setelahnya.',
    };
  }
  return {
    title   : 'Gagal Menyimpan',
    message : rawMsg || 'Terjadi kesalahan pada server. Silakan coba lagi.',
  };
};

//  PeriodeTable 
const PeriodeTable = ({ periods, onEdit }) => {
  if (!periods.length) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px', fontSize: 13 }}>
        Belum ada data periode yudisium.
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
          {periods.map((period) => {
            const status = getStatus(period.startDate, period.endDate);
            return (
              <tr key={period.id}>
                <td className="periode-name">{period.name}</td>
                <td>{formatDate(period.startDate)}</td>
                <td>{formatDate(period.endDate)}</td>
                <td>
                  <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
                </td>
                <td>
                  <div className="action-stack">
                    {status === 'Mendatang' && (
                      <button className="btn-outline" onClick={() => onEdit(period)}>
                        <Edit3 size={14} /> Edit
                      </button>
                    )}
                    {status === 'Aktif' && (
                      <>
                        <button className="btn-outline">Detail</button>
                        <button className="btn-outline" onClick={() => onEdit(period)}>
                          <Edit3 size={14} /> Edit
                        </button>
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
  );
};

//  Page 
const AturPeriodeYudisium = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periods,     setPeriods]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [form,        setForm]        = useState({ name: '', startDate: '', endDate: '' });

  const [isEditModalOpen,    setIsEditModalOpen]    = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingItem,        setEditingItem]        = useState(null);
  const [pendingUpdate,      setPendingUpdate]      = useState(null);
  const [editForm,           setEditForm]           = useState({ name: '', startDate: '', endDate: '' });

  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  }, []);

  //  Fetch 
  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const raw  = await getYudisiumPeriods();
      console.log('[YudisiumPeriods] raw response:', raw); // diagnosa — hapus setelah selesai
      const list = toArray(raw);
      console.log('[YudisiumPeriods] parsed list:', list);
      setPeriods(list.map(normalizeDates));
    } catch (err) {
      console.error('[AturPeriodeYudisium] fetch error:', err);
      showAlert('error', 'Gagal Memuat', 'Gagal memuat data periode yudisium dari server.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  // TAMBAH
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      showAlert('error', 'Validasi', 'Harap lengkapi semua bidang input.');
      return;
    }
    if (form.startDate > form.endDate) {
      showAlert('error', 'Validasi', 'Tanggal mulai tidak boleh lebih dari tanggal selesai.');
      return;
    }
    setSubmitting(true);
    try {
      const raw        = await createYudisiumPeriod(form);
      const normalized = normalizeDates(unwrapSingle(raw));
      setPeriods((prev) =>
        [normalized, ...prev].sort((a, b) =>
          new Date(b.startDate) - new Date(a.startDate)
        )
      );
      setForm({ name: '', startDate: '', endDate: '' });
      showAlert('success', 'Berhasil', 'Data periode yudisium telah berhasil disimpan.');
    } catch (err) {
      const { title, message } = parseBeError(err);
      showAlert('error', title, message);
    } finally {
      setSubmitting(false);
    }
  };

  
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      name:      item.name,
      startDate: formatDateForInput(item.startDate),
      endDate:   formatDateForInput(item.endDate),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.startDate || !editForm.endDate) {
      showAlert('error', 'Validasi', 'Harap lengkapi semua bidang input.');
      return;
    }
    if (editForm.startDate > editForm.endDate) {
      showAlert('error', 'Validasi', 'Tanggal mulai tidak boleh lebih dari tanggal selesai.');
      return;
    }
    setPendingUpdate({ ...editForm });
    setIsEditModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate || !editingItem) return;
    setIsConfirmModalOpen(false);
    setSubmitting(true);
    try {
      const raw        = await updateYudisiumPeriod(editingItem.id, {
        name:      pendingUpdate.name,
        startDate: pendingUpdate.startDate,
        endDate:   pendingUpdate.endDate,
      });
      const normalized = normalizeDates(unwrapSingle(raw));
      setPeriods((prev) =>
        prev.map((p) => (p.id === editingItem.id ? normalized : p))
      );
      showAlert('success', 'Berhasil', `Periode "${pendingUpdate.name}" telah diperbarui.`);
    } catch (err) {
      const { title, message } = parseBeError(err);
      showAlert('error', title, message);
    } finally {
      setSubmitting(false);
      setPendingUpdate(null);
      setEditingItem(null);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6FB' }}>
      <style>{`
        .main-content-area {
          margin-left: 240px; min-width: 0; flex: 1;
          transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
          background: #F4F6FB; min-height: 100vh;
        }
        @media (max-width: 991.98px) {
          .main-content-area { margin-left: 0 !important; }
          .mobile-menu-bar   { display: flex !important; }
        }
        @media (min-width: 992px) { .mobile-menu-bar { display: none !important; } }
        .page-wrapper      { overflow-x: hidden; width: 100%; }
        .top-bar-red       { width: 100%; box-sizing: border-box; }
        .content-container { padding: 32px 32px 48px; width: 100%; box-sizing: border-box; }
        @media (max-width: 600px) { .content-container { padding: 20px 16px 40px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content-area">
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Kelola Periode Yudisium</h1>
          </div>

          <div className="content-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 className="page-title" style={{ margin: 0 }}>Atur Periode Yudisium</h2>
              <button
                className="btn-outline"
                onClick={fetchPeriods}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>

            {/* Form Tambah */}
            <section className="card-main">
              <div className="card-header">
                <ClipboardList className="card-icon-red" size={24} />
                <h3>Tambah Periode Yudisium</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSave}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nama Periode Yudisium *</label>
                      <input
                        type="text" className="form-control"
                        placeholder="Contoh: Semester Genap 2025/2026 - Gel 2"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai *</label>
                        <input
                          type="date" className="form-control"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai *</label>
                          <input
                            type="date" className="form-control"
                            value={form.endDate}
                            min={form.startDate || undefined}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="btn-submit-container">
                    <button type="submit" className="btn-primary-red" disabled={submitting}>
                      <Save size={16} />
                      {submitting ? ' Menyimpan...' : ' Simpan Periode Yudisium'}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* Daftar */}
            <section className="card-main">
              <div className="card-header">
                <LayoutPanelLeft className="card-icon-red" size={24} />
                <h3>Daftar Periode Yudisium</h3>
                {!loading && (
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6B7280' }}>
                    {periods.length} periode
                  </span>
                )}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {loading ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                    Memuat data periode yudisium...
                  </div>
                ) : (
                  <PeriodeTable periods={periods} onEdit={openEditModal} />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modal Edit */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="modal-overlay">
            <motion.div className="modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{    scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Edit Periode Yudisium</h3>
                <button className="btn-close" onClick={() => setIsEditModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <form id="editFormYudisium" onSubmit={handleUpdate}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nama Periode *</label>
                      <input type="text" className="form-control"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Mulai *</label>
                      <input type="date" className="form-control"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Berakhir *</label>
                      <input type="date" className="form-control"
                        value={editForm.endDate}
                        min={editForm.startDate || undefined}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button form="editFormYudisium" type="submit" className="btn-save-modal">Lanjutkan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="modal-overlay">
            <motion.div className="modal-container"
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
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                  Apakah Anda yakin ingin memperbarui periode{' '}
                  <strong>"{pendingUpdate?.name}"</strong>?
                </p>
                {pendingUpdate && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: '#F9FAFB', borderRadius: 8,
                    fontSize: 12, color: '#6B7280',
                  }}>
                    <div>{formatDate(pendingUpdate.startDate)} — {formatDate(pendingUpdate.endDate)}</div>
                    <div style={{ marginTop: 4 }}>
                      Status baru:{' '}
                      <strong>{getStatus(pendingUpdate.startDate, pendingUpdate.endDate)}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsConfirmModalOpen(false)}>Batal</button>
                <button className="btn-save-modal" onClick={handleConfirmUpdate} disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Ya, Perbarui'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert */}
      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay"
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message}
              style={{ margin: 0, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AturPeriodeYudisium;