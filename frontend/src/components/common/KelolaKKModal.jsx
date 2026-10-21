import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import Select from 'react-select'; 
import api from '../../service/api'; 
import '../../style/css/admin/keloladatadosen.css';

const customSelectStyles = {
  control: (base) => ({ ...base, fontSize: '13px', borderRadius: '6px', minHeight: '38px', borderColor: '#cbd5e1' }),
  menu: (base) => ({ ...base, fontSize: '13px', zIndex: 9999 }),
};

const FormKKModal = ({ onClose, onSave, existingData, studyPrograms }) => {
  const [name, setName] = useState(existingData?.name || '');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const prodiOptions = useMemo(() => {
    const safeData = Array.isArray(studyPrograms) ? studyPrograms : [];
    return safeData.map(p => ({ value: p.id, label: p.name }));
  }, [studyPrograms]);

  const [selectedProdi, setSelectedProdi] = useState([]);

  useEffect(() => {
    const fetchAndMapData = async () => {
      if (!existingData) return;

      let list = existingData.researchGroupStudyPrograms;

      if (!list || (Array.isArray(list) && list.length === 0)) {
        try {
          setIsLoadingDetail(true);
          const res = await api.get(`/api/research-groups/${existingData.id}`);
          const detail = res.data?.data || res.data;
          list = detail.researchGroupStudyPrograms || [];
        } catch (err) {
          console.warn('Gagal mengambil detail relasi KK:', err);
          list = [];
        } finally {
          setIsLoadingDetail(false);
        }
      }

      if (!Array.isArray(list)) list = [];

      const mapped = list.map(item => {
        const id = item.studyProgramId;
        const match = prodiOptions.find(opt => String(opt.value) === String(id));
        return match || { value: id, label: item.studyProgram?.name || id };
      }).filter(item => item.value);

      setSelectedProdi(mapped);
    };

    fetchAndMapData();
  }, [existingData, prodiOptions]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Nama KK tidak boleh kosong.'); return; }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: trimmed,
        isActive: true,
        studyProgramIds: selectedProdi.map(p => p.value)
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
      setIsSaving(false);
    }
  };

  return (
    <div className="dd-modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <motion.div
        className="dd-modal-box dd-modal-edit"
        onClick={e => e.stopPropagation()}
        style={{ overflow: 'visible' }} 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <div className="dd-modal-header">
          <h3 className="dd-modal-title">{existingData ? 'Edit Kelompok Keahlian' : 'Tambah Kelompok Keahlian'}</h3>
          <button className="dd-modal-close" onClick={onClose} disabled={isSaving}><X size={16} /></button>
        </div>

        <div className="dd-modal-body" style={{ overflow: 'visible' }}>
          {error && (
            <div className="dd-toggle-warning" style={{ marginBottom: 14 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
          
          <div className="dd-form-group">
            <label className="dd-form-label">Nama Kelompok Keahlian</label>
            <input
              className="dd-form-input"
              placeholder="Contoh: Software Engineering and Multimedia"
              value={name}
              autoFocus
              disabled={isSaving || isLoadingDetail}
              onChange={(e) => { setName(e.target.value); setError(null); }}
            />
          </div>

          <div className="dd-form-group" style={{ marginBottom: 0 }}>
            <label className="dd-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Program Studi (Rumpun Ilmu)
              {isLoadingDetail && <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>Memuat...</span>}
            </label>
            <Select
              isMulti
              options={prodiOptions}
              value={selectedProdi}
              onChange={setSelectedProdi}
              isDisabled={isSaving || isLoadingDetail}
              placeholder="Pilih satu/lebih program studi..."
              noOptionsMessage={() => "Tidak ada data prodi"}
              styles={customSelectStyles}
              menuPosition="fixed"
            />
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'block' }}>
              * Menentukan hak akses Ketua KK untuk validasi CLO dari Prodi di atas.
            </span>
          </div>
        </div>

        <div className="dd-modal-footer">
          <button className="dd-btn-cancel" onClick={onClose} disabled={isSaving}>Batal</button>
          <button className="dd-btn-save" onClick={handleSubmit} disabled={isSaving || isLoadingDetail}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const KelolaKKModal = ({ researchGroups, studyPrograms, onClose, onUpdate, onCreate, onDelete }) => {
  const [editingGroup, setEditingGroup] = useState(null);
  const [showTambah, setShowTambah] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [localError, setLocalError] = useState(null);

  const requestDelete = (groupId) => {
    setLocalError(null);
    setConfirmDeleteId(groupId);
  };

  const handleConfirmDelete = async (groupId) => {
    setBusyId(groupId);
    setConfirmDeleteId(null);
    try {
      await onDelete(groupId);
    } catch(e) {
      setLocalError('Gagal menghapus kelompok keahlian.');
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
              const isConfirmingDelete = confirmDeleteId === group.id;

              return (
                <div className="dd-kk-row" key={group.id}>
                  {isConfirmingDelete ? (
                    <>
                      <span className="dd-kk-row-name" style={{ color: '#991B1B' }}>
                        Hapus &quot;{group.name}&quot;?
                      </span>
                      <button className="dd-btn-text danger" onClick={() => handleConfirmDelete(group.id)} disabled={isBusy}>
                        {isBusy ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                      <button className="dd-btn-text" onClick={cancelDelete} disabled={isBusy}>Batal</button>
                    </>
                  ) : (
                    <>
                      <span className="dd-kk-row-name">{group.name}</span>
                      <button className="dd-btn-text" onClick={() => setEditingGroup(group)} disabled={!!busyId}>Edit</button>
                      <button className="dd-btn-text danger" onClick={() => requestDelete(group.id)} disabled={!!busyId}>Hapus</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {showTambah && (
        <FormKKModal 
          studyPrograms={studyPrograms} 
          onClose={() => setShowTambah(false)} 
          onSave={onCreate} 
        />
      )}

      {editingGroup && (
        <FormKKModal 
          existingData={editingGroup} 
          studyPrograms={studyPrograms} 
          onClose={() => setEditingGroup(null)} 
          onSave={(payload) => onUpdate(editingGroup.id, payload)} 
        />
      )}
    </div>
  );
};

export default KelolaKKModal;