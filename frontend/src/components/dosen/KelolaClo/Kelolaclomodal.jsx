import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable'; 

import { createCLO, updateCLO, createSubCLO, createJenisAsesmen, getCLOs, getLecturerData } from '../../../service/api'; 
import '../../../style/css/dosen/kelolaclomodal.css';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#c0182a' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #c0182a' : 'none',
    padding: '2px 4px',
    borderRadius: '8px',
    fontSize: '13.5px',
    '&:hover': {
      borderColor: state.isFocused ? '#c0182a' : '#cbd5e1'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13.5px',
    backgroundColor: state.isSelected ? '#c0182a' : state.isFocused ? '#f8fafc' : '#fff',
    color: state.isSelected ? '#fff' : '#1e293b',
    '&:active': {
      backgroundColor: '#c0182a',
      color: '#fff'
    }
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#94a3b8'
  })
};

const KelolaCLOModal = ({ isOpen, onClose, existingData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // State Active Prodi
  const [activeProdiId, setActiveProdiId] = useState(null);

  // State Utama CLO
  const [cloNameOption, setCloNameOption] = useState(null); 
  const [cloDesc, setCloDesc] = useState('');
  
  // State Dinamis Sub CLO & Asesmen
  const [subClos, setSubClos] = useState([{ name: '', description: '' }]);
  const [asesmens, setAsesmens] = useState([{ content: '', bobot: '' }]);

  // State untuk Dropdown CLO
  const [cloOptions, setCloOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // Ambil data CLO & ID Prodi User saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      // 1. Fetch opsi dropdown CLO
      const fetchExistingCLOs = async () => {
        setIsLoadingOptions(true);
        try {
          const res = await getCLOs();
          const rawData = Array.isArray(res) ? res : (res?.data || []);
          const options = rawData.map(item => ({
            value: item.id,
            label: item.name,
            description: item.description
          }));
          setCloOptions(options);
        } catch (error) {
          console.error("Gagal mengambil data CLO:", error);
        } finally {
          setIsLoadingOptions(false);
        }
      };

      // 2. Fetch ID Prodi dari Backend (Anti-Gagal)
      const fetchActiveProdi = async () => {
        try {
          const userStr = localStorage.getItem("simta_user");
          if (!userStr) return;
          const u = JSON.parse(userStr);

          // Coba cari di local storage dulu
          let prodiId = u?.studyProgramId || u?.dosen?.studyProgramId || u?.kaprodi?.studyProgramId;

          // Jika tidak ada di local storage, request ke API Profil Dosen
          if (!prodiId && (u?.id || u?.userId)) {
            const userId = u.id || u.userId;
            const dosenProfile = await getLecturerData(userId);
            const dataDosen = dosenProfile?.data || dosenProfile;
            prodiId = dataDosen?.studyProgramId || dataDosen?.prodiId;
          }

          if (prodiId) {
            setActiveProdiId(String(prodiId));
          } else {
            console.warn("User ini tidak memiliki relasi Program Studi di database.");
          }
        } catch (err) {
          console.error("Gagal mengambil ID Prodi user:", err);
        }
      };

      fetchExistingCLOs();
      fetchActiveProdi();
    }
  }, [isOpen]);

  // Reset / Isi form data saat modal dibuka
  useEffect(() => {
    if (existingData) {
      setCloNameOption({ value: existingData.id, label: existingData.name });
      setCloDesc(existingData.description || '');
      setSubClos(existingData.subClo?.length ? existingData.subClo : [{ name: '', description: '' }]);
      setAsesmens(existingData.asesmen?.length ? existingData.asesmen : [{ content: '', bobot: '' }]);
    } else {
      setCloNameOption(null);
      setCloDesc('');
      setSubClos([{ name: '', description: '' }]);
      setAsesmens([{ content: '', bobot: '' }]);
    }
  }, [existingData, isOpen]);

  // Handler saat opsi CLO dipilih
  const handleCloChange = (selectedOption) => {
    setCloNameOption(selectedOption);
    if (selectedOption && selectedOption.__isNew__ !== true && selectedOption.description) {
      setCloDesc(selectedOption.description);
    } else if (selectedOption && selectedOption.__isNew__ === true) {
      setCloDesc(''); 
    }
  };

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
    
    if (!cloNameOption) {
      alert("Pilih atau ketik nama CLO terlebih dahulu!");
      return;
    }

    if (!activeProdiId) {
      alert("Gagal mendapatkan ID Program Studi. Pastikan Anda memiliki relasi Prodi di sistem.");
      return;
    }

    setLoading(true);

    try {
      if (existingData?.id) {
        // [MODE EDIT]
        await updateCLO(existingData.id, {
          name: cloNameOption.label,
          description: cloDesc,
          studyProgramId: activeProdiId 
        });
      } else {
        // [MODE CREATE]
        let finalCloId = cloNameOption.value;

        // Jika user mengetik nama CLO baru, tembak API Create CLO dulu
        if (cloNameOption.__isNew__) {
          const cloPayload = {
            name: cloNameOption.label,
            description: cloDesc,
            studyProgramId: activeProdiId 
          };
          
          const newClo = await createCLO(cloPayload);
          
          // Coba ekstrak ID dari berbagai format respons Backend
          finalCloId = newClo?.id || newClo?.data?.id || newClo?.cloId;

          // [SMART FALLBACK] Jika Backend tidak mengembalikan ID di response POST
          if (!finalCloId) {
            console.warn("Backend tidak merespons dengan ID, mengambil ulang daftar CLO...");
            const refreshClos = await getCLOs();
            const rawData = Array.isArray(refreshClos) ? refreshClos : (refreshClos?.data || []);
            
            // Cari CLO yang baru saja kita simpan berdasarkan namanya
            const justCreatedClo = rawData.find(c => c.name === cloNameOption.label);
            if (justCreatedClo) {
              finalCloId = justCreatedClo.id;
            } else {
              throw new Error("Sistem gagal melacak ID Induk CLO yang baru dibuat di database.");
            }
          }
        }

        // Create Semua Sub CLO secara berbarengan menggunakan ID yang sudah dipastikan valid
        const validSubClos = subClos.filter(s => s.name.trim() !== '');
        if (validSubClos.length > 0) {
          await Promise.all(validSubClos.map(sub => 
            createSubCLO({
              name: sub.name,
              description: sub.description,
              cloProdiId: String(finalCloId) // Pastikan dikirim sebagai string
            })
          ));
        }

        // Create Semua Jenis Asesmen secara berbarengan
        const validAsesmens = asesmens.filter(a => a.content.trim() !== '');
        if (validAsesmens.length > 0) {
          await Promise.all(validAsesmens.map(asm => 
            createJenisAsesmen({
              content: asm.content,
              bobot: parseFloat(asm.bobot) || 0,
              cloProdiId: String(finalCloId) // Pastikan dikirim sebagai string
            })
          ));
        }
      }

      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error("Gagal menyimpan data CLO:", error);
      const errorMsg = error.response?.data?.message || error.message || "Terjadi kesalahan saat menyimpan data.";
      alert(`Gagal: ${errorMsg}`);
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
              <CreatableSelect
                isClearable
                isLoading={isLoadingOptions}
                options={cloOptions}
                value={cloNameOption}
                onChange={handleCloChange}
                placeholder="Pilih atau ketik CLO baru..."
                formatCreateLabel={(inputValue) => `Buat CLO baru: "${inputValue}"`}
                styles={customSelectStyles}
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