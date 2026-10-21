import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Select from 'react-select';

import { createSubCLO, createJenisAsesmen, getCLOs, getLecturerData } from '../../../service/api';
import TambahCLOModal from '../../dosen/KelolaClo/Tambahclomodal';
import '../../../style/css/dosen/kelolaclomodal.css';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#c0182a' : '#cbd5e1',
    boxShadow: state.isFocused ? '0 0 0 1px #c0182a' : 'none',
    padding: '2px 4px',
    borderRadius: '8px',
    fontSize: '13.5px',
    '&:hover': { borderColor: state.isFocused ? '#c0182a' : '#cbd5e1' },
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13.5px',
    backgroundColor: state.isSelected ? '#c0182a' : state.isFocused ? '#f8fafc' : '#fff',
    color: state.isSelected ? '#fff' : '#1e293b',
    '&:active': { backgroundColor: '#c0182a', color: '#fff' },
  }),
  placeholder: (provided) => ({ ...provided, color: '#94a3b8' }),
};

//  Helpers 
const pickList = (item, keys) => {
  for (const k of keys) {
    if (Array.isArray(item?.[k]) && item[k].length) return item[k];
  }
  return [];
};
const getSubList = (item) => pickList(item, ['subcloProdi', 'subClo', 'subclo_prodi', 'subClos']);
const getAsmList = (item) => pickList(item, ['jenisAsesmen', 'jenisAsesmenClo', 'jenisAsesmenProdi', 'asesmen']);
const extractId = (res) => res?.id ?? res?.data?.id ?? res?.cloId;
const errMsg = (err) => err?.response?.data?.message || err?.message || 'Terjadi kesalahan.';

const newSub = () => ({ name: '', description: '', saved: false });
const newAsm = () => ({ content: '', bobot: '', saved: false });
const mapSavedSubs = (list) => (list.length ? list.map((s) => ({ name: s.name || '', description: s.description || '', saved: true })) : [newSub()]);
const mapSavedAsms = (list) => (list.length ? list.map((a) => ({ content: a.content || '', bobot: a.bobot ?? '', saved: true })) : [newAsm()]);

const toOption = (item) => ({
  value: item.id,
  label: `${item.name}${item.studyProgram?.name ? ` (${item.studyProgram.name})` : ''}`,
  name: item.name,
  description: item.description,
  raw: item,
});

