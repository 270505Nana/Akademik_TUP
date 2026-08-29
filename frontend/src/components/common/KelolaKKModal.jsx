import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import '../admin/css/keloladatadosen.css';

const TambahKKModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Nama KK baru tidak boleh kosong.'); return; }

    setIsSaving(true);
    setError(null);
    try {
      await onCreate(trimmed);
      onClose();
    } catch {
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dd-modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <motion.div
        className="dd-modal-box dd-modal-edit"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <div className="dd-modal-header">
          <h3 className="dd-modal-title">Tambah Kelompok Keahlian</h3>
          <button className="dd-modal-close" onClick={onClose} disabled={isSaving}><X size={16} /></button>
        </div>

        <div className="dd-modal-body">
          {error && (
            <div className="dd-toggle-warning" style={{ marginBottom: 14 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
          <div className="dd-form-group" style={{ marginBottom: 0 }}>
            <label className="dd-form-label">Nama Kelompok Keahlian</label>
            <input
              className="dd-form-input"
              placeholder="Contoh: Software Engineering and Multimedia"
              value={name}
              autoFocus
              disabled={isSaving}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <div className="dd-modal-footer">
          <button className="dd-btn-cancel" onClick={onClose} disabled={isSaving}>Batal</button>
          <button className="dd-btn-save" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Modal utama Kelola KK.
// Props baru: onDelete(groupId) — async handler dari parent yang memanggil DELETE API.
const KelolaKKModal = ({ researchGroups, onClose, onRename, onCreate, onDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showTambah, setShowTambah] = useState(false);

  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const startEdit = (group) => {
    setConfirmDeleteId(null);
    setEditingId(group.id);
    setEditValue(group.name);
    setLocalError(null);
  };

  // handleConfirmEdit: kirim ke parent (async) lalu bersihkan state editing.
  const handleConfirmEdit = async (id) => {
    const trimmed = editValue.trim();
    if (!trimmed) { setLocalError('Nama KK tidak boleh kosong.'); return; }

    setBusyId(id);
    setLocalError(null);
    try {
      await onRename(id, trimmed);
    } finally {
      setEditingId(null);
      setEditValue('');
      setBusyId(null);
    }
  };

  const requestDelete = (groupId) => {
    setEditingId(null);   
    setLocalError(null);
    setConfirmDeleteId(groupId);
  };

  const handleConfirmDelete = async (groupId) => {
    setBusyId(groupId);
    setConfirmDeleteId(null);
    try {
      await onDelete(groupId);
    } finally {
      setBusyId(null);
    }
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  return (
    <div className="dd-modal-overlay" onClick={onClose}>
      <motion.div
        className="dd-modal-box dd-modal-kk"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <div className="dd-modal-header">
          <h3 className="dd-modal-title">Kelola Kelompok Keahlian</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="dd-btn-add-kk" onClick={() => setShowTambah(true)} disabled={!!busyId}>
              <Plus size={14} />
              Tambah KK
            </button>
            <button className="dd-modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="dd-modal-body">
          {localError && (
            <div className="dd-toggle-warning" style={{ marginBottom: 14 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {localError}
            </div>
          )}

          <div className="dd-kk-list" style={{ marginBottom: 0 }}>
            {researchGroups.map(group => {
              const isBusy = busyId === group.id;
              const isEditing = editingId === group.id;
              const isConfirmingDelete = confirmDeleteId === group.id;

              return (
                <div className="dd-kk-row" key={group.id}>
                  {isEditing ? (
                    <>
                      <input
                        className="dd-kk-row-input"
                        value={editValue}
                        autoFocus
                        disabled={isBusy}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit(group.id)}
                      />
                      <button
                        className="dd-btn-text save"
                        onClick={() => handleConfirmEdit(group.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button
                        className="dd-btn-text"
                        onClick={() => { setEditingId(null); setLocalError(null); }}
                        disabled={isBusy}
                      >
                        Batal
                      </button>
                    </>
                  ) : isConfirmingDelete ? (
                    <>
                      <span className="dd-kk-row-name" style={{ color: '#991B1B' }}>
                        Hapus &quot;{group.name}&quot;?
                      </span>
                      <button
                        className="dd-btn-text danger"
                        onClick={() => handleConfirmDelete(group.id)}
                        disabled={isBusy}
                      >
                        {isBusy ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                      <button
                        className="dd-btn-text"
                        onClick={cancelDelete}
                        disabled={isBusy}
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="dd-kk-row-name">{group.name}</span>
                      <button
                        className="dd-btn-text"
                        onClick={() => startEdit(group)}
                        disabled={!!busyId}
                      >
                        Edit
                      </button>
                      <button
                        className="dd-btn-text danger"
                        onClick={() => requestDelete(group.id)}
                        disabled={!!busyId}
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {showTambah && (
        <TambahKKModal
          onClose={() => setShowTambah(false)}
          onCreate={onCreate}
        />
      )}
    </div>
  );
};

export default KelolaKKModal;
