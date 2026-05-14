import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, Edit3, Trash2, LayoutPanelLeft, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import '../../components/admin/css/aturperiode.css';
import {getSidangPeriods,createSidangPeriod,updateSidangPeriod,deleteSidangPeriod,} from '../../service/api'

const AturPeriode = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [sidangPeriods, setSidangPeriods] = useState([]);
  const [sidangLoading, setSidangLoading] = useState(true); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',startDate: '', endDate: '', type: '' // 'sidang' or 'yudisium'
  });

  const [form, setForm] = useState({ name: '',startDate: '',endDate: ''});
  
  const [sidangForm, setSidangForm] = useState({name: '',startDate: '', endDate: ''  });

  const [alert, setAlert] = useState({
    show: false,type: 'success', title: '', message: '' });

  useEffect(() => {
    const fetchSidang = async () => {
      try {
        setSidangLoading(true);
        const data = await getSidangPeriods();
        const normalized = (data ?? []).map(p => ({
          ...p,
          startDate: p.startDate?.slice(0, 10) ?? p.startDate,
          endDate:   p.endDate?.slice(0, 10)   ?? p.endDate,
        }));
        setSidangPeriods(normalized);
      } catch (err) {
        console.error('Gagal fetch sidang periods:', err);
        showAlert('error', 'Gagal', 'Gagal memuat data periode sidang dari server.');
      } finally {
        setSidangLoading(false);
      }
    };

    // Yudisium dummy
    const savedYudisium = localStorage.getItem('simta_periods_yudisium');
    if (savedYudisium) {
      setPeriods(JSON.parse(savedYudisium));
    } else {
      const defaults = [
        { id: '1', name: 'Gelombang 2 - Genap',  startDate: '2026-05-01', endDate: '2026-05-15' },
        { id: '2', name: 'Gelombang 1 - Genap',  startDate: '2026-04-01', endDate: '2026-04-20' },
        { id: '3', name: 'Yudisium Ganjil 2025', startDate: '2025-12-01', endDate: '2025-12-15' },
      ];
      setPeriods(defaults);
      localStorage.setItem("simta_periods_yudisium", JSON.stringify(defaults));
    }

    fetchSidang();
  }, []);

  // status [mendatang, aktif, selesai]
  const getStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (now < startDate) return "Mendatang";
    if (now > endDate) return "Selesai";
    return "Aktif";
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const getSidangStatus = (start, end, isOpen) => {
    if (isOpen === true) return "Aktif";

    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (now < startDate) return "Mendatang";
    if (now > endDate) return "Selesai";
    return "Aktif";
  };

  const handleSaveYudisium = (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      showAlert("error", "Gagal", "Harap lengkapi semua bidang input.");
      return;
    }
    const newPeriod = { id: Date.now().toString(), ...form };
    const updated = [newPeriod, ...periods];
    setPeriods(updated);
    localStorage.setItem("simta_periods_yudisium", JSON.stringify(updated));
    setForm({ name: "", startDate: "", endDate: "" });
    showAlert(
      "success",
      "Berhasil",
      "Data periode yudisium telah berhasil disimpan.",
    );
  };

  const handleSaveSidang = async (e) => {
    e.preventDefault();
    if (!sidangForm.name || !sidangForm.startDate || !sidangForm.endDate) {
      showAlert("error", "Gagal", "Harap lengkapi semua bidang input.");
      return;
    }
    try {
      const created = await createSidangPeriod(sidangForm);
      const normalized = {
        ...created,
        startDate: created.startDate?.slice(0, 10) ?? created.startDate,
        endDate:   created.endDate?.slice(0, 10)   ?? created.endDate,
      };
      setSidangPeriods(prev => [normalized, ...prev]);
      setSidangForm({ name: '', startDate: '', endDate: '' });
      showAlert('success', 'Berhasil', 'Data periode sidang telah berhasil disimpan.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan periode sidang.';
      showAlert('error', 'Gagal', msg);
    }
  };

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  };

  const deletePeriod = async (id, type) => {
    if (type === 'yudisium') {
      const updated = periods.filter(p => p.id !== id);
      setPeriods(updated);
      localStorage.setItem('simta_periods_yudisium', JSON.stringify(updated));
      showAlert('warning', 'Dihapus', 'Data periode telah dihapus.');
    } else {
      try {
        await deleteSidangPeriod(id);
        setSidangPeriods(prev => prev.filter(p => p.id !== id));
        showAlert('warning', 'Dihapus', 'Data periode sidang telah dihapus.');
      } catch (err) {
        const msg = err.response?.data?.message || 'Gagal menghapus periode sidang.';
        showAlert('error', 'Gagal', msg);
      }
    }
  };

  // Modal handlers
  const openEditModal = (item, type) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      startDate: formatDateForInput(item.startDate),
      endDate: formatDateForInput(item.endDate),
      isOpen: item.isOpen ?? true,
      type: type,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      showAlert("error", "Gagal", "Harap lengkapi semua bidang input.");
      return;
    }

    if (editForm.type === 'yudisium') {
      // Yudisium masih localStorage
      const updated = periods.map(p =>
        p.id === editingItem.id ? { ...p, ...editForm } : p
      );
      setPeriods(updated);
      localStorage.setItem('simta_periods_yudisium', JSON.stringify(updated));
      setIsEditModalOpen(false);
      showAlert('success', 'Berhasil', `Periode ${editForm.name} telah diperbarui.`);
    } else {
      try {
        const updated = await updateSidangPeriod(editingItem.id, {
          name:      editForm.name,
          startDate: editForm.startDate,
          endDate:   editForm.endDate,
        });
        const normalized = {
          ...updated,
          startDate: updated.startDate?.slice(0, 10) ?? updated.startDate,
          endDate:   updated.endDate?.slice(0, 10)   ?? updated.endDate,
        };
        setSidangPeriods(prev =>
          prev.map(p => p.id === editingItem.id ? normalized : p)
        );
        setIsEditModalOpen(false);
        showAlert('success', 'Berhasil', `Periode ${editForm.name} telah diperbarui.`);
      } catch (err) {
        const msg = err.response?.data?.message || 'Gagal memperbarui periode sidang.';
        showAlert('error', 'Gagal', msg);
      }
    }
  };


  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <SidebarAdmin
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, icon, type) =>
          showAlert(type === "warning" ? "warning" : "success", "Info", msg)
        }
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mobile-menu-bar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Kelola Periode Sidang & Yudisium</h1>
          </div>

          <div className="content-container">
            <h2 className="page-title">Atur Periode</h2>

            <section className="card-main">
              <div className="card-header">
                <ClipboardList className="card-icon-red" size={24} />
                <h3>Tambah Periode Sidang</h3>
              </div>

              <div className="card-body">
                {/* Form periode sidang */}
                <form onSubmit={handleSaveSidang}>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Nama Periode Sidang</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Periode Sidang Semester Genap 2025/2026"
                        value={sidangForm.name}
                        onChange={(e) =>
                          setSidangForm({ ...sidangForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input
                          type="date"
                          className="form-control"
                          value={sidangForm.startDate}
                          onChange={(e) =>
                            setSidangForm({
                              ...sidangForm,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai</label>
                          <input
                            type="date"
                            className="form-control"
                            value={sidangForm.endDate}
                            onChange={(e) =>
                              setSidangForm({
                                ...sidangForm,
                                endDate: e.target.value,
                              })
                            }
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

            {/* Daftar Periode Sidang */}
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
                        {sidangPeriods.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px', fontSize: 13 }}>
                              Belum ada periode sidang.
                            </td>
                          </tr>
                        ) : sidangPeriods.map(period => {
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
                                    <button className="btn-outline" onClick={() => openEditModal(period, 'sidang')}>
                                      <Edit3 size={16} /> Edit
                                    </button>
                                  )}
                                  {status === 'Aktif' && (
                                    <>
                                      <button className="btn-outline btn-outline-red">Tutup</button>
                                      <button className="btn-outline" onClick={() => openEditModal(period, 'sidang')}>
                                        <Edit3 size={16} /> Edit
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
                )}
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
                      <label className="form-label">
                        Nama Periode Yudisium
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Semester Genap 2025/2026 - Gel 2"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-grid-inner">
                      <div className="form-group">
                        <label className="form-label">Tanggal Mulai</label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.startDate}
                          onChange={(e) =>
                            setForm({ ...form, startDate: e.target.value })
                          }
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="date-separator">s/d</span>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Tanggal Selesai</label>
                          <input
                            type="date"
                            className="form-control"
                            value={form.endDate}
                            onChange={(e) =>
                              setForm({ ...form, endDate: e.target.value })
                            }
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
                      {periods.map((period) => {
                        const status = getStatus(
                          period.startDate,
                          period.endDate,
                        );
                        return (
                          <tr key={period.id}>
                            <td className="periode-name">{period.name}</td>
                            <td>{formatDate(period.startDate)}</td>
                            <td>{formatDate(period.endDate)}</td>
                            <td>
                              <span
                                className={`badge badge-${status.toLowerCase()}`}
                              >
                                {status}
                              </span>
                            </td>
                            <td>
                              <div className="action-stack">
                                {status === "Mendatang" && (
                                  <button
                                    className="btn-outline"
                                    onClick={() =>
                                      openEditModal(period, "yudisium")
                                    }
                                  >
                                    <Edit3 size={16} /> Edit
                                  </button>
                                )}
                                {status === "Aktif" && (
                                  <>
                                    <button className="btn-outline btn-outline-red">
                                      Tutup
                                    </button>
                                    <button
                                      className="btn-outline"
                                      onClick={() =>
                                        openEditModal(period, "yudisium")
                                      }
                                    >
                                      <Edit3 size={16} /> Edit
                                    </button>
                                  </>
                                )}
                                {status === "Selesai" && (
                                  <button className="btn-outline">
                                    Detail
                                  </button>
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
                <button
                  className="btn-close"
                  onClick={() => setIsEditModalOpen(false)}
                >
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
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Mulai</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editForm.startDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tanggal Berakhir</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editForm.endDate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, endDate: e.target.value })
                        }
                      />
                    </div>
                    {editForm.type === "sidang" && (
                      <div className="form-group">
                        <label className="form-label">Status Buka</label>
                        <select
                          className="form-control"
                          value={editForm.isOpen ? "true" : "false"}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              isOpen: e.target.value === "true",
                            })
                          }
                        >
                          <option value="true">Buka</option>
                          <option value="false">Tutup</option>
                        </select>
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  form="editForm"
                  type="submit"
                  className="btn-save-modal"
                >
                  Update Periode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Konfirmasi Perubahan</h3>
                <button
                  className="btn-close"
                  onClick={() => setIsConfirmModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Apakah Anda yakin ingin memperbarui periode{" "}
                  <strong>{editForm.name}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-cancel"
                  onClick={() => setIsConfirmModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="btn-save-modal"
                  onClick={handleConfirmUpdate}
                >
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
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            <CustomAlert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              style={{
                margin: 0,
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AturPeriode;
