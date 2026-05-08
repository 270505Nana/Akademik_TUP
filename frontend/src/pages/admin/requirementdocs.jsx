import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Upload, 
  File, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import '../../components/admin/requirementdocs.css';
const RequirementDoc = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [docs, setDocs] = useState([
    { id: 1, name: 'Kartu Hasil Studi (KHS) Total', uploadedAt: '12 Oct 2026' },
    { id: 2, name: 'Berkas Kelengkapan Dokumen Yudisium', uploadedAt: '12 Oct 2026' },
    { id: 3, name: 'Berkas Kelengkapan Berkas Bukti Upload Open Library', uploadedAt: '13 Oct 2026' },
    { id: 4, name: 'Berkas Scan Bukti Pembayaran Wisuda', uploadedAt: '13 Oct 2026' },
    { id: 5, name: 'Berkas Lembar Pengesahan Tugas Akhir', uploadedAt: '14 Oct 2026' },
  ]);

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!docName.trim()) {
      showAlert('error', 'Gagal', 'Nama dokumen wajib diisi.');
      return;
    }
    if (!selectedFile) {
      showAlert('error', 'Gagal', 'File wajib dipilih sebelum publish.');
      return;
    }

    // Success simulation
    const newDoc = {
      id: Date.now(),
      name: docName,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setDocs([newDoc, ...docs]);
    setIsModalOpen(false);
    setDocName('');
    setSelectedFile(null);
    showAlert('success', 'Berhasil', 'Berkas Persyaratan Berhasil Ditambahkan!');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="admin-layout">
      <SidebarAdmin 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, icon, type) => showAlert(type || 'success', 'Info', msg)}
      />

      <div className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} className="menu-toggle">
            <Menu size={24} />
          </button>
          <span className="logo-label">SIMTA</span>
        </div>

        {/* Top Header Bar */}
        <header className="page-header-red">
          <h1>Manajemen Dokumen</h1>
        </header>

        <div className="content-inner">
          {/* Breadcrumb */}
          <div className="breadcrumb-nav">
            Beranda / manajemen Dok / Template Dok
          </div>

          {/* Page Title & Add Button */}
          <div className="title-section">
            <h2 className="title-text">Formulir Verifikasi Berkas</h2>
          </div>

          {/* Table Card */}
          <div className="table-card">
            <div className="table-card-top">
               {/* Left empty as per design, button is actually usually inside or near the header */}
               <div className="spacer"></div>
               <button className="btn-add-requirement" onClick={() => setIsModalOpen(true)}>
                 <Plus size={18} /> Tambah Persyaratan Berkas
               </button>
            </div>

            <div className="table-container">
              <table className="requirement-table">
                <thead>
                  <tr>
                    <th>NAMA DOKUMEN</th>
                    <th>FILE</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="col-name">
                        <div className="doc-item-info">
                          <span className="doc-name-label">{doc.name}</span>
                          <span className="uploaded-date">Uploaded: {doc.uploadedAt}</span>
                        </div>
                      </td>
                      <td className="col-file">
                        <a href="#" className="pdf-link">
                          <FileText size={18} className="pdf-icon" />
                          Lihat PDF
                        </a>
                      </td>
                      <td className="col-action">
                        <div className="action-buttons">
                          <button className="btn-edit-small">
                            <Edit3 size={16} /> Edit
                          </button>
                          <button className="btn-delete-small">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="table-footer">
              <div className="entries-info">
                Menampilkan 1 - 5 Pendaftar
              </div>
              <div className="pagination">
                <button className="page-btn"><ChevronLeft size={16} /></button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <button className="page-btn"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        <footer className="admin-footer-copyright">
          © 2026 SIMTA - Sistem Informasi Manajemen Tugas Akhir Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi
        </footer>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-wrapper">
            <motion.div 
              className="modal-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button className="close-x" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>

              <div className="modal-content-area">
                <h3 className="modal-title-input">Tuliskan Nama Dokumen</h3>
                
                <input 
                  type="text" 
                  className="modal-input-field" 
                  placeholder="Silahkan Tulis Disini"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                />

                <div className="upload-dropzone">
                  <div className="dropzone-inner">
                    <div className="upload-icon-circle">
                      <Upload size={40} className="cloud-icon" />
                    </div>
                    <p className="upload-text">
                      Drag and Drop of <label className="choose-file-btn">
                        Chose File
                        <input type="file" className="hidden-input" onChange={handleFileChange} />
                      </label> To upload
                    </p>
                    {selectedFile && (
                      <div className="selected-filename">
                        <File size={14} /> {selectedFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions-centered">
                  <button className="btn-publish-doc" onClick={handlePublish}>
                    <Plus size={18} className="btn-icon-mr" /> Publish
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div 
            className="alert-vignette"
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
          >
            <CustomAlert 
              type={alert.type} 
              title={alert.title} 
              message={alert.message} 
              style={{ margin: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      </div>
  );
};

export default RequirementDoc;
