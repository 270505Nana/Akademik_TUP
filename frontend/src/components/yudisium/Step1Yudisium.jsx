
import React from 'react';
import { useYudisiumForm } from '../../context/YudisiumFormContext';
import { BsPerson, BsHash, BsMortarboard, BsAward, BsBuildings, BsChevronLeft, BsChevronRight, BsCheck, BsInfoCircleFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

const Step1Yudisium = () => {
  const { state, dispatch } = useYudisiumForm();
  const navigate = useNavigate();
  const { data } = state;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'UPDATE_DATA', payload: { [name]: value } });
  };

  const handleJalurChange = (val) => {
    // Reset skema waktu pindah jalurmnya
    let newSkema = [];
    if (val === 'Pengajuan Summa Cumlaude') {
      newSkema = ['Publikasi Jurnal'];
    }
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { 
        jalurYudisium: val,
        skemaTambahan: newSkema
      } 
    });
  };

  const handleSkemaToggle = (skema) => {
    if (data.jalurYudisium === 'Pengajuan Summa Cumlaude') return;
    
    const current = [...data.skemaTambahan];
    if (current.includes(skema)) {
      dispatch({ type: 'UPDATE_DATA', payload: { skemaTambahan: current.filter(s => s !== skema) } });
    } else {
      dispatch({ type: 'UPDATE_DATA', payload: { skemaTambahan: [...current, skema] } });
    }
  };

  return (
    <div className="yudisium-page-container">
      
      <div className="instruction-box">
        <div className="instruction-icon-circle">
          <BsInfoCircleFill size={28} />
        </div>
        <div className="instruction-content">
          <h3>Pendaftaran Yudisium Telkom University Purwokerto</h3>
          <p>Sebelum melengkapi data pendaftaran sidang, silahkan pelajari dan pahami informasi terkait pendaftaran sidang pada tautan :</p>
          <p><a href="https://tel-u.ac.id/panduansidangtup">https://tel-u.ac.id/panduansidangtup</a></p>
          <p style={{ fontWeight: 800, marginTop: '0.8rem' }}>Harap Baca Dengan Teliti</p>
        </div>

        <div className="contact-person-badge" onClick={() => window.open('https://wa.me/6285117001281', '_blank')}>
          <BsInfoCircleFill size={18} />
          <span>Contact Person : Helpdesk Layanan Sidang-Yudisium TUP</span>
        </div>

      </div>

      <div className="step-header">
        <span className="step-label-red">Step 1</span>
        <h2 className="step-title-red">Pendaftaran Yudisium Telkom University Purwokerto</h2>
      </div>

      <div className="form-section">
        <div className="section-divider">
          <h2>Identitas & Program Studi</h2>
        </div>
        
        <div className="form-grid">
          <div className="input-group">
            <label>NAMA</label>
            <div className="input-with-icon">
              <BsPerson className="input-icon" />
              <input 
                className="input-field"
                name="nama" 
                value={data.nama} 
                onChange={handleInputChange} 
                placeholder="Masukan Nama Jawaban Anda" 
              />
            </div>
          </div>
          <div className="input-group">
            <label>NIM (NOMOR INDUK MAHASISWA) *</label>
            <div className="input-with-icon">
              <input 
                className="input-field read-only"
                name="nim" 
                value={data.nim} 
                readOnly
                placeholder="231110406666" 
              />
            </div>
            <span className="helper-text">NIM terverifikasi oleh sistem secara otomatis.</span>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '1.5rem' }}>
          <div className="input-group">
            <label>PROGRAM STUDI</label>
            <div className="input-with-icon">
              <BsMortarboard className="input-icon" />
              <select className="input-field" name="prodi" value={data.prodi} onChange={handleInputChange}>
                <option value="">Pilih Program Studi Anda</option>
                <option value="S1 Informatika">S1 Informatika</option>
                <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                <option value="S1 Teknik Elektro">S1 Teknik Elektro</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>TAK</label>
            <div className="input-with-icon">
              <input 
                className="input-field"
                name="tak" 
                value={data.tak} 
                onChange={handleInputChange} 
                placeholder="60" 
              />
            </div>
            <span className="helper-text">Poin minimum untuk TAK Mahasiswa Reguler : 60, Alih Jenjang : 25, Diploma : 45</span>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '1.5rem' }}>
          <div className="input-group">
            <label>PROGRAM</label>
            <div className="radio-pill-group">
              <div 
                className={`radio-pill ${data.program === 'Reguler' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'UPDATE_DATA', payload: { program: 'Reguler' } })}
              >
                <div className="check-icon-box">
                  {data.program === 'Reguler' && <BsCheck size={18} />}
                </div>
                <span>Reguler</span>
              </div>
              <div 
                className={`radio-pill ${data.program === 'Alih Jenjang' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'UPDATE_DATA', payload: { program: 'Alih Jenjang' } })}
              >
                <div className="check-icon-box">
                  {data.program === 'Alih Jenjang' && <BsCheck size={18} />}
                </div>
                <span>Alih Jenjang</span>
              </div>
            </div>
          </div>
          <div className="input-group">
            <label>KODE DOSEN WALI</label>
            <div className="input-with-icon">
              <input 
                className="input-field"
                name="doswal" 
                value={data.doswal} 
                onChange={handleInputChange} 
                placeholder="ACW-Ariq Cahya Wardhana, S.Kom., M.Kom" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-divider">
          <h2>Informasi Tugas Akhir</h2>
        </div>
        
        <div className="sub-section-grid">
           <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>SKEMA SIDANG</label>
              <div className="vertical-choice-list">
                 {['Sidang Reguler', 'Non Sidang', 'Capstone', 'Sidang Khusus Prodi'].map(skema => (
                    <label key={skema} className="choice-item">
                       <input 
                        type="radio" 
                        name="skemaSidang" 
                        checked={data.skemaSidang === skema} 
                        onChange={() => dispatch({ type: 'UPDATE_DATA', payload: { skemaSidang: skema } })} 
                       />
                       <span>{skema}</span>
                    </label>
                 ))}
              </div>

              <label style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem', display: 'block' }}>PENGAJUAN CUMLAUDE</label>
              <div className="vertical-choice-list">
                 {['Non Cumlaude', 'Pengajuan Cumlaude', 'Pengajuan Summa Cumlaude'].map(jalur => (
                    <label key={jalur} className="choice-item">
                       <input 
                        type="radio" 
                        name="jalurYudisium" 
                        checked={data.jalurYudisium === jalur} 
                        onChange={() => handleJalurChange(jalur)} 
                       />
                       <span>{jalur}</span>
                    </label>
                 ))}
              </div>
           </div>

           <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>SKEMA AJUAN CUMLAUDE / SUMMA CUMLAUDE</label>
              <p className="choice-subtext" style={{ marginBottom: '1rem' }}>Khusus pengajuan "Summa Cumlaude" hanya menerima skema Publikasi Jurnal saja</p>
              <div className="vertical-choice-list">
                 {['Publikasi Jurnal', 'Pameran', 'Lomba', 'HKI'].map(skema => (
                    <label key={skema} className="choice-item">
                       <input 
                        type="checkbox" 
                        checked={data.skemaTambahan.includes(skema)} 
                        onChange={() => handleSkemaToggle(skema)}
                        disabled={data.jalurYudisium === 'Pengajuan Summa Cumlaude'}
                       />
                       <span>{skema}</span>
                    </label>
                 ))}
              </div>
           </div>
        </div>

        <div className="textarea-container">
          <label>JUDUL TUGAS AKHIR (BAHASA INDONESIA) *</label>
          <textarea 
            className="textarea-field"
            name="judulId" 
            value={data.judulId} 
            onChange={handleInputChange}
            placeholder="Rancang Bangun Sistem Informasi Pendaftaran Yudisium Berbasis Web Menggunakan React dan Tailwind CSS"
          />
        </div>

        <div className="textarea-container">
          <label>JUDUL TUGAS AKHIR (BAHASA INGGRIS) *</label>
          <textarea 
            className="textarea-field"
            name="judulEn" 
            value={data.judulEn} 
            onChange={handleInputChange}
            placeholder="Design and Development of a Web-Based Graduation Registration Information System Using React and Tailwind CSS"
          />
          <span className="helper-text">Pastikan judul sesuai dengan yang tertera di SK Yudisium terakhir.</span>
        </div>
      </div>

      <div className="footer-pagination-yudisium">
        <div className="nav-arrows">
          <button className="nav-arrow-btn" disabled><BsChevronLeft /></button>
          <div className="page-numbers">
            <div className="page-number active">1</div>
            <div className="page-number" onClick={() => dispatch({ type: 'SET_STEP', value: 2 })}>2</div>
          </div>
          <button className="nav-arrow-btn" onClick={() => dispatch({ type: 'SET_STEP', value: 2 })}><BsChevronRight /></button>
        </div>
        <button className="btn-submit-yudisium" onClick={() => dispatch({ type: 'SET_STEP', value: 2 })}>
          Simpan & Lanjutkan
        </button>
      </div>
    </div>
  );
};

export default Step1Yudisium;

