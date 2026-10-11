import '../../../style/css/admin/KelolaRuanganModal.css';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllRuangan, createRuangan, updateRuangan, deleteRuangan } from '../../../service/api'; 

export default function KelolaRuanganModal({ isOpen, onClose }) {
  const [ruanganList, setRuanganList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ name: '', gedung: '', isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) fetchRuangan();
  }, [isOpen]);

  const fetchRuangan = async () => {
    setLoading(true);
    try {
      const res = await getAllRuangan();
      const data = Array.isArray(res) ? res : (res?.data || []);
      setRuanganList(data);
    } catch (error) {
      console.error("Gagal mengambil data ruangan", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setSelectedId(null);
    setFormData({ name: '', gedung: '', isActive: true });
    setIsFormOpen(true);
  };

  const handleEdit = (ruang) => {
    setSelectedId(ruang.id);
    setFormData({ 
      name: ruang.name, 
      gedung: ruang.gedung, 
      isActive: ruang.isActive ?? true 
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah kamu yakin ingin menghapus ruangan "${name}"?`)) {
      try {
        await deleteRuangan(id);
        alert('Ruangan berhasil dihapus.');
        fetchRuangan(); 
      } catch (error) {
        console.error("Gagal menghapus ruangan", error);
        alert('Gagal menghapus ruangan. Silakan coba lagi.');
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.gedung) return;
    
    setIsSubmitting(true);
    try {
      if (selectedId) {
        await updateRuangan(selectedId, formData);
      } else {
        await createRuangan(formData);
      }
      
      await fetchRuangan(); 
      handleCloseForm();    
    } catch (error) {
      console.error("Gagal menyimpan data ruangan", error);
      alert("Gagal menyimpan data ruangan, silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="krm-overlay">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} className="krm-modal">
          <div className="krm-header">
            <h2 className="krm-title">Kelola Ruangan</h2>
            <div className="krm-header-actions">
              <button onClick={handleOpenForm} className="krm-btn-add"><span>+</span> Tambah Ruangan</button>
              <button onClick={onClose} className="krm-btn-close"><X size={18} /></button>
            </div>
          </div>

          <div className="krm-body">
            {loading ? (
              <p className="krm-empty-text">Memuat data ruangan...</p>
            ) : ruanganList.length === 0 ? (
              <p className="krm-empty-text">Belum ada ruangan yang terdaftar.</p>
            ) : (
              ruanganList.map((ruang) => (
                <div key={ruang.id} className="krm-list-item">
                  <div>
                    <h3 className="krm-item-title">
                      {ruang.name}
                      {!ruang.isActive && <span style={{ marginLeft: 8, fontSize: 10, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: 4 }}>Nonaktif</span>}
                    </h3>
                    <p className="krm-item-subtitle">{ruang.gedung}</p>
                  </div>
                  <div className="krm-item-actions">
                    <button onClick={() => handleEdit(ruang)} className="krm-btn-edit">Edit</button>
                    <button onClick={() => handleDelete(ruang.id, ruang.name)} className="krm-btn-delete">Hapus</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="krm-form-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="krm-form-modal">
              <div className="krm-form-header">
                <h3 className="krm-form-title">{selectedId ? 'Edit Ruangan' : 'Tambah Ruangan'}</h3>
                <button onClick={handleCloseForm} className="krm-form-close"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="krm-form-group">
                  <label className="krm-label">Nama Ruangan</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: Ruang A302" className="krm-input" required />
                </div>
                <div className="krm-form-group">
                  <label className="krm-label">Gedung</label>
                  <input type="text" name="gedung" value={formData.gedung} onChange={handleChange} placeholder="Contoh: Gedung IoT" className="krm-input" required />
                </div>
                
                <div className="krm-form-group last" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ cursor: 'pointer' }} />
                  <label className="krm-label" style={{ margin: 0, cursor: 'pointer' }}>Status Aktif</label>
                </div>

                <div className="krm-form-actions">
                  <button type="button" onClick={handleCloseForm} className="krm-btn-cancel">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="krm-btn-save">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}