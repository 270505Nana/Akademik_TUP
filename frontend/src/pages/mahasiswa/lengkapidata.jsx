import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, IdCard, GraduationCap, Building2, BookOpen, Users, Search, Save } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { FACULTIES, DUMMY_LECTURERS } from "../../components/kelengkapan_data/dummy.ts";
import "../../components/kelengkapan_data/lengkapidata.css";

const logoTelkom = "https://upload.wikimedia.org/wikipedia/id/thumb/0/03/Logo_Telkom_University.png/1200px-Logo_Telkom_University.png";

const LengkapiData = () => {
  const navigate = useNavigate();
  const { updateStudent } = useStudent();

  const [formData, setFormData] = useState({
    namaLengkap: '',
    nim: '',
    angkatan: '',
    fakultas: '',
    prodi: '',
    dosenWaliKode: '',
    dosenWaliNama: '',
    dosenWaliNip: '',
    pembimbing1Kode: '',
    pembimbing1Nama: '',
    pembimbing2Kode: '',
    pembimbing2Nama: '',
  });

  const [searchQuery, setSearchQuery] = useState({
    dosenWali: '',
    pembimbing1: '',
    pembimbing2: '',
  });

  const [showDropdown, setShowDropdown] = useState({
    dosenWali: false,
    pembimbing1: false,
    pembimbing2: false,
  });

  const [errors, setErrors] = useState(null);

  useEffect(() => {
    const draft = localStorage.getItem('student_form_draft');
    if (draft) {
      const parsedData = JSON.parse(draft);
      setFormData(parsedData);
      setSearchQuery({
        dosenWali: parsedData.dosenWaliKode ? `${parsedData.dosenWaliKode} - ${parsedData.dosenWaliNama}` : '',
        pembimbing1: parsedData.pembimbing1Kode ? `${parsedData.pembimbing1Kode} - ${parsedData.pembimbing1Nama}` : '',
        pembimbing2: parsedData.pembimbing2Kode ? `${parsedData.pembimbing2Kode} - ${parsedData.pembimbing2Nama}` : '',
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('student_form_draft', JSON.stringify(formData));
  }, [formData]);

  const availableProdis = useMemo(() => {
    if (!formData.fakultas) return [];
    return FACULTIES[formData.fakultas] || [];
  }, [formData.fakultas]);

  const filteredLecturers = (query) => {
    if (!query) return DUMMY_LECTURERS;
    return DUMMY_LECTURERS.filter(l => 
      l.nama.toLowerCase().includes(query.toLowerCase()) || 
      l.kode.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'fakultas' ? { prodi: '' } : {})
    }));
    setErrors(null);
  };

  const clearSelection = (type) => {
    if (type === 'dosenWali') {
      setFormData(prev => ({ ...prev, dosenWaliKode: '', dosenWaliNama: '', dosenWaliNip: '' }));
      setSearchQuery(prev => ({ ...prev, dosenWali: '' }));
    } else if (type === 'pembimbing1') {
      setFormData(prev => ({ ...prev, pembimbing1Kode: '', pembimbing1Nama: '' }));
      setSearchQuery(prev => ({ ...prev, pembimbing1: '' }));
    } else {
      setFormData(prev => ({ ...prev, pembimbing2Kode: '', pembimbing2Nama: '' }));
      setSearchQuery(prev => ({ ...prev, pembimbing2: '' }));
    }
  };

  const selectLecturer = (type, lecturer) => {
    if (type === 'dosenWali') {
      setFormData(prev => ({
        ...prev,
        dosenWaliKode: lecturer.kode,
        dosenWaliNama: lecturer.nama,
        dosenWaliNip: lecturer.nip
      }));
      setSearchQuery(prev => ({ ...prev, dosenWali: `${lecturer.kode} - ${lecturer.nama}` }));
    } else if (type === 'pembimbing1') {
      setFormData(prev => ({
        ...prev,
        pembimbing1Kode: lecturer.kode,
        pembimbing1Nama: lecturer.nama
      }));
      setSearchQuery(prev => ({ ...prev, pembimbing1: `${lecturer.kode} - ${lecturer.nama}` }));
    } else {
      setFormData(prev => ({
        ...prev,
        pembimbing2Kode: lecturer.kode,
        pembimbing2Nama: lecturer.nama
      }));
      setSearchQuery(prev => ({ ...prev, pembimbing2: `${lecturer.kode} - ${lecturer.nama}` }));
    }
    setShowDropdown(prev => ({ ...prev, [type]: false }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = Object.keys(formData);
    const isAnyEmpty = requiredFields.some(field => !formData[field]);
    
    if (isAnyEmpty) {
      setErrors('Semua field wajib diisi.');
      return;
    }

    updateStudent(formData);
    localStorage.removeItem('student_form_draft');
    navigate('/mahasiswa/dashboard');
  };

  const handleBlur = (type) => {
    setTimeout(() => {
      setShowDropdown(prev => ({ ...prev, [type]: false }));
    }, 200);
  };

  return (
    <div className="data-diri-wrapper">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="data-diri-card">
        <div className="header-section">
          <div className="form-logo">
            <img src={logoTelkom} alt="Logo Telkom" className="form-logo-img" />
          </div>
          <h2 className="title">Lengkapi Data Diri</h2>
          <p className="subtitle">Silakan melengkapi data akademik Anda sebelum melanjutkan ke Dashboard.</p>
        </div>

        {errors && <div className="error-alert">{errors}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label"><User size={16} /> Nama Lengkap</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input type="text" name="namaLengkap" className="form-input" placeholder="Nama lengkap" value={formData.namaLengkap} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><IdCard size={16} /> NIM</label>
              <div className="input-wrapper">
                <IdCard className="input-icon" size={18} />
                <input type="text" name="nim" className="form-input" placeholder="NIM" value={formData.nim} onChange={handleInputChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label"><GraduationCap size={16} /> Angkatan</label>
              <div className="input-wrapper">
                <GraduationCap className="input-icon" size={18} />
                <input type="text" name="angkatan" className="form-input" placeholder="Angkatan" value={formData.angkatan} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><Building2 size={16} /> Fakultas</label>
            <div className="input-wrapper">
              <Building2 className="input-icon" size={18} />
              <select name="fakultas" className="form-select" value={formData.fakultas} onChange={handleInputChange}>
                <option value="">Pilih Fakultas</option>
                {Object.keys(FACULTIES).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><BookOpen size={16} /> Program Studi</label>
            <div className="input-wrapper">
              <BookOpen className="input-icon" size={18} />
              <select name="prodi" className="form-select" value={formData.prodi} onChange={handleInputChange} disabled={!formData.fakultas}>
                <option value="">Pilih Program Studi</option>
                {availableProdis.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group search-container">
            <label className="form-label"><Users size={16} /> Dosen Wali</label>
            <div className="input-wrapper">
              <Search className="input-icon" size={18} />
              <input 
                type="text" className="form-input" placeholder="Cari Dosen Wali" autoComplete="off" 
                value={searchQuery.dosenWali} 
                onChange={(e) => {
                  setSearchQuery(prev => ({ ...prev, dosenWali: e.target.value }));
                  setShowDropdown(prev => ({ ...prev, dosenWali: true }));
                  setFormData(prev => ({ ...prev, dosenWaliKode: '', dosenWaliNama: '', dosenWaliNip: '' }));
                }}
                onFocus={() => setShowDropdown(prev => ({ ...prev, dosenWali: true }))}
                onBlur={() => handleBlur('dosenWali')}
              />
              {searchQuery.dosenWali && <button type="button" className="clear-search-btn" onClick={() => clearSelection('dosenWali')}>×</button>}
              {showDropdown.dosenWali && (
                <div className="dropdown-list">
                  {filteredLecturers(searchQuery.dosenWali).length > 0 ? (
                    filteredLecturers(searchQuery.dosenWali).map((l) => (
                      <div key={l.kode} className="dropdown-item" onClick={() => selectLecturer('dosenWali', l)}>{l.kode} - {l.nama}</div>
                    ))
                  ) : <div className="dropdown-item disabled">Dosen tidak ditemukan</div>}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">NIP Dosen Wali (Otomatis)</label>
            <input type="text" className="form-input disabled" disabled value={formData.dosenWaliNip} style={{ paddingLeft: '14px' }} />
          </div>

          <div className="form-row">
            <div className="form-group search-container">
              <label className="form-label">Kode Pembimbing 1</label>
              <div className="input-wrapper">
                <Search className="input-icon" size={18} />
                <input 
                  type="text" className="form-input" placeholder="Kode/Nama" autoComplete="off"
                  value={searchQuery.pembimbing1}
                  onChange={(e) => {
                    setSearchQuery(prev => ({ ...prev, pembimbing1: e.target.value }));
                    setShowDropdown(prev => ({ ...prev, pembimbing1: true }));
                    setFormData(prev => ({ ...prev, pembimbing1Kode: '', pembimbing1Nama: '' }));
                  }}
                  onFocus={() => setShowDropdown(prev => ({ ...prev, pembimbing1: true }))}
                  onBlur={() => handleBlur('pembimbing1')}
                />
                {searchQuery.pembimbing1 && <button type="button" className="clear-search-btn" onClick={() => clearSelection('pembimbing1')}>×</button>}
                {showDropdown.pembimbing1 && (
                  <div className="dropdown-list">
                    {filteredLecturers(searchQuery.pembimbing1).length > 0 ? (
                      filteredLecturers(searchQuery.pembimbing1).map((l) => (
                        <div key={l.kode} className="dropdown-item" onClick={() => selectLecturer('pembimbing1', l)}>{l.kode} - {l.nama}</div>
                      ))
                    ) : <div className="dropdown-item disabled">Dosen tidak ditemukan</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nama Pembimbing 1</label>
              <input type="text" className="form-input disabled" disabled value={formData.pembimbing1Nama} style={{ paddingLeft: '14px' }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group search-container">
              <label className="form-label">Kode Pembimbing 2</label>
              <div className="input-wrapper">
                <Search className="input-icon" size={18} />
                <input 
                  type="text" className="form-input" placeholder="Kode/Nama" autoComplete="off"
                  value={searchQuery.pembimbing2}
                  onChange={(e) => {
                    setSearchQuery(prev => ({ ...prev, pembimbing2: e.target.value }));
                    setShowDropdown(prev => ({ ...prev, pembimbing2: true }));
                    setFormData(prev => ({ ...prev, pembimbing2Kode: '', pembimbing2Nama: '' }));
                  }}
                  onFocus={() => setShowDropdown(prev => ({ ...prev, pembimbing2: true }))}
                  onBlur={() => handleBlur('pembimbing2')}
                />
                {searchQuery.pembimbing2 && <button type="button" className="clear-search-btn" onClick={() => clearSelection('pembimbing2')}>×</button>}
                {showDropdown.pembimbing2 && (
                  <div className="dropdown-list">
                    {filteredLecturers(searchQuery.pembimbing2).length > 0 ? (
                      filteredLecturers(searchQuery.pembimbing2).map((l) => (
                        <div key={l.kode} className="dropdown-item" onClick={() => selectLecturer('pembimbing2', l)}>{l.kode} - {l.nama}</div>
                      ))
                    ) : <div className="dropdown-item disabled">Dosen tidak ditemukan</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nama Pembimbing 2</label>
              <input type="text" className="form-input disabled" disabled value={formData.pembimbing2Nama} style={{ paddingLeft: '14px' }} />
            </div>
          </div>

          <button type="submit" className="btn-submit"><Save size={20} /> Simpan & Lanjutkan</button>
        </form>
      </div>
    </div>
  );
};

export default LengkapiData;
