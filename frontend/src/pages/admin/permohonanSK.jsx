import React, { useState, useRef, useEffect } from 'react';
import { Search, Download, FileText, X, Eye, ChevronLeft, ChevronRight, Menu, Upload, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import '../../components/admin/css/permohonanSK.css';

import { 
  getAllSktaRequests, 
  getSktaResponseByRequestId, 
  createOrUpdateSktaResponse, 
  uploadSkFinal 
} from '../../service/api';

import { useAuth } from '../../context/AuthContext';

const ALUR_STEPS = [
  'Data diproses di I-Gracias untuk pengecekan nomor SK',
  'Unduh SK dari I-Gracias',
  'Berikan kop surat resmi',
  'Unggah ulang SK final ke SIMTA',
];

const StatusBadge = ({ status }) => {
  const config = {
    'sudah-terbit': { label: 'Sudah Terbit', cls: 'sudah-terbit' },
    'belum-terbit': { label: 'Belum Terbit', cls: 'belum-terbit' },
    'dalam-proses': { label: 'Dalam Proses', cls: 'dalam-proses' },
    'expired':      { label: 'Expired', cls: 'belum-terbit' },
  };
  const { label, cls } = config[status] || { label: status || 'Pending', cls: '' };
  return <span className={`sk-badge ${cls}`}>{label}</span>;
};

const PermohonanSK = () => {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProdi, setFilterProdi] = useState('Semua Prodi');
  const [currentPage, setCurrentPage] = useState(1);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prodiCache, setProdiCache] = useState({}); // Cache nama prodi

  const [evidenceItem, setEvidenceItem] = useState(null);
  const [selectedVerifikasi, setSelectedVerifikasi] = useState(null);
  const [existingResponse, setExistingResponse] = useState(null);

  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 4000);
  };

  const determineStatus = (request, response) => {
    if (!response) return 'dalam-proses';
    const hasLang = response.hasTakenLanguageTest === true;
    const hasProposal = response.hasUploadedFinalProposal === true;
    const hasUpload = response.sktaResponseUploads?.length > 0;
    const isExpired = response.expDate && new Date(response.expDate) < new Date();

    if (isExpired) return 'expired';
    if (hasLang && hasProposal && hasUpload) return 'sudah-terbit';
    if (!hasLang || !hasProposal) return 'belum-terbit';
    return 'dalam-proses';
  };

  // Fetch Nama Prodi berdasarkan ID
  const fetchProdiName = async (studyProgramId) => {
    if (!studyProgramId) return '-';
    if (prodiCache[studyProgramId]) return prodiCache[studyProgramId];

    try {
      const res = await fetch(`http://localhost:3000/api/study-programs/${studyProgramId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('simta_token')}`,
        }
      });
      const data = await res.json();
      const prodiName = data.data?.name || data.name || `Prodi ${studyProgramId}`;
      setProdiCache(prev => ({ ...prev, [studyProgramId]: prodiName }));
      return prodiName;
    } catch (err) {
      console.error(`Gagal fetch prodi ${studyProgramId}`, err);
      return `Prodi ${studyProgramId}`;
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAllSktaRequests({
        search: search.trim() || undefined,
        studyProgram: filterProdi !== 'Semua Prodi' ? filterProdi : undefined,
      });

      let dataList = res.data || res || [];

      const latestMap = new Map();
      dataList.forEach(item => {
        const sid = item.studentId;
        if (!latestMap.has(sid) || new Date(item.createdAt) > new Date(latestMap.get(sid).createdAt)) {
          latestMap.set(sid, item);
        }
      });

      // Enrich dengan nama prodi
      const enriched = await Promise.all(
        Array.from(latestMap.values()).map(async (item) => {
          const prodiName = await fetchProdiName(item.student?.studyProgramId);
          return { 
            ...item, 
            student: item.student || {},
            prodiName 
          };
        })
      );

      setRequests(enriched);
    } catch (err) {
      console.error(err);
      if ([401, 403].includes(err.response?.status)) {
        showAlert('error', 'Sesi Berakhir', 'Maaf sesi anda sudah habis, silahkan login kembali');
        setTimeout(() => logout(), 1800);
      } else {
        showAlert('error', 'Gagal Memuat', 'Tidak dapat mengambil data permohonan SK');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ACADEMIC_STAFF') fetchRequests();
  }, [search, filterProdi, user]);

  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const paginated = requests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleOpenVerifikasi = async (item) => {
    setSelectedVerifikasi(item);
    setExistingResponse(null);
    try {
      const resp = await getSktaResponseByRequestId(item.id);
      setExistingResponse(resp);
    } catch (_) {}
  };

  const handleSaveVerifikasi = async ({ selectedPermohonan, checks, catatan, uploadedFile, existingResponse }) => {
    try {
      const payload = {
        sktaRequestId: selectedPermohonan.id,
        message: catatan,
        hasTakenLanguageTest: checks.proposal,
        hasUploadedFinalProposal: checks.toefl,
      };

      const { data: responseData } = await createOrUpdateSktaResponse({
        id: existingResponse?.id,
        ...payload
      });

      if (uploadedFile) {
        await uploadSkFinal(responseData.id || existingResponse?.id, uploadedFile);
      }

      showAlert('success', 'Berhasil', `SK untuk ${selectedPermohonan.student?.name} berhasil diproses.`);
      setSelectedVerifikasi(null);
      fetchRequests();
    } catch (err) {
      showAlert('error', 'Gagal', err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleExportEvidence = (item) => {
    showAlert('success', 'Export Evidence', `Mempersiapkan dokumen akreditasi untuk ${item.student?.name}...`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"><Menu size={20} /></button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red"><h1>Layanan SK TA</h1></div>

          <div className="content-container">
            <div className="breadcrumb">Beranda / Layanan SK TA / Permohonan SK</div>
            <h2 className="page-title">Permohonan SK TA</h2>

            <section className="card-main">
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="sk-filter-bar">
                  <div className="sk-search-wrap">
                    <span className="sk-search-icon"><Search size={15} /></span>
                    <input 
                      type="text" 
                      className="sk-search-input" 
                      placeholder="Cari Nama atau NIM..." 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                    />
                  </div>

                  <select className="sk-filter-select" value={filterProdi} onChange={(e) => setFilterProdi(e.target.value)}>
                    {['Semua Prodi', 'S1 RPL', 'S1 IF', 'S1 DKV', 'S1 BIOMED', 'S1 TEKDUS'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <button className="btn-export-sk" onClick={() => showAlert('success', 'Export Berhasil', 'Data evidence akreditasi sedang disiapkan...')}>
                    <Download size={15} /> Expor Evidence Akreditasi
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />

              <div className="sk-table-wrap">
                <table className="sk-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>NO</th>
                      <th>MAHASISWA</th>
                      <th>PRODI</th>
                      <th style={{ textAlign: 'center' }}>EVIDENCE</th>
                      <th style={{ textAlign: 'center' }}>STATUS BERKAS</th>
                      <th>TANGGAL</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12">Memuat data...</td></tr>
                    ) : requests.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '100px 20px', textAlign: 'center' }}>
                          <FileText size={48} style={{ color: '#94A3B8', marginBottom: '16px' }} />
                          <p style={{ fontSize: '1.1rem', color: '#64748B', fontWeight: 500 }}>
                            Belum ada permohonan SK TA saat ini
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((item, idx) => {
                        const student = item.student || {};
                        const nama = student.name || `Mahasiswa ID ${item.studentId}`;
                        const nim = student.nim || '-';
                        const prodi = item.prodiName || '-';

                        const status = determineStatus(item, item.sktaResponse || null);

                        return (
                          <tr key={item.id}>
                            <td className="text-center">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                            <td>
                              <div className="sk-mhs-name">{nama}</div>
                              <div className="sk-mhs-nim">{nim}</div>
                            </td>
                            <td><span className="sk-prodi-text">{prodi}</span></td>
                            <td className="text-center">
                              <button className="btn-evidence" onClick={() => setEvidenceItem(item)}>
                                <Eye size={13} /> Lihat Evidence
                              </button>
                            </td>
                            <td style={{ textAlign: 'center' }}><StatusBadge status={status} /></td>
                            <td className="sk-date-text">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="text-center action-buttons">
                              <button className="btn-verifikasi-sk" onClick={() => handleOpenVerifikasi(item)}>Verifikasi</button>
                              <button className="btn-export-sk" onClick={() => handleExportEvidence(item)}>Export</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {requests.length > 0 && (
                <div className="sk-table-footer">
                  <span className="sk-page-info">
                    Menampilkan {(currentPage-1)*PAGE_SIZE + 1} - {Math.min(currentPage*PAGE_SIZE, requests.length)} dari {requests.length} Pendaftar
                  </span>
                  <div className="sk-pagination">
                    <button className="btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} className={`btn-page ${page === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                    ))}
                    <button className="btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {evidenceItem && <EvidenceModal item={evidenceItem} onClose={() => setEvidenceItem(null)} />}
        {selectedVerifikasi && (
          <VerifikasiModal
            selectedPermohonan={selectedVerifikasi}
            existingResponse={existingResponse}
            onClose={() => { setSelectedVerifikasi(null); setExistingResponse(null); }}
            onSave={handleSaveVerifikasi}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div className="alert-overlay" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}>
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/*  MODAL EVIDENCE  */
const EvidenceModal = ({ item, onClose }) => {
  if (!item) return null;
  const student = item.student || {};
  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <motion.div className="ev-modal-box" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div className="ev-modal-header">
          <h3>Evidence Permohonan SK</h3>
          <button className="ev-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ev-modal-body">
          <div className="ev-info-row"><span className="ev-info-label">Nama</span><span>{student.name}</span></div>
          <div className="ev-info-row"><span className="ev-info-label">NIM</span><span>{student.nim}</span></div>
          <div className="ev-info-row"><span className="ev-info-label">Prodi ID</span><span>{student.studyProgramId}</span></div>
        </div>
        <div className="ev-modal-footer">
          <button className="btn-close-modal" onClick={onClose}>Tutup</button>
        </div>
      </motion.div>
    </div>
  );
};

/*  MODAL VERIFIKASI  */
const VerifikasiModal = ({ selectedPermohonan, existingResponse, onClose, onSave }) => {
  const [checks, setChecks] = useState({ proposal: false, bahasa: false });
  const [catatan, setCatatan] = useState(existingResponse?.message || '');
  const [batasPerbaikan, setBatasPerbaikan] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setUploadedFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    onSave({ selectedPermohonan, checks, catatan, uploadedFile, existingResponse });
  };

  const studentName = selectedPermohonan?.student?.name || selectedPermohonan?.nama || 'Mahasiswa';

  return (
    <div className="dm-overlay" onClick={onClose}>
      <motion.div className="dm-box" initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0, y: 16 }} onClick={e => e.stopPropagation()}>
        <div className="dm-header">
          <h3 className="dm-header-title">Proses Penerbitan SK — {studentName}</h3>
          <button className="dm-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="dm-body">
          <div className="dm-section">
            <div className="dm-section-label">Checklist Kelengkapan Dokumen</div>
            <div className="dm-checklist">
              <button className={`dm-check-item ${checks.proposal ? 'checked' : ''}`} onClick={() => toggleCheck('proposal')}>
                <span className="dm-check-icon">{checks.proposal ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span>
                <span className="dm-check-label">Sudah upload final proposal</span>
              </button>
              <button className={`dm-check-item ${checks.bahasa ? 'checked' : ''}`} onClick={() => toggleCheck('bahasa')}>
                <span className="dm-check-icon">{checks.bahasa ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span>
                <span className="dm-check-label">Sudah melakukan test bahasa</span>
              </button>
            </div>
          </div>

          <div className="dm-section">
            <div className="dm-section-label">Alur Penerbitan</div>
            <ol className="dm-alur-list">
              {ALUR_STEPS.map((step, i) => (
                <li key={i} className="dm-alur-item">
                  <span className="dm-alur-num">{i + 1}</span>
                  <span className="dm-alur-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="dm-section">
            <div className="dm-section-label">Batas Perbaikan</div>
            <input type="date" className="dm-textarea" value={batasPerbaikan} onChange={(e) => setBatasPerbaikan(e.target.value)} />
          </div>

          <div className="dm-section">
            <div className="dm-section-label">Tuliskan Catatan Disini</div>
            <textarea className="dm-textarea" placeholder="Silahkan Tulis Disini" value={catatan} onChange={e => setCatatan(e.target.value)} rows={4} />
          </div>

          <div className="dm-section">
            <div className="dm-section-label">Upload File SK</div>
            <div className={`dm-upload-area ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              {uploadedFile ? (
                <>
                  <div className="dm-upload-icon uploaded"><FileText size={22} /></div>
                  <p className="dm-upload-filename">{uploadedFile.name}</p>
                </>
              ) : (
                <>
                  <div className="dm-upload-icon"><Upload size={22} /></div>
                  <p className="dm-upload-main">Drag and Drop or Choose File To upload</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="dm-footer">
          <button className="dm-btn-batal" onClick={onClose}>Batal</button>
          <button className="dm-btn-simpan" onClick={handleSubmit}>Simpan & Kirim</button>
        </div>
      </motion.div>
    </div>
  );
};

export default PermohonanSK;