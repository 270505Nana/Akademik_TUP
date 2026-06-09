import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, IdCard, GraduationCap, BookOpen, Users, Search, Save } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import { getLecturers, getStudyPrograms, saveStudentData } from "../../service/api";
import "../../components/mahasiswa/lengkapidata.css";
import logoTelkom from "../../assets/logo-telkom.png";

const LengkapiData = () => {
  const navigate = useNavigate();
  const { updateStudent } = useStudent();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    namaLengkap:      '',
    nim:              '',
    kelas:            '',
    angkatan:         '',
    studyProgramId:   '',
    studyProgramNama: '',
    dosenWaliId:      '',
    dosenWaliKode:    '',
    dosenWaliNama:    '',
    dosenWaliNip:     '',
  });

  const [searchQuery,  setSearchQuery]  = useState({ dosenWali: '' });
  const [showDropdown, setShowDropdown] = useState({ dosenWali: false });
  const [errors,       setErrors]       = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lecturers,     setLecturers]     = useState([]);
  const [studyPrograms, setStudyPrograms] = useState([]);

  const [loadingDosen, setLoadingDosen] = useState(true);
  const [loadingProdi, setLoadingProdi] = useState(true);
  const [errorDosen,   setErrorDosen]   = useState(null);

  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setLoadingDosen(true);
        const data = await getLecturers();
        const mapped = data.map((d) => ({
          id:   d.id,
          kode: d.lecturerCode ?? d.kode,
          nama: d.name         ?? d.nama,
          nip:  d.nip,
        }));
        setLecturers(mapped);
      } catch (err) {
        console.error("Gagal mengambil data dosen:", err);
        setErrorDosen("Gagal memuat data dosen. Silakan refresh halaman.");
      } finally {
        setLoadingDosen(false);
      }
    };
    fetchDosen();
  }, []);

  useEffect(() => {
    const fetchProdi = async () => {
      try {
        setLoadingProdi(true);
        const data = await getStudyPrograms();
        setStudyPrograms(data);
      } catch (err) {
        console.error("Gagal mengambil data prodi:", err);
      } finally {
        setLoadingProdi(false);
      }
    };
    fetchProdi();
  }, []);

  // Load draft dari localStorage
  useEffect(() => {
    const draft = localStorage.getItem('student_form_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      setFormData(parsed);
      setSearchQuery({
        dosenWali: parsed.dosenWaliKode
          ? `${parsed.dosenWaliKode} - ${parsed.dosenWaliNama}`
          : '',
      });
    }
  }, []);

  // Autosave draft ke localStorage
  useEffect(() => {
    localStorage.setItem('student_form_draft', JSON.stringify(formData));
  }, [formData]);

  const filteredLecturers = (query) => {
    if (!query) return lecturers;
    return lecturers.filter(l =>
      l.nama.toLowerCase().includes(query.toLowerCase()) ||
      l.kode.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'studyProgramId') {
      const selected = studyPrograms.find(p => p.id === Number(value));
      setFormData(prev => ({
        ...prev,
        studyProgramId:   value,
        studyProgramNama: selected?.name ?? '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(null);
  };

  const clearSelection = (type) => {
    if (type === 'dosenWali') {
      setFormData(prev => ({
        ...prev,
        dosenWaliId: '', dosenWaliKode: '',
        dosenWaliNama: '', dosenWaliNip: '',
      }));
      setSearchQuery(prev => ({ ...prev, dosenWali: '' }));
    }
  };

  const selectLecturer = (type, lecturer) => {
    if (type === 'dosenWali') {
      setFormData(prev => ({
        ...prev,
        dosenWaliId:   lecturer.id,
        dosenWaliKode: lecturer.kode,
        dosenWaliNama: lecturer.nama,
        dosenWaliNip:  lecturer.nip,
      }));
      setSearchQuery(prev => ({
        ...prev,
        dosenWali: `${lecturer.kode} - ${lecturer.nama}`,
      }));
    }
    setShowDropdown(prev => ({ ...prev, [type]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['namaLengkap', 'nim', 'kelas', 'angkatan', 'studyProgramId', 'dosenWaliId'];
    const emptyField = requiredFields.find(field => !formData[field]);
    if (emptyField) {
      setErrors('Semua field wajib diisi.');
      return;
    }

    const payload = {
      nim:            formData.nim,
      name:           formData.namaLengkap,
      className:      formData.kelas,
      year:           Number(formData.angkatan),
      studyProgramId: Number(formData.studyProgramId),
      dosenWaliId:    Number(formData.dosenWaliId),
      sks:            null,
      ipk:            null,
      tak:            null,
    };

    setIsSubmitting(true);
    try {
      const result = await saveStudentData(user.id, payload);
      const studentDbId = result?.data?.id ?? result?.id ?? null;
      updateStudent({ ...formData, studentId: studentDbId });
      localStorage.removeItem('student_form_draft');
      navigate('/mahasiswa/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menyimpan data. Silakan coba lagi.";
      setErrors(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlur = (type) => {
    setTimeout(() => {
      setShowDropdown(prev => ({ ...prev, [type]: false }));
    }, 200);
  };

  const renderDropdownItems = (query, type) => {
    if (loadingDosen) return <div className="dropdown-item disabled">Memuat data dosen...</div>;
    if (errorDosen)   return <div className="dropdown-item disabled">{errorDosen}</div>;
    const results = filteredLecturers(query);
    if (results.length === 0) return <div className="dropdown-item disabled">Dosen tidak ditemukan</div>;
    return results.map((l) => (
      <div key={l.kode} className="dropdown-item" onClick={() => selectLecturer(type, l)}>
        {l.kode} - {l.nama}
      </div>
    ));
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

          {/* Nama Lengkap */}
          <div className="form-group">
            <label className="form-label"><User size={16} /> Nama Lengkap</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                type="text" name="namaLengkap" className="form-input"
                placeholder="Nama lengkap" value={formData.namaLengkap}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* NIM + Angkatan */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><IdCard size={16} /> NIM</label>
              <div className="input-wrapper">
                <IdCard className="input-icon" size={18} />
                <input
                  type="text" name="nim" className="form-input"
                  placeholder="NIM" value={formData.nim}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label"><GraduationCap size={16} /> Angkatan</label>
              <div className="input-wrapper">
                <GraduationCap className="input-icon" size={18} />
                <input
                  type="text" name="angkatan" className="form-input"
                  placeholder="Angkatan" value={formData.angkatan}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Kelas */}
          <div className="form-group">
            <label className="form-label"><GraduationCap size={16} /> Kelas</label>
            <div className="input-wrapper">
              <GraduationCap className="input-icon" size={18} />
              <input
                type="text" name="kelas" className="form-input"
                placeholder="SE-07-01" value={formData.kelas}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Program Studi — tampil semua tanpa filter fakultas */}
          <div className="form-group">
            <label className="form-label"><BookOpen size={16} /> Program Studi</label>
            <div className="input-wrapper">
              <BookOpen className="input-icon" size={18} />
              <select
                name="studyProgramId" className="form-select"
                value={formData.studyProgramId} onChange={handleInputChange}
                disabled={loadingProdi}
              >
                <option value="">
                  {loadingProdi ? "Memuat program studi..." : "Pilih Program Studi"}
                </option>
                {studyPrograms.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dosen Wali */}
          <div className="form-group search-container">
            <label className="form-label"><Users size={16} /> Dosen Wali</label>
            <div className="input-wrapper">
              <Search className="input-icon" size={18} />
              <input
                type="text" className="form-input"
                placeholder="Cari Dosen Wali" autoComplete="off"
                value={searchQuery.dosenWali}
                onChange={(e) => {
                  setSearchQuery(prev => ({ ...prev, dosenWali: e.target.value }));
                  setShowDropdown(prev => ({ ...prev, dosenWali: true }));
                  setFormData(prev => ({
                    ...prev,
                    dosenWaliId: '', dosenWaliKode: '',
                    dosenWaliNama: '', dosenWaliNip: '',
                  }));
                }}
                onFocus={() => setShowDropdown(prev => ({ ...prev, dosenWali: true }))}
                onBlur={() => handleBlur('dosenWali')}
              />
              {searchQuery.dosenWali && (
                <button type="button" className="clear-search-btn"
                  onClick={() => clearSelection('dosenWali')}>×</button>
              )}
              {showDropdown.dosenWali && (
                <div className="dropdown-list">
                  {renderDropdownItems(searchQuery.dosenWali, 'dosenWali')}
                </div>
              )}
            </div>
          </div>

          {/* NIP Dosen Wali */}
          <div className="form-group">
            <label className="form-label">NIP Dosen Wali (Otomatis)</label>
            <input
              type="text" className="form-input disabled" disabled
              value={formData.dosenWaliNip} style={{ paddingLeft: '14px' }}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            <Save size={20} />
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LengkapiData;