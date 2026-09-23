import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, X, UploadCloud, Menu, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import { getAllTemplates, createTemplate, updateTemplate, toggleTemplatePublish, toggleTemplateRequired, getTemplatePreview, downloadTemplateFile } from '../../service/api'; 

const CATEGORIES = [
  "Permohonan SKTA",
  "Sidang - Berkas Wajib",
  "Sidang - Berkas Tes Bahasa (Sudah)",
  "Sidang - Berkas Tes Bahasa (Belum)",
  "Sidang - Evidence Non Sidang Publikasi Jurnal",
  "Sidang - Evidence Non Sidang Proceeding International",
  "Sidang - Evidence Non Sidang HKI",
  "Yudisium - Berkas Wajib",
  "Yudisium - Evidence Cumlaude Publikasi Jurnal",
  "Yudisium - Evidence Cumlaude Pameran",
  "Yudisium - Evidence Cumlaude Lomba",
  "Yudisium - Evidence Cumlaude HKI",
  "Yudisium - Evidence Wirausaha"
];

const KelolaBerkas = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  
  const [openSections, setOpenSections] = useState({ skta: true, sidang: true, yudisium: true });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedData, setSelectedData] = useState(null); 
  const [formData, setFormData] = useState({ name: '', category: '', isRequired: true, isPublish: true });
  const [file, setFile] = useState(null);

  const [previewModal, setPreviewModal] = useState({ isOpen: false, item: null, blobUrl: null, loading: false });

  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 4000);
  };

  const fetchTemplates = async () => {
    setLoadingTable(true);
    try {
      const res = await getAllTemplates({ limit: "all" });
      const dataList = Array.isArray(res) ? res : res?.data || [];
      setTemplates(dataList);
    } catch (error) {
      console.error("Error fetch templates:", error);
      showAlert('error', 'Gagal', 'Tidak dapat memuat data persyaratan berkas.');
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const sktaTemplates = templates.filter(item => item.category?.toLowerCase().includes('skta'));
  const sidangTemplates = templates.filter(item => item.category?.toLowerCase().includes('sidang'));
  const yudisiumTemplates = templates.filter(item => item.category?.toLowerCase().includes('yudisium'));

  const toggleSection = (sectionKey) => setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));

  const handleOpenAddModal = () => {
    setSelectedData(null);
    setFormData({ name: '', category: '', isRequired: true, isPublish: true });
    setFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setSelectedData(item);
    setFormData({ name: item.name || '', category: item.category || '', isRequired: item.isRequired ?? true, isPublish: item.isPublish ?? true });
    setFile(null); 
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      showAlert("error", "Validasi Gagal", "Nama dokumen dan Kategori wajib diisi!");
      return;
    }
    setModalLoading(true);
    try {
      const payload = { ...formData, templateFile: file };
      if (selectedData?.id) await updateTemplate(selectedData.id, payload);
      else await createTemplate(payload);
      fetchTemplates(); 
      handleCloseModal();
      showAlert("success", "Berhasil", "Persyaratan berkas berhasil disimpan.");
    } catch (error) {
      console.error("Error saving template:", error);
      showAlert("error", "Gagal Menyimpan", "Terjadi kesalahan saat menyimpan data ke server.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenPreview = async (item) => {
    const code = item.code || item.id; 
    setPreviewModal({ isOpen: true, item, blobUrl: null, loading: true });
    
    try {
      const blob = await getTemplatePreview(code);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewModal(prev => ({ ...prev, blobUrl, loading: false }));
    } catch (error) {
      console.error("Gagal memuat preview:", error);
      setPreviewModal(prev => ({ ...prev, loading: false }));
      showAlert('error', 'Gagal', 'Tidak dapat memuat pratinjau dokumen. File mungkin tidak tersedia.');
    }
  };

  const handleClosePreview = () => {
    if (previewModal.blobUrl) {
      URL.revokeObjectURL(previewModal.blobUrl); 
    }
    setPreviewModal({ isOpen: false, item: null, blobUrl: null, loading: false });
  };

  const handleDownloadFile = async (item) => {
    const code = item.code || item.id;
    try {
      showAlert("success", "Mengunduh...", "Sedang mengambil file dari server.");
      const blob = await downloadTemplateFile(code);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name ? `${item.name}.pdf` : 'dokumen-persyaratan.pdf'; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengunduh:", error);
      showAlert('error', 'Gagal', 'Terjadi kesalahan saat mengunduh dokumen.');
    }
  };

  const handleTogglePublish = async (item) => {
    const isCurrentlyPublished = item.isPublish === true || item.isPublish === 'true';
    setTemplates(prev => prev.map(t => t.id === item.id ? { ...t, isPublish: !isCurrentlyPublished } : t));
    try {
      await toggleTemplatePublish(item.id);
    } catch (error) {
      showAlert("error", "Gagal", "Server menolak perubahan status Publish.");
      setTemplates(prev => prev.map(t => t.id === item.id ? { ...t, isPublish: isCurrentlyPublished } : t));
    }
  };

  const handleToggleRequired = async (item) => {
    const isCurrentlyRequired = item.isRequired === true || item.isRequired === 'true';
    setTemplates(prev => prev.map(t => t.id === item.id ? { ...t, isRequired: !isCurrentlyRequired } : t));
    try {
      await toggleTemplateRequired(item.id);
    } catch (error) {
      showAlert("error", "Gagal", "Server menolak perubahan status Wajib.");
      setTemplates(prev => prev.map(t => t.id === item.id ? { ...t, isRequired: isCurrentlyRequired } : t));
    }
  };

  const renderTableSection = (title, sectionKey, sectionData) => {
    const isOpen = openSections[sectionKey];
    return (
      <div key={sectionKey} style={{ marginBottom: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div 
          onClick={() => toggleSection(sectionKey)}
          style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: isOpen ? '1px solid #E2E8F0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', color: '#1E293B', fontWeight: 600 }}>
            {title} <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 400, marginLeft: '8px' }}>({sectionData.length} Berkas)</span>
          </h3>
          {isOpen ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', padding: '0 20px 20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, width: '35%' }}>Nama Dokumen</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, width: '25%' }}>Kategori Spesifik</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, width: '20%' }}>Keterangan & Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, width: '10%' }}>Template</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center', width: '10%' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTable ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Memuat data...</td></tr>
                    ) : sectionData.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>Belum ada persyaratan berkas di kategori ini.</td></tr>
                    ) : (
                      sectionData.map((item) => {
                        const isPub = item.isPublish === true || item.isPublish === 'true';
                        const isReq = item.isRequired === true || item.isRequired === 'true';
                        const hasFile = !!(item.url || item.code || item.id);
                        
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>{item.name}</div>
                              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Terakhir diubah: {new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID')}</div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', color: '#475569' }}>{item.category}</td>
                            <td style={{ padding: '16px', fontSize: '13px' }}>
                              <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                  <input type="checkbox" checked={isPub} onChange={() => handleTogglePublish(item)} style={{ display: 'none' }} />
                                  <div style={{ position: 'relative', width: '36px', height: '20px', background: isPub ? '#16A34A' : '#CBD5E1', borderRadius: '999px', transition: 'background 0.3s' }}>
                                    <div style={{ position: 'absolute', top: '2px', left: isPub ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: isPub ? '#16A34A' : '#64748B' }}>{isPub ? 'Aktif' : 'Non-Aktif'}</span>
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                                  <input type="checkbox" checked={isReq} onChange={() => handleToggleRequired(item)} style={{ display: 'none' }} />
                                  <div style={{ position: 'relative', width: '36px', height: '20px', background: isReq ? '#DC2626' : '#CBD5E1', borderRadius: '999px', transition: 'background 0.3s' }}>
                                    <div style={{ position: 'absolute', top: '2px', left: isReq ? '18px' : '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: isReq ? '#DC2626' : '#64748B' }}>{isReq ? 'Wajib' : 'Opsional'}</span>
                                </label>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              {hasFile ? (
                                <button onClick={() => handleOpenPreview(item)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#C0182A', fontSize: '13px', textDecoration: 'none', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                  <Eye size={14} /> Lihat PDF
                                </button>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: '13px' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <button onClick={() => handleOpenEditModal(item)} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#475569', padding: '8px', borderRadius: '8px' }} title="Edit Berkas">
                                <Edit size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="sk-page-root" style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="sk-main-content" style={{ flex: 1, minWidth: 0, overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-menu-bar" style={{ display: 'none' }}>
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"><Menu size={20} /></button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper" style={{ zoom: 0.75, transformOrigin: 'top left' }}>
          <div className="top-bar-red" style={{ padding: '20px 30px', background: '#C0182A', color: 'white' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Manajemen Dokumen</h1>
          </div>

          <div className="content-container" style={{ padding: '30px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Beranda / Manajemen Data / Persyaratan Berkas</p>
                <h2 style={{ margin: '8px 0 0', fontSize: '20px', color: '#1E293B' }}>Formulir Verifikasi Berkas</h2>
              </div>
              <button onClick={handleOpenAddModal} style={{ background: '#C0182A', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                + Tambah Persyaratan Berkas
              </button>
            </div>

            {renderTableSection("Berkas Permohonan SKTA", "skta", sktaTemplates)}
            {renderTableSection("Berkas Kegiatan Sidang", "sidang", sidangTemplates)}
            {renderTableSection("Berkas Pendaftaran Yudisium", "yudisium", yudisiumTemplates)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {previewModal.isOpen && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}
          >
            <motion.div 
              className="modal-content" 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '800px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Header Modal Preview */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>
                  Pratinjau: {previewModal.item?.name || 'Dokumen'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => handleDownloadFile(previewModal.item)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#C0182A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <Download size={16} /> Unduh File
                  </button>
                  <button onClick={handleClosePreview} style={{ background: '#E2E8F0', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative', background: '#F1F5F9' }}>
                {previewModal.loading ? (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#64748B', fontWeight: 500 }}>
                    Memuat pratinjau dokumen...
                  </div>
                ) : previewModal.blobUrl ? (
                  <iframe 
                    src={previewModal.blobUrl} 
                    title="PDF Preview" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#EF4444', fontWeight: 500 }}>
                    Gagal memuat dokumen. File mungkin rusak atau tidak tersedia.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}
          >
            <motion.div 
              className="modal-content" 
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
              style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
                  {selectedData ? 'Edit Dokumen Persyaratan' : 'Tambah Dokumen Persyaratan'}
                </h3>
                <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
              </div>
              <form onSubmit={handleSubmitModal}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Nama Dokumen <span style={{color: '#E11D48'}}>*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: Bukti Submit Jurnal" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Kategori Dokumen <span style={{color: '#E11D48'}}>*</span></label>
                  <select name="category" value={formData.category} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} required>
                    <option value="" disabled>Pilih Kategori...</option>
                    {CATEGORIES.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569' }}>
                    <input type="checkbox" name="isRequired" checked={formData.isRequired} onChange={handleInputChange} style={{ width: '16px', height: '16px' }} />
                    Wajib Diunggah
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#475569' }}>
                    <input type="checkbox" name="isPublish" checked={formData.isPublish} onChange={handleInputChange} style={{ width: '16px', height: '16px' }} />
                    Status Aktif (Tampil)
                  </label>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#334155' }}>Template / Format Dokumen (Opsional)</label>
                  <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '24px', textAlign: 'center', background: '#F8FAFC', position: 'relative' }}>
                    <UploadCloud size={32} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Drag and Drop atau <span style={{ color: '#C0182A', fontWeight: 600 }}>Pilih File</span></p>
                    {file && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>{file.name}</p>}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  </div>
                  <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#94A3B8' }}>*Bisa dikosongkan jika mahasiswa membuat form bebas.</span>
                </div>
                <button type="submit" disabled={modalLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#C0182A', color: '#fff', fontSize: '15px', fontWeight: 600, border: 'none', cursor: modalLoading ? 'not-allowed' : 'pointer', opacity: modalLoading ? 0.7 : 1 }}>
                  {modalLoading ? 'Memproses...' : (selectedData ? 'Simpan Perubahan' : 'Publish Persyaratan')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-overlay {
          box-sizing: border-box !important;
        }
        @media (min-width: 992px) {
          .sk-main-content {
            margin-left: 240px;
          }
          .modal-overlay {
            padding-left: 240px !important; /* Menyesuaikan posisi tengah modal agar tidak tertutup sidebar */
          }
        }
      `}</style>
    </div>
  );
};

export default KelolaBerkas;