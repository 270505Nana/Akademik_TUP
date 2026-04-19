import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { 
  ArrowLeft, 
  Info, 
  MessageCircle, 
  User, 
  Phone, 
  GraduationCap, 
  UploadCloud, 
  FileText, 
  AlertTriangle,
  FileBadge
} from 'lucide-react';
import SimtaLogo from "../../assets/logo-simta.png";
import Telulogo from "../../assets/logo-telkom.png";
import '../../components/sk/pengajuanSK.css';

const PengajuanSK = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  const [formData, setFormData] = useState({
    nama: 'Prajna Paramitha',
    nim: '',
    noHp: '',
    prodi: '',
    judulIndo: '',
    judulInggris: '',
    dosen1: '',
    kode1: null,
    dosen2: '',
    kode2: null,
    kelompok: 'Media, Design and Creative Innovation'
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 3 * 1024 * 1024; // 3MB limit 
    
    if (file.size > maxSize) {
      setFileError(`Scan_Lampiran Bukti Dosbing.pdf melebihi batas 3MB.`);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1),
        type: file.type.split('/')[1]?.toUpperCase() || 'PDF'
      });
    }
  };

  const lecturerOptions = [
    { value: 'ADM', label: 'ADM - Agatha Dinarah Sri Rumestri, S.T., M.Ds.' },
    { value: 'ACW', label: 'ACW - Ariq Cahya Wardhana, S.Kom., M.Kom' },
    { value: 'BNS', label: 'BNS - Bu Rona Nisa Sofia Amriza' },
    { value: 'PYN', label: 'PYN - Pak Andi Prademon Yunus' },
  ];

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      paddingLeft: '40px',
      backgroundColor: '#F9FAFB',
      border: '1.5px solid #E5E7EB',
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '45px',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px',
    }),
  };

  const kelompokKeilmuan = [
    { id: 'kk1', label: 'ELECTRONICS AND TELECOMMUNICATIONS SCIENCE' },
    { id: 'kk2', label: 'INDUSTRIAL SYSTEMS ENGINEERING' },
    { id: 'kk3', label: 'MEDIA, DESIGN AND CREATIVE INNOVATION' },
    { id: 'kk4', label: 'APPLIED ARTIFICIAL INTELLIGENCE' },
    { id: 'kk5', label: 'CYBER SECURITY, IOT, AND CLOUD SYSTEM' },
    { id: 'kk6', label: 'DATA SCIENCE AND OPTIMIZATION' },
    { id: 'kk7', label: 'BIOENGINEERING, FOOD TECHNOLOGY AND ADVANCE MATERIAL' },
    { id: 'kk8', label: 'SOFTWARE ENGINEERING AND MULTIMEDIA' }
  ];

  return (
    <div className="sk-page-container">
      
      <header className="sk-header">
        <button className="btn-back" onClick={() => navigate('/mahasiswa/dashboard')}>
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className="" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={SimtaLogo} alt="SIMTA Logo" referrerPolicy="no-referrer" style={{ height: '40px' }} />
          <img src={Telulogo} alt="Telkom University Logo" referrerPolicy="no-referrer" style={{ height: '40px' }}/>
        </div>
      </header>

      <div className="sk-content-wrapper">
        
        <div className="info-box-red">
          <div className="info-content" style={{display: 'flex', gap: '16px'}}>
            
            <div className="info-icon-circle">
              <Info size={24} />
            </div>

            <div className="info-text">
              <h4 style={{ fontSize: '16px', color: '#B91C1C', marginBottom: '12px', fontWeight: 800 }}>Permohonan Penerbitan SK Pembimbing Tugas Akhir</h4>
              
              <p><strong>Formulir ini ditujukan bagi mahasiswa yang belum memiliki SK TA pada menu TA/PA iGracias</strong></p>
              <p><strong>Harap Baca Secara Teliti</strong></p>

              <p>Formulir ini diajukan setelah mahasiswa mengajukan pembimbing di igracias dan sudah di approve oleh ketua KK.</p>
              <p>Apabila belum diapprove, silahkan dapat meminta Approval Dosen Pembimbing kepada ketua KK. Approval dosen pembimbing pada menu TA/PA igracias dapat melalui KK berikut : Pemilihan KK berdasarkan Dosen Pembimbing I, Silahkan cek terlebih dahulu KK dari Dosen Pembimbing I melalui link : <a href="http://tel-u.ac.id/dosentatup" target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'underline' }}>tel-u.ac.id/dosentatup</a></p>
              
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px', marginBottom: '10px' }}>
                
                <li style={{ marginBottom: '8px' }}>
                  KK Electronics and Telecommunications Science. Dapat menghubungi Bu Solichah Larasati : ( 085726234838 )
                  </li>
                <li>
                  KK Industrial Systems Engineering. Dapat menghubungi Pak Alza Yudha : ( 085200330027 )
                </li>
                <li>
                  KK Applied Artificial Intelligence. Dapat mengubungi Bu Paradise : ( 082243368605 )
                </li>
                <li>
                  KK Media, Design and Creative Innovation. Dapat menghubungi Bu Agatha : ( 081331379241 )
                </li>
                <li>
                  KK Cyber Security, IOT, and Cloud System. Dapat menghubungi Pak Eko Fajar Cahyadi : ( 085132323346 )
                </li>
                <li>
                  KK Data Science and Optimization. Dapat menghubungi Pak Andi Prademon Yunus : ( 08114091048 )
                </li>
                <li>
                  KK Bioengineering, Food Technology and Advance Material. Dapat menghubungi Bu Nur Afifah Zen : ( 081227684018 )
                </li>
                <li>
                  KK Information System, Digital Business & Data Driven Solution. Dapat menghubungi Bu Rona Nisa Sofia Amriza : ( 085878447414 )
                </li>
                <li>
                  KK Software Engineering and Multimedia. Dapat menghubungi Pak Arif Amrulloh : ( 08567424313 )
                </li>

              </ul>

              <p>Pengajuan penerbitan SK diproses dalam waktu maksimal 3×24 jam sesuai antrian</p>
              {/* ini di igracias? */}
              {/* <p>Bagi mahasiswa yang sudah memiliki SK TA namun masa aktif SK TA sudah habis atau terdapat perubahan judul/dosen pembimbing dapat melakukan pembaruan SK di halaman <strong>Registrasi → Pembaruan SK Tugas Akhir</strong> untuk melakukan perubahan</p> */}
            </div>

          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
            <div className="contact-badge">
              <MessageCircle size={14} /> Contact Person : (kontak pada hari dan jam kerja) Helpdesk Layanan Sidang-Yudisium TUP wa.me/+6285117001281
            </div>
          </div>

        </div>

        <div className="sk-title-wrapper" style={{ margin: '40px 0 50px 0', overflow: 'hidden' }}>
          <h1 className="sk-main-title" style={{ whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Permohonan</span>
            <span>Penerbitan SK Pembimbing Tugas Akhir</span>
          </h1>
        </div>
        
        <section className="form-section" style={{ marginBottom: '60px' }}>
          <h2 className="section-title">Identitas & Program Studi</h2>
          <div className="form-grid">

            <div className="form-group">
              <label>Nama</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input type="text" placeholder="Masukan Nama Jawaban Anda" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>NIM (Nomor Induk Mahasiswa) *</label>
              <div className="input-with-icon">
                <input 
                  type="text" 
                  placeholder="231110406666" 
                  value={formData.nim} 
                  onChange={(e) => setFormData({...formData, nim: e.target.value})} 
                />
              </div>
              <p className="input-hint">NIM terverifikasi oleh sistem secara otomatis.</p>
            </div>

            <div className="form-group">
              <label>Nomor HP / WhatsApp Aktif *</label>
              <div className="input-with-icon">
                <Phone className="field-icon" size={18} />
                <input type="text" placeholder="081298765432" value={formData.noHp} onChange={(e) => setFormData({...formData, noHp: e.target.value})} />
              </div>
              <p className="input-hint">Nomor HP terverifikasi oleh sistem secara otomatis.</p>
            </div>

            <div className="form-group">
              <label>Program Studi</label>
              <div className="input-with-icon">
                <GraduationCap className="field-icon" size={18} />
                <select value={formData.prodi} onChange={(e) => setFormData({...formData, prodi: e.target.value})}>
                  <option value="">Pilih Program Studi Anda</option>
                  <option value="S1 Teknik Informatika">S1 Teknik Informatika</option>
                  <option value="S1 Sistem Informasi">S1 Sistem Informasi</option>
                </select>
              </div>
            </div>

          </div>
        </section>

        
        <section className="form-section">
          <h2 className="section-title">Informasi Tugas Akhir</h2>

          <div className="form-group">
            <label>Judul Tugas Akhir (Bahasa Indonesia) *</label>
            <div className="input-with-icon">
              <textarea 
                placeholder="Masukkan judul tugas akhir anda" 
                value={formData.judulIndo} 
                onChange={(e) => setFormData({...formData, judulIndo: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Judul Tugas Akhir (Bahasa Inggris) *</label>
            <div className="input-with-icon">
              <textarea 
                placeholder="Masukkan judul tugas akhir anda" 
                value={formData.judulInggris} 
                onChange={(e) => setFormData({...formData, judulInggris: e.target.value})} 
              />
            </div>
            <p className="input-hint">Pastikan judul sesuai dengan yang tertera di SK Yudisium terakhir.</p>
          </div>

          <div className="form-grid">

            <div className="form-group">
              <label>Nama Dosen Pembimbing 1</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input type="text" placeholder="Masukan Nama Jawaban Anda" value={formData.dosen1} onChange={(e) => setFormData({...formData, dosen1: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Kode Dosen Pembimbing 1</label>
              <div className="input-with-icon block-select">
                <FileBadge className="field-icon" size={18} style={{ zIndex: 10 }} />
                <Select 
                  placeholder="Masukkan Kode Dosen Anda"
                  options={lecturerOptions}
                  styles={customSelectStyles}
                  value={formData.kode1}
                  onChange={(val) => setFormData({...formData, kode1: val})}
                  className="w-full"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nama Dosen Pembimbing 2</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input type="text" placeholder="Masukan Nama Jawaban Anda" value={formData.dosen2} onChange={(e) => setFormData({...formData, dosen2: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label>Kode Dosen Pembimbing 2</label>
              <div className="input-with-icon block-select">
                <FileBadge className="field-icon" size={18} style={{ zIndex: 10 }} />
                <Select 
                  placeholder="Masukkan Kode Dosen Anda"
                  options={lecturerOptions}
                  styles={customSelectStyles}
                  value={formData.kode2}
                  onChange={(val) => setFormData({...formData, kode2: val})}
                  className="w-full"
                />
              </div>
            </div>

          </div>

          <div className="form-group">
            <label style={{ marginBottom: '20px' }}>Kelompok Keilmuan</label>
            <div className="radio-grid">
              {kelompokKeilmuan.map((item) => (
                <label key={item.id} className="radio-item">
                  <input 
                    type="radio" 
                    name="kelompok" 
                    value={item.label} 
                    checked={formData.kelompok === item.label}
                    onChange={(e) => setFormData({...formData, kelompok: e.target.value})}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

        </section>

        <section className="form-section">
          <h2 className="section-title">Dokumen Evidence Sudah Di Approve Pengajuan Pembimbing Oleh Ketua KK Di iGracias</h2>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>
            1. Berkas Lampiran Bukti Dosbing Sudah Diacc KK :
            <br />
            Link contoh Evidence <a href="https://tel-u.ac.id/bukti-dosbing" target="_blank" rel="noreferrer" style={{ color: '#0070f3', wordBreak: 'break-all' }}>https://telkomuniversityofficial-my.sharepoint.com/...</a>
          </p>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Unggah Dokumen Prasyarat</label>
              <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  hidden 
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.png"
                />
                <div className="upload-icon-circle">
                  <UploadCloud size={48} />
                </div>
                <div className="upload-text">
                  <p><strong>Tarik & Lepas file di sini</strong></p>
                  <p>atau klik untuk pilih memilih dari komputer</p>
                  <div className="file-type-badges">
                    <span>PDF</span>
                    <span>JPG/PNG</span>
                    <span>MAX 3MB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>File Terpilih</label>
              <div className="file-status-list">
                {selectedFile && (
                  <div className="status-card success">
                    <div className="status-icon-wrap" style={{ background: '#EF4444' }}>
                      <FileText size={20} />
                    </div>
                    <div className="status-info">
                      <div className="status-filename">{selectedFile.name} <span className="label-siap">Siap</span></div>
                      <div className="status-meta">{selectedFile.size} MB • {selectedFile.type}</div>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div className="status-card error">
                    <div className="status-icon-wrap" style={{ background: '#EF4444' }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="status-info">
                      <div className="error-title">Error: Ukuran File</div>
                      <div className="error-desc">{fileError}</div>
                    </div>
                  </div>
                )}

                {!selectedFile && !fileError && (
                  <div className="empty-file-state" style={{ padding: '20px', border: '1px dashed #E5E7EB', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                    Belum ada file yang dipilih
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="bottom-actions">
        <button className="btn-submit">
          Simpan Pengajuan
        </button>
      </footer>
    </div>
  );
};

export default PengajuanSK;
