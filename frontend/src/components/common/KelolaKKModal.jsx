import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import '../admin/css/keloladatadosen.css';

const TambahKKModal = ({ onClose, onCreate }) => {
  const [name,  setName]  = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Nama KK baru tidak boleh kosong.'); return; }
    onCreate(trimmed);
    onClose();
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
          <button className="dd-modal-close" onClick={onClose}><X size={16} /></button>
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
              onChange={(e) => { setName(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <div className="dd-modal-footer">
          <button className="dd-btn-cancel" onClick={onClose}>Batal</button>
          <button className="dd-btn-save" onClick={handleSubmit}>Simpan</button>
        </div>
      </motion.div>
    </div>
  );
};

const KelolaKKModal = ({ researchGroups, onClose, onRename, onCreate }) => {
  const [editingId,   setEditingId]   = useState(null);
  const [editValue,   setEditValue]   = useState('');
  const [localError,  setLocalError]  = useState(null);
  const [showTambah,  setShowTambah]  = useState(false);

  const startEdit = (group) => {
    setEditingId(group.id);
    setEditValue(group.name);
    setLocalError(null);
  };

  const confirmEdit = (id) => {
    const trimmed = editValue.trim();
    if (!trimmed) { setLocalError('Nama KK tidak boleh kosong.'); return; }
    onRename(id, trimmed);
    setEditingId(null);
    setEditValue('');
    setLocalError(null);
  };

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
            <button className="dd-btn-add-kk" onClick={() => setShowTambah(true)}>
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
            {researchGroups.map(group => (
              <div className="dd-kk-row" key={group.id}>
                {editingId === group.id ? (
                  <>
                    <input
                      className="dd-kk-row-input"
                      value={editValue}
                      autoFocus
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmEdit(group.id)}
                    />
                    <button className="dd-btn-text save" onClick={() => confirmEdit(group.id)}>
                      Simpan
                    </button>
                    <button className="dd-btn-text" onClick={() => { setEditingId(null); setLocalError(null); }}>
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <span className="dd-kk-row-name">{group.name}</span>
                    <button className="dd-btn-text" onClick={() => startEdit(group)}>
                      Edit
                    </button>
                  </>
                )}
              </div>
            ))}
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