const KelolaCLOModal = ({ isOpen, onClose, existingData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeProdiId, setActiveProdiId] = useState(null);

  const [cloOptions, setCloOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const [subClos, setSubClos] = useState([newSub()]);
  const [asesmens, setAsesmens] = useState([newAsm()]);

  const [isAddCloOpen, setIsAddCloOpen] = useState(false);

  const selectedCloId = selectedOption?.value ?? null;
  const isLocked = !selectedCloId;
  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true);
    try {
      let res;
      try {
        res = await getCLOs({ limit: 100 });
      } catch {
        res = await getCLOs({ limit: 50 });
      }
      const raw = Array.isArray(res) ? res : res?.data || [];
      const options = raw.map(toOption);
      setCloOptions(options);
      return options;
    } catch (err) {
      console.error('Gagal memuat opsi CLO:', err);
      return [];
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const resolveProdi = async () => {
      try {
        const u = JSON.parse(localStorage.getItem('simta_user') || 'null');
        if (!u) return null;
        let id = u.studyProgramId || u.dosen?.studyProgramId || u.kaprodi?.studyProgramId;
        if (!id && (u.id || u.userId)) {
          const profile = await getLecturerData(u.id || u.userId);
          const d = profile?.data || profile;
          id = d?.studyProgramId || d?.prodiId;
        }
        return id ? String(id) : null;
      } catch (err) {
        console.error('Gagal membaca prodi dosen:', err);
        return null;
      }
    };

    resolveProdi().then((id) => { if (!cancelled) setActiveProdiId(id); });
    loadOptions();
    return () => { cancelled = true; };
  }, [isOpen, loadOptions]);

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setIsAddCloOpen(false);
    if (existingData) {
      setSelectedOption(toOption(existingData));
      setSubClos(mapSavedSubs(getSubList(existingData)));
      setAsesmens(mapSavedAsms(getAsmList(existingData)));
    } else {
      setSelectedOption(null);
      setSubClos([newSub()]);
      setAsesmens([newAsm()]);
    }
  }, [existingData, isOpen]);

  const handleSelectClo = (opt) => {
    setFormError('');
    setSelectedOption(opt);
    setSubClos(mapSavedSubs(opt ? getSubList(opt.raw) : []));
    setAsesmens(mapSavedAsms(opt ? getAsmList(opt.raw) : []));
  };

  const handleCloCreated = async (res, { name, description }) => {
    const id = extractId(res);
    const options = await loadOptions();

    let opt = id
      ? options.find((o) => String(o.value) === String(id))
      : options.find((o) => o.name === name && String(o.raw.studyProgramId) === String(activeProdiId));

    if (!opt && id) {
      opt = toOption({ id, name, description, studyProgramId: activeProdiId });
      setCloOptions((prev) => [...prev, opt]);
    }

    if (opt) {
      handleSelectClo(opt);
      onSuccess?.();
    } else {
      setFormError('CLO tersimpan, tetapi ID-nya tidak terbaca dari response server. Tutup modal, muat ulang halaman, lalu pilih CLO dari daftar.');
    }
  };

  const updateRow = (setter) => (idx, field, value) =>
    setter((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  const handleChangeSubClo = updateRow(setSubClos);
  const handleChangeAsesmen = updateRow(setAsesmens);
  const removeRow = (setter) => (idx) => setter((rows) => rows.filter((_, i) => i !== idx));

  const totalBobot = asesmens.reduce((sum, a) => sum + (parseFloat(a.bobot) || 0), 0);
  const totalLabel = `${Math.round(totalBobot * 1000) / 1000} (${Math.round(totalBobot * 1000) / 10}%)`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCloId) {
      alert('CLO belum dipilih. Jika CLO belum terdaftar, silakan daftarkan CLO terlebih dahulu dengan tombol "Tambah CLO".');
      return;
    }

    const subsToSave = subClos.filter((s) => !s.saved && s.name.trim());
    const asmsToSave = asesmens.filter((a) => !a.saved && a.content.trim());

    if (!subsToSave.length && !asmsToSave.length) {
      return setFormError('Tidak ada Sub CLO atau Jenis Asesmen baru untuk disimpan.');
    }
    const invalid = asmsToSave.find((a) => {
      const b = parseFloat(a.bobot);
      return Number.isNaN(b) || b <= 0 || b > 1;
    });
    if (invalid) return setFormError('Bobot harus desimal antara 0 dan 1 (contoh: 0.2 untuk 20%).');

    setLoading(true);
    try {
      const cloId = String(selectedCloId);
      const [subRes, asmRes] = await Promise.all([
        Promise.allSettled(subsToSave.map((s) => createSubCLO({ name: s.name.trim(), description: s.description.trim(), cloProdiId: cloId }))),
        Promise.allSettled(asmsToSave.map((a) => createJenisAsesmen({ content: a.content.trim(), bobot: parseFloat(a.bobot), cloProdiId: cloId }))),
      ]);

      const okSubs = new Set(subsToSave.filter((_, i) => subRes[i].status === 'fulfilled'));
      const okAsms = new Set(asmsToSave.filter((_, i) => asmRes[i].status === 'fulfilled'));
      setSubClos((rows) => rows.map((r) => (okSubs.has(r) ? { ...r, saved: true } : r)));
      setAsesmens((rows) => rows.map((r) => (okAsms.has(r) ? { ...r, saved: true } : r)));

      const failed = [...subRes, ...asmRes].filter((r) => r.status === 'rejected');
      onSuccess?.();
      if (failed.length) {
        setFormError(`${failed.length} item gagal disimpan: ${errMsg(failed[0].reason)}. Item lain sudah tersimpan, perbaiki lalu simpan lagi.`);
        return;
      }
      onClose();
    } catch (err) {
      console.error('Gagal simpan Sub CLO / Asesmen:', err);
      setFormError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const lockStyle = { cursor: isLocked ? 'not-allowed' : undefined };
  const noClosYet = !isLoadingOptions && cloOptions.length === 0 && !existingData;

  return (
    <>
      <div className="clo-modal-overlay">
        <div className="clo-modal-content">
          <div className="clo-modal-header">
            <h3>{existingData ? 'Edit CLO & Asesmen' : 'Tambah Sub CLO & Asesmen'}</h3>
            <button type="button" onClick={onClose} className="clo-modal-close" aria-label="Tutup"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="clo-modal-body">
            {/* 1. PILIH CLO */}
            <div className="clo-form-section">
              <div className="clo-section-header">
                <h4 className="clo-section-title">1. Pilih CLO</h4>
                {selectedCloId && <span className="clo-badge-success"><CheckCircle2 size={14} /> Terpilih</span>}
              </div>

              <div className="clo-form-group">
                <div className="clo-label-row">
                  <label>Nama CLO <span className="req">*</span></label>
                  {!existingData && (
                    <button type="button" className="clo-btn-tambah-clo" onClick={() => setIsAddCloOpen(true)}>
                      <Plus size={14} /> Tambah CLO
                    </button>
                  )}
                </div>
                <Select
                  isClearable
                  isLoading={isLoadingOptions}
                  options={cloOptions}
                  value={selectedOption}
                  onChange={handleSelectClo}
                  placeholder="Pilih CLO yang sudah terdaftar..."
                  noOptionsMessage={() => 'Belum ada CLO. Klik "Tambah CLO" untuk mendaftarkan.'}
                  styles={customSelectStyles}
                  isDisabled={!!existingData}
                />
              </div>

              {selectedOption ? (
                <div className="clo-form-group">
                  <label>Deskripsi CLO</label>
                  <div className="clo-desc-readonly">{selectedOption.description || selectedOption.raw?.description || '-'}</div>
                </div>
              ) : (
                <div className="clo-warning">
                  {noClosYet
                    ? 'Belum ada CLO yang terdaftar. Silakan daftarkan CLO terlebih dahulu dengan tombol "Tambah CLO".'
                    : 'Pilih CLO dari daftar. Jika CLO belum terdaftar, silakan daftarkan CLO terlebih dahulu dengan tombol "Tambah CLO".'}
                </div>
              )}
            </div>

            <hr className="clo-divider" />

            <div style={{ opacity: isLocked ? 0.6 : 1, transition: 'opacity 0.3s', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 2. SUB CLO */}
              <div className="clo-form-section">
                <div className="clo-section-header">
                  <div className="clo-section-title-wrap">
                    <h4 className="clo-section-title">2. Daftar Sub CLO</h4>
                    {isLocked && <span className="clo-hint-lock">Pilih CLO dulu</span>}
                  </div>
                  <button type="button" className="clo-btn-add-sm" style={lockStyle} disabled={isLocked} onClick={() => setSubClos((r) => [...r, newSub()])}>
                    <Plus size={14} /> Tambah Sub
                  </button>
                </div>

                {subClos.map((sub, idx) => (
                  <div key={idx} className={`clo-dynamic-row ${sub.saved ? 'is-saved' : ''}`}>
                    <div className="clo-dynamic-fields">
                      <input type="text" placeholder="Nama Sub (contoh: Sub CLO 5.1.1)" value={sub.name}
                        onChange={(e) => handleChangeSubClo(idx, 'name', e.target.value)}
                        disabled={isLocked} readOnly={sub.saved} style={lockStyle} />
                      <input type="text" placeholder="Deskripsi Sub CLO..." value={sub.description}
                        onChange={(e) => handleChangeSubClo(idx, 'description', e.target.value)}
                        disabled={isLocked} readOnly={sub.saved} style={lockStyle} />
                    </div>
                    {!sub.saved && subClos.length > 1 && (
                      <button type="button" className="clo-btn-remove" aria-label="Hapus baris" onClick={() => removeRow(setSubClos)(idx)} disabled={isLocked}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <hr className="clo-divider" />

              {/* 3. JENIS ASESMEN */}
              <div className="clo-form-section">
                <div className="clo-section-header">
                  <div className="clo-section-title-wrap">
                    <h4 className="clo-section-title">3. Daftar Jenis Asesmen</h4>
                    {isLocked && <span className="clo-hint-lock">Pilih CLO dulu</span>}
                  </div>
                  <button type="button" className="clo-btn-add-sm" style={lockStyle} disabled={isLocked} onClick={() => setAsesmens((r) => [...r, newAsm()])}>
                    <Plus size={14} /> Tambah Asesmen
                  </button>
                </div>

                {asesmens.map((asm, idx) => (
                  <div key={idx} className={`clo-dynamic-row ${asm.saved ? 'is-saved' : ''}`}>
                    <div className="clo-dynamic-fields asesmen-fields">
                      <input type="text" placeholder="Nama / konten asesmen..." value={asm.content}
                        onChange={(e) => handleChangeAsesmen(idx, 'content', e.target.value)}
                        disabled={isLocked} readOnly={asm.saved} style={lockStyle} />
                      <input type="number" step="0.01" min="0" max="1" placeholder="Bobot (0.2 = 20%)" value={asm.bobot}
                        onChange={(e) => handleChangeAsesmen(idx, 'bobot', e.target.value)}
                        disabled={isLocked} readOnly={asm.saved} style={lockStyle} />
                    </div>
                    {!asm.saved && asesmens.length > 1 && (
                      <button type="button" className="clo-btn-remove" aria-label="Hapus baris" onClick={() => removeRow(setAsesmens)(idx)} disabled={isLocked}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                <div className="clo-total-bobot">Total bobot: <strong>{totalLabel}</strong></div>
              </div>
            </div>

            {existingData && (
              <p className="clo-hint">Sub CLO dan asesmen yang sudah tersimpan hanya bisa dilihat di sini. Mengubah atau menghapusnya menunggu endpoint PATCH/DELETE.</p>
            )}

            {formError && <div className="clo-form-error" role="alert">{formError}</div>}

            <div className="clo-modal-footer">
              <button type="button" className="clo-btn-cancel" onClick={onClose} disabled={loading}>Batal</button>
              <button type="submit" className="clo-btn-submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      </div>

      <TambahCLOModal
        isOpen={isAddCloOpen}
        onClose={() => setIsAddCloOpen(false)}
        prodiId={activeProdiId}
        onCreated={handleCloCreated}
      />
    </>
  );
};

export default KelolaCLOModal;