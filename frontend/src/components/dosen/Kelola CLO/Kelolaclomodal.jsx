import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createCLO, updateCLO, createSubCLO, createJenisAsesmen } from '../../service/api'; 
import '../../style/css/dosen/kelolaclomodal.css';

const KelolaCLOModal = ({ isOpen, onClose, existingData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // State Utama CLO
  const [cloName, setCloName] = useState('');
  const [cloDesc, setCloDesc] = useState('');
  
  // State Dinamis Sub CLO & Asesmen
  const [subClos, setSubClos] = useState([{ name: '', description: '' }]);
  const [asesmens, setAsesmens] = useState([{ content: '', bobot: '' }]);

  // Reset / Isi data saat modal dibuka
  useEffect(() => {
    if (existingData) {
      setCloName(existingData.name || '');
      setCloDesc(existingData.description || '');
      setSubClos(existingData.subClo?.length ? existingData.subClo : [{ name: '', description: '' }]);
      setAsesmens(existingData.asesmen?.length ? existingData.asesmen : [{ content: '', bobot: '' }]);
    } else {
      setCloName('');
      setCloDesc('');
      setSubClos([{ name: '', description: '' }]);
      setAsesmens([{ content: '', bobot: '' }]);
    }
  }, [existingData, isOpen]);

  if (!isOpen) return null;

  // --- HANDLER DINAMIS SUB CLO ---
  const handleAddSubClo = () => setSubClos([...subClos, { name: '', description: '' }]);
  const handleRemoveSubClo = (idx) => setSubClos(subClos.filter((_, i) => i !== idx));
  const handleChangeSubClo = (idx, field, value) => {
    const updated = [...subClos];
    updated[idx][field] = value;
    setSubClos(updated);
  };

  // --- HANDLER DINAMIS ASESMEN ---
  const handleAddAsesmen = () => setAsesmens([...asesmens, { content: '', bobot: '' }]);
  const handleRemoveAsesmen = (idx) => setAsesmens(asesmens.filter((_, i) => i !== idx));
  const handleChangeAsesmen = (idx, field, value) => {
    const updated = [...asesmens];
    updated[idx][field] = value;
    setAsesmens(updated);
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (existingData?.id) {
        // [MODE EDIT]
        await updateCLO(existingData.id, {
          name: cloName,
          description: cloDesc,
          studyProgramId: existingData.studyProgramId || "prodi-id-sementara"
        });
        
        // Catatan untuk Backend: Jika ingin update Sub CLO / Asesmen, butuh API PUT & DELETE khusus.
        // Untuk saat ini asumsinya PUT /api/clo hanya mengubah master CLO.
        
      } else {
        // [MODE CREATE]
        // 1. Create Master CLO
        const cloPayload = {
          name: cloName,
          description: cloDesc,
          studyProgramId: "prodi-id-sementara" // TODO: Sesuaikan dengan ID Prodi User yang login
        };
        const newClo = await createCLO(cloPayload);
        const newCloId = newClo.id; // Pastikan respon API backend mengembalikan 'id' disini

        // 2. Create Semua Sub CLO secara berbarengan (Parallel Request)
        const validSubClos = subClos.filter(s => s.name.trim() !== '');
        if (validSubClos.length > 0) {
          await Promise.all(validSubClos.map(sub => 
            createSubCLO({
              name: sub.name,
              description: sub.description,
              cloProdiId: newCloId
            })
          ));
        }

        // 3. Create Semua Jenis Asesmen secara berbarengan
        const validAsesmens = asesmens.filter(a => a.content.trim() !== '');
        if (validAsesmens.length > 0) {
          await Promise.all(validAsesmens.map(asm => 
            createJenisAsesmen({
              content: asm.content,
              bobot: parseFloat(asm.bobot) || 0,
              cloProdiId: newCloId
            })
          ));
        }
      }

      onSuccess(); // Refresh Data Tabel
      onClose();   // Tutup Modal
    } catch (error) {
      console.error("Gagal menyimpan data CLO:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clo-modal-overlay">
      <div className="clo-modal-content">
        
        <div className="clo-modal-header">
          <h3>{existingData ? 'Edit CLO & Asesmen' : 'Tambah CLO & Asesmen'}</h3>
          <button onClick={onClose} className="clo-modal-close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="clo-modal-body">
          
          {/* BAGIAN 1: MASTER CLO */}
          <div className="clo-form-section">
            <h4 className="clo-section-title">Informasi CLO</h4>
            <div className="clo-form-group">
              <label>Nama CLO <span className="req">*</span></label>
              <input 
                type="text" 
                placeholder="Contoh: CLO 5.1" 
                value={cloName} 
                onChange={(e) => setCloName(e.target.value)} 
                required 
              />
            </div>
            <div className="clo-form-group">
              <label>Deskripsi CLO <span className="req">*</span></label>
              <textarea 
                placeholder="Deskripsi kemampuan yang diharapkan..." 
                value={cloDesc} 
                onChange={(e) => setCloDesc(e.target.value)} 
                required 
                rows={3}
              />
            </div>
          </div>

          <hr className="clo-divider" />

          {/* BAGIAN 2: SUB CLO DINAMIS */}
          <div className="clo-form-section">
            <div className="clo-section-header">
              <h4 className="clo-section-title">Daftar Sub CLO</h4>
              <button type="button" className="clo-btn-add-sm" onClick={handleAddSubClo}>
                <Plus size={14} /> Tambah Sub
              </button>
            </div>
            
            {subClos.map((sub, idx) => (
              <div key={idx} className="clo-dynamic-row">
                <div className="clo-dynamic-fields">
                  <input 
                    type="text" 
                    placeholder="Nama Sub (Contoh: Sub CLO 5.1.1)" 
                    value={sub.name} 
                    onChange={(e) => handleChangeSubClo(idx, 'name', e.target.value)} 
                  />
                  <input 
                    type="text" 
                    placeholder="Deskripsi Sub CLO..." 
                    value={sub.description} 
                    onChange={(e) => handleChangeSubClo(idx, 'description', e.target.value)} 
                  />
                </div>
                {subClos.length > 1 && (
                  <button type="button" className="clo-btn-remove" onClick={() => handleRemoveSubClo(idx)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <hr className="clo-divider" />

          {/* BAGIAN 3: ASESMEN DINAMIS */}
          <div className="clo-form-section">
            <div className="clo-section-header">
              <h4 className="clo-section-title">Daftar Jenis Asesmen</h4>
              <button type="button" className="clo-btn-add-sm" onClick={handleAddAsesmen}>
                <Plus size={14} /> Tambah Asesmen
              </button>
            </div>
            
            {asesmens.map((asm, idx) => (
              <div key={idx} className="clo-dynamic-row">
                <div className="clo-dynamic-fields asesmen-fields">
                  <input 
                    type="text" 
                    placeholder="Konten / Nama Asesmen..." 
                    value={asm.content} 
                    onChange={(e) => handleChangeAsesmen(idx, 'content', e.target.value)} 
                  />
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Bobot (ex: 0.1)" 
                    value={asm.bobot} 
                    onChange={(e) => handleChangeAsesmen(idx, 'bobot', e.target.value)} 
                  />
                </div>
                {asesmens.length > 1 && (
                  <button type="button" className="clo-btn-remove" onClick={() => handleRemoveAsesmen(idx)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* FOOTER ACTION */}
          <div className="clo-modal-footer">
            <button type="button" className="clo-btn-cancel" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="clo-btn-submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (existingData ? 'Simpan Perubahan' : 'Submit CLO')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default KelolaCLOModal;