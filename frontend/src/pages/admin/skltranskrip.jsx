import React, { useState, useRef } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle2,
  Menu,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import '../../components/admin/skltranskrip.css';

const SklTranskrip = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('SKL'); // 'SKL' or 'Transkrip'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: 'success', title: '', message: '' });
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const students = [
    { id: 1, name: 'Andhika Pramata', nim: '2311104001', prodi: 'S1 RPL', periode: 'Periode Genap-Ganjil 25/26' },
    { id: 2, name: 'Jeremy Cristo', nim: '2311104098', prodi: 'S1 IF', periode: 'Periode Genap-Ganjil 25/26' },
    { id: 3, name: 'Naufal Ari', nim: '2311104045', prodi: 'S1 DKV', periode: 'Periode Genap-Ganjil 25/26' },
    { id: 4, name: 'Saufiq iqro', nim: '2311104088', prodi: 'S1 BIOMED', periode: 'Periode Genap-Ganjil 25/26' },
    { id: 5, name: 'Saufiq iqro', nim: '2311104088', prodi: 'S1 TEKDUS', periode: 'Periode Genap-Ganjil 25/26' },
  ];

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
  };

  const openUploadModal = (student, type) => {
    setSelectedStudent(student);
    setModalType(type);
    setFile(null);
    setUploadError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateFile(selectedFile);
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setUploadError('File harus berformat PDF.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 4 * 1024 * 1024) {
      setUploadError(`${selectedFile.name} melebihi batas 4MB.`);
      setFile(null);
      return;
    }

    setUploadError('');
    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateFile(droppedFile);
  };

  const handleSave = () => {
    if (!file) {
      setUploadError('Harap pilih file terlebih dahulu.');
      return;
    }
    // alert berhasil
    setIsModalOpen(false);
    showAlert('success', 'Berhasil', `Berhasil Upload ${modalType}`);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="skl-layout">
      <SidebarAdmin 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, icon, type) => showAlert(type || 'success', 'Info', msg)}
      />

      <div className="skl-main">
        <header className="skl-header">
          <h1>Manajemen Dokumen</h1>
        </header>

        <div className="skl-content">
          <div className="skl-breadcrumb">
            Beranda / Layanan SK TA / Upload SK
          </div>

          <h2 className="skl-page-title">Upload SKL & Transkrip Nilai Mahasiswa</h2>

          <div className="skl-table-card">
            <div className="skl-table-actions">
              <div className="skl-search">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Cari Nama atau NIM..." />
              </div>
              <div className="skl-filters">
                <select className="skl-select">
                  <option>Filter Prodi</option>
                </select>
                <select className="skl-select">
                  <option>Filter Periode Yudisium</option>
                </select>
              </div>
            </div>

            <div className="skl-responsive-table">
              <table className="skl-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Mahasiswa</th>
                    <th>Prodi</th>
                    <th>Periode Yudisium</th>
                    <th>SKL Mahasiswa</th>
                    <th>Transkrip Nilai Mhs</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <tr key={student.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="student-col">
                          <span className="student-name">{student.name}</span>
                          <span className="student-nim">{student.nim}</span>
                        </div>
                      </td>
                      <td>{student.prodi}</td>
                      <td>{student.periode}</td>
                      <td>
                        <button className="btn-upload skl" onClick={() => openUploadModal(student, 'SKL')}>
                          <Upload size={14} /> Unggah SKL
                        </button>
                      </td>
                      <td>
                        <button className="btn-upload transkrip" onClick={() => openUploadModal(student, 'Transkrip Nilai')}>
                          <Upload size={14} /> Unggah Transkrip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="skl-pagination">
              <div className="pagination-info">
                Menampilkan 1 - 5 Pendaftar
              </div>
              <div className="pagination-controls">
                <button className="page-nav"><ChevronLeft size={16} /></button>
                <button className="page-num active">1</button>
                <button className="page-num">2</button>
                <button className="page-num">3</button>
                <button className="page-nav"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        <footer className="skl-footer">
          © 2026 SIMTA - Sistem Informasi Manajemen Tugas Akhir Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi
        </footer>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="skl-modal-overlay">
            <motion.div 
              className="skl-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="skl-modal-header">
                <h3>Unggah {modalType} Mahasiswa</h3>
                <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="skl-modal-body">
                <p className="upload-label">Upload {modalType} (PDF) <span className="required">*</span></p>

                {file && (
                  <div className="file-preview-card">
                    <div className="preview-icon">
                      <FileText size={32} color="#B91C1C" />
                    </div>
                    <div className="preview-info">
                      <p className="preview-name">{file.name}</p>
                      <p className="preview-meta">{formatFileSize(file.size)} • PDF</p>
                    </div>
                    <div className="preview-status">
                      <span className="status-badge">Siap</span>
                    </div>
                  </div>
                )}

                <div 
                  className="upload-dropzone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  <div className="dropzone-content">
                    <div className="drop-icon-bg">
                      <File size={32} color="#475569" />
                    </div>
                    <p className="drop-primary">Klik untuk pilih file</p>
                    <p className="drop-secondary">Maksimal file size: 4MB (PDF only)</p>
                  </div>
                </div>

                {uploadError && (
                  <div className="upload-error-box">
                    <div className="error-icon">
                      <AlertCircle size={20} />
                    </div>
                    <div className="error-content">
                      <h5>Error: Ukuran File</h5>
                      <p>{uploadError}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="skl-modal-footer">
                <button className="btn-modal-cancel" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button className="btn-modal-save" onClick={handleSave}>Simpan & Kirim ke Mahasiswa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div 
            className="skl-alert-toast"
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
          >
            <CustomAlert 
              type={alert.type} 
              title={alert.title} 
              message={alert.message} 
              style={{ margin: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="skl-mobile-menu">
        <button onClick={() => setSidebarOpen(true)} className="btn-mobile-nav">
          <Menu size={24} />
        </button>
        <span className="mobile-logo">SIMTA</span>
      </div>
    </div>
  );
};

export default SklTranskrip;
