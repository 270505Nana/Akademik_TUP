import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createCLO } from '../../../service/api';
import '../../../style/css/dosen/kelolaclomodal.css';

const errMsg = (err) => err?.response?.data?.message || err?.message || 'Terjadi kesalahan.';

const TambahCLOModal = ({ isOpen, onClose, prodiId, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setName(''); setDescription(''); setError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanName = name.trim();
    const cleanDesc = description.trim();

    if (!cleanName || !cleanDesc) return setError('Nama CLO dan deskripsi wajib diisi.');
    if (!prodiId) return setError('Program studi akun Anda tidak terbaca. Hubungi admin untuk memastikan akun terhubung ke prodi.');

    setLoading(true);
    try {
      const res = await createCLO({ name: cleanName, description: cleanDesc, studyProgramId: String(prodiId) });
      console.log('[createCLO] response:', res); 
      await onCreated?.(res, { name: cleanName, description: cleanDesc });
      onClose();
    } catch (err) {
      console.error('Gagal menambah CLO:', err);
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clo-modal-overlay clo-modal-overlay--top">
      <div className="clo-modal-content" style={{ maxWidth: 480 }}>
        <div className="clo-modal-header">
          <h3>Tambah CLO</h3>
          <button type="button" className="clo-modal-close" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="clo-modal-body">
          <div className="clo-form-group">
            <label>Nama CLO <span className="req">*</span></label>
            <input type="text" placeholder="Contoh: CLO 5.1" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="clo-form-group">
            <label>Deskripsi CLO <span className="req">*</span></label>
            <textarea rows={3} placeholder="Deskripsi kemampuan CLO..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <div className="clo-form-error" role="alert">{error}</div>}

          <div className="clo-modal-footer" style={{ position: 'static', margin: 0 }}>
            <button type="button" className="clo-btn-cancel" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="clo-btn-submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan CLO'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahCLOModal;