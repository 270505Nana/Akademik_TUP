import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, Circle, Upload, FileText, Download, Eye, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { ALUR_STEPS } from '../../common/Skstatushelper';
import { downloadEvidence, downloadFileFromUrl, getLecturers, downloadSK } from '../../../service/api';
import '../../../style/css/mahasiswa/verifikasimodalsk.css'; 

const VerifikasiModal = ({
  selectedPermohonan,
  existingResponse,
  isReadOnly = false,
  onClose,
  onSave,
}) => {
  const [step, setStep] = useState(selectedPermohonan.initialStep || 1);
  const [checks, setChecks] = useState({
    proposal: existingResponse?.hasUploadedFinalProposal || false,
    bahasa:   existingResponse?.hasTakenLanguageTest     || false,
  });
  const [catatan,        setCatatan]        = useState(existingResponse?.message || '');
  const [batasPerbaikan, setBatasPerbaikan] = useState(
    existingResponse?.expDate ? existingResponse.expDate.split('T')[0] : ''
  );
  const [isEdit,       setIsEdit]       = useState(
    existingResponse?.isEdit ? existingResponse.isEdit.split('T')[0] : ''
  );
  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [isDragging,     setIsDragging]     = useState(false);
  const [validationError, setValidationError] = useState(''); 
  const fileInputRef = useRef();
  const [activeTab, setActiveTab] = useState('approve'); 

  const [selectedPreview,  setSelectedPreview]  = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [errorMsg,         setErrorMsg]         = useState({});
  const [dosen1,           setDosen1]           = useState(null);
  const [dosen2,           setDosen2]           = useState(null);

  const sktaRequest = selectedPermohonan?.sktaRequest || selectedPermohonan || {};
  const student = sktaRequest?.mahasiswa || sktaRequest?.student || selectedPermohonan?.mahasiswa || selectedPermohonan?.student || {};
  const studentName = student?.name || 'Mahasiswa';
  const studentNim = student?.nim || '-';
  const studentPhone = student?.phone || '-';
  const prodiName = student?.studyProgram?.name || selectedPermohonan?.prodiName || '-';

  const isPerpanjangan = sktaRequest?.category === 'Perpanjangan SK' || selectedPermohonan?.category === 'Perpanjangan SK';
  
  const rawStatus = selectedPermohonan?.status || sktaRequest?.status;
  const isSudahTerbit = rawStatus === 'SUDAH_TERBIT' || rawStatus === 'Sudah Terbit' || !!existingResponse?.sktaUploadPath;

  let evidenceUploads = [];
  
  if (selectedPermohonan?.evidenceUploads?.length) {
    evidenceUploads = [...selectedPermohonan.evidenceUploads];
  } else if (sktaRequest?.sktaRequestUploads?.length) {
    evidenceUploads = [...sktaRequest.sktaRequestUploads];
  }

  if (sktaRequest?.evidenceDownloadUrl) {
    evidenceUploads.push({
      id: `evidence-${sktaRequest.id}`,
      name: 'Dokumen_Evidence.pdf',
      downloadUrl: sktaRequest.evidenceDownloadUrl
    });
  }

  if (isSudahTerbit) {
    evidenceUploads.push({
      id: sktaRequest.id,
      name: 'SKTA_Terbaru.pdf',
      downloadUrl: sktaRequest.skFileUrl || null,
      isFinalSK: true
    });
  } else if (isPerpanjangan) {
    const oldSkUrl = sktaRequest.oldSkFileUrl || sktaRequest.skLamaUrl || sktaRequest.skFileUrl;
    if (oldSkUrl) {
      evidenceUploads.push({
        id: `sk-lama-${sktaRequest.id}`,
        name: 'SKTA_Sebelumnya.pdf',
        downloadUrl: oldSkUrl
      });
    }
  }

  const isExpired = !!((sktaRequest?.expDate || existingResponse?.expDate) && new Date(sktaRequest?.expDate || existingResponse?.expDate) < new Date());

  useEffect(() => {
    if (!existingResponse) return;
    setChecks({
      proposal: existingResponse.hasUploadedFinalProposal || false,
      bahasa:   existingResponse.hasTakenLanguageTest     || false,
    });
    setCatatan(existingResponse.message || '');
    setBatasPerbaikan(existingResponse.expDate ? existingResponse.expDate.split('T')[0] : '');
    setIsEdit(existingResponse.isEdit ? existingResponse.isEdit.split('T')[0] : '');
    if (existingResponse.message) setActiveTab('reject');
    else setActiveTab('approve');
  }, [existingResponse]);

  useEffect(() => {
    const d1Id = sktaRequest?.dosenPembimbing1Id;
    const d2Id = sktaRequest?.dosenPembimbing2Id;
    if (sktaRequest?.dosenPembimbing1?.name && sktaRequest?.dosenPembimbing2?.name) return;
    if (!d1Id && !d2Id) return;

    getLecturers().then(list => {
      if (d1Id && !sktaRequest?.dosenPembimbing1) setDosen1(list.find(d => String(d.id) === String(d1Id)) ?? null);
      if (d2Id && !sktaRequest?.dosenPembimbing2) setDosen2(list.find(d => String(d.id) === String(d2Id)) ?? null);
    }).catch(() => {});
  }, [sktaRequest]);

  const formatDosen = (d) => {
    if (!d) return '-';
    const kode = d.kodeDosen ?? d.lecturerCode ?? d.kode ?? '';
    const nama = d.user?.name ?? d.name ?? d.nama ?? '';
    return kode && nama ? `${kode} - ${nama}` : nama || kode || '-';
  };

  const toggleCheck = (key) => {
    if (isReadOnly) return;
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    setValidationError(''); 
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0]);
    setValidationError('');
  };

  const handleSubmit = () => {
    setValidationError(''); 
    
    if (activeTab === 'reject' && !catatan.trim()) {
      setValidationError('Catatan/Alasan penolakan wajib diisi.');
      return;
    }
    
    if (activeTab === 'approve') {
      if (!checks.proposal || !checks.bahasa) {
        setValidationError('Untuk menyetujui (Approve), semua kelengkapan dokumen wajib ter-checklist.');
        return;
      }
      if (!batasPerbaikan) {
        setValidationError('Tanggal Kedaluwarsa (Exp Date) wajib diisi.');
        return;
      }
      if (!existingResponse?.sktaUploadPath && !uploadedFile) {
        setValidationError('File SK Final wajib diunggah.');
        return;
      }
    }

    onSave({
      selectedPermohonan,
      checks,
      catatan,
      uploadedFile,
      existingResponse,
      batasPerbaikan,
      isEdit,
      actionType: activeTab,
    });
  };

  const fetchBlob = async (upload) => {
    if (upload.isFinalSK && !upload.downloadUrl) return await downloadSK(upload.id);
    if (upload?.downloadUrl) return await downloadFileFromUrl(upload.downloadUrl);
    const uploadId = upload?.id;
    if (!uploadId) throw new Error(`Upload ID tidak ditemukan`);
    return await downloadEvidence(uploadId);
  };

  const openPreview = async (upload) => {
    const uploadId = upload?.id;
    setLoadingPreviewId(uploadId);
    setErrorMsg(prev => ({ ...prev, [uploadId]: null }));
    try {
      const blob     = await fetchBlob(upload);
      const mimeType = blob.type || 'application/pdf';
      const filename = upload.filename || upload.name || 'Dokumen_Evidence.pdf';
      const isPdf    = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
      setSelectedPreview({ url: URL.createObjectURL(blob), name: filename, type: isPdf ? 'pdf' : 'image' });
    } catch (err) {
      setErrorMsg(prev => ({ ...prev, [uploadId]: `Gagal memuat preview (${err.response?.status ?? err.message})` }));
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleDownloadEvidence = async (upload) => {
    const uploadId = upload?.id;
    setLoadingPreviewId(uploadId);
    try {
      const blob    = await fetchBlob(upload);
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = blobUrl;
      a.download    = upload.name || upload.filename || `evidence_${uploadId}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      setErrorMsg(prev => ({ ...prev, [uploadId]: `Gagal mengunduh (${err.response?.status ?? err.message})` }));
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const closePreview = () => {
    if (selectedPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(selectedPreview.url);
    setSelectedPreview(null);
  };

  const InfoRow = ({ label, value }) => (
    <div className="vm-info-row">
      <span className="vm-info-label">{label}</span>
      <span className="vm-info-val">{value || '-'}</span>
    </div>
  );

  return (
    <>
      <div className="vm-overlay">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.95, opacity: 0, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="vm-container"
        >
          {/* HEADER */}
          <div className="vm-header">
            <div className="vm-header-left">
              <h2 className="vm-title">
                Verifikasi Permohonan SKTA - {studentName}
              </h2>
              <span className="vm-badge-nim">
                NIM {studentNim}
              </span>
              {isExpired && (
                <span className="vm-badge-expired">
                  Expired
                </span>
              )}
            </div>
            <button onClick={onClose} className="vm-close-btn">
              <X size={20} />
            </button>
          </div>

          {/* STEPPER */}
          <div className="vm-stepper">
            <div className="vm-step-item" onClick={() => setStep(1)}>
              <div className={`vm-step-circle ${step >= 1 ? 'active-1' : 'inactive-1'}`} style={{ border: step === 1 ? '3px solid #D1FAE5' : 'none' }}>
                {step > 1 ? <CheckCircle2 size={18} /> : '1'}
              </div>
              <span className="vm-step-label" style={{ fontWeight: step >= 1 ? 700 : 500, color: step >= 1 ? '#10B981' : '#6B7280' }}>Informasi & Evidence</span>
            </div>
            <div className="vm-step-line" style={{ background: step > 1 ? '#10B981' : '#E5E7EB' }} />
            <div className="vm-step-item" onClick={() => setStep(2)}>
              <div className={`vm-step-circle ${step >= 2 ? 'active-2' : 'inactive-2'}`} style={{ border: step === 2 ? '3px solid #FFE4E6' : 'none' }}>
                2
              </div>
              <span className="vm-step-label" style={{ fontWeight: step >= 2 ? 700 : 500, color: step >= 2 ? '#E11D48' : '#6B7280' }}>Periksa & Verifikasi</span>
            </div>
          </div>

          {/* BODY CONTENT */}
          <div className="scrollable vm-body-content">
            
            {/* TAHAP 1: INFORMASI & EVIDENCE */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <div style={{ marginBottom: 20 }}>
                  <p className="vm-section-heading">
                    Informasi Tugas Akhir & Akademik
                  </p>
                  <div className="vm-info-grid">
                    <InfoRow label="Nama Lengkap" value={studentName} />
                    <InfoRow label="NIM" value={studentNim} />
                    <InfoRow label="Nomor HP" value={studentPhone} />
                    <InfoRow label="Program Studi" value={prodiName} />
                    <InfoRow label="Judul TA (Bahasa Indonesia)" value={sktaRequest?.judulProposalIndonesia || sktaRequest?.proposalTitleId} />
                    <InfoRow label="Judul TA (Bahasa Inggris)"  value={sktaRequest?.judulProposalInggris || sktaRequest?.proposalTitleEn} />
                    <InfoRow
                      label="Dosen Pembimbing 1"
                      value={sktaRequest?.dosenPembimbing1 ? formatDosen(sktaRequest.dosenPembimbing1) : dosen1 ? formatDosen(dosen1) : (sktaRequest?.dosenPembimbing1Id ? 'Memuat...' : '-')}
                    />
                    <InfoRow
                      label="Dosen Pembimbing 2"
                      value={sktaRequest?.dosenPembimbing2 ? formatDosen(sktaRequest.dosenPembimbing2) : dosen2 ? formatDosen(dosen2) : (sktaRequest?.dosenPembimbing2Id ? 'Memuat...' : '-')}
                    />
                  </div>
                </div>

                <div>
                  <p className="vm-section-heading" style={{ marginBottom: 10 }}>
                    Dokumen Evidence & SKTA
                  </p>
                  {evidenceUploads.length === 0 ? (
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Tidak ada dokumen yang tersedia.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {evidenceUploads.map((upload, idx) => {
                        const uploadId  = upload?.id ?? idx;
                        const isLoading = loadingPreviewId === uploadId;
                        const errMsg    = errorMsg[uploadId];
                        const filename  = upload.name || upload.filename || `File ${idx + 1}`;

                        return (
                          <div key={uploadId} className="vm-file-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <FileText size={20} color={filename.includes('SKTA') ? '#10B981' : '#C0182A'} style={{ flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{filename}</div>
                                {errMsg && <small style={{ color: '#EF4444', fontSize: 11, display: 'block', marginTop: 2 }}>⚠ {errMsg}</small>}
                              </div>
                            </div>

                            <div className="vm-file-actions">
                              <button
                                onClick={() => openPreview(upload)}
                                disabled={Boolean(loadingPreviewId)}
                                className="vm-btn-preview"
                                style={{ opacity: loadingPreviewId ? 0.6 : 1, cursor: loadingPreviewId ? 'not-allowed' : 'pointer' }}
                              >
                                {isLoading ? <Loader size={14} className="sk-spinner-inline" /> : <Eye size={14} />} Preview
                              </button>
                              <button
                                onClick={() => handleDownloadEvidence(upload)}
                                disabled={Boolean(loadingPreviewId)}
                                className="vm-btn-download"
                                style={{ opacity: loadingPreviewId ? 0.6 : 1, cursor: loadingPreviewId ? 'not-allowed' : 'pointer' }}
                              >
                                <Download size={14} /> Unduh
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAHAP 2: VERIFIKASI */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="dm-body" style={{ padding: 0 }}>
                
                {isPerpanjangan && (
                  <div className="vm-alert-box purple">
                    <span style={{ fontSize: '18px' }}>ℹ</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                        Pengajuan Perpanjangan SKTA
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: 12, lineHeight: 1.4 }}>
                        Mahasiswa ini meminta perpanjangan masa berlaku SK yang sebelumnya telah terbit/kedaluwarsa.
                      </p>
                    </div>
                  </div>
                )}

                {!isReadOnly && (
                  <div className="vm-tabs">
                    <button
                      type="button"
                      className="vm-tab-btn"
                      style={{ borderBottom: activeTab === 'approve' ? '3px solid #16A34A' : 'none', color: activeTab === 'approve' ? '#16A34A' : '#6B7280' }}
                      onClick={() => { setActiveTab('approve'); setValidationError(''); }}
                    >
                      Setujui (Approve)
                    </button>
                    <button
                      type="button"
                      className="vm-tab-btn"
                      style={{ borderBottom: activeTab === 'reject' ? '3px solid #DC2626' : 'none', color: activeTab === 'reject' ? '#DC2626' : '#6B7280' }}
                      onClick={() => { setActiveTab('reject'); setValidationError(''); }}
                    >
                      Tolak (Reject)
                    </button>
                  </div>
                )}

                {validationError && (
                  <div className="vm-alert-box red">
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                      {validationError}
                    </p>
                  </div>
                )}

                {(isReadOnly || activeTab === 'approve') && (
                  <>
                    <div className="dm-section" style={{ marginBottom: 16 }}>
                      <div className="dm-section-label">Checklist Kelengkapan Dokumen <span style={{ color: '#DC2626' }}>*</span></div>
                      <div className="dm-checklist">
                        {[
                          { key: 'proposal', label: 'Sudah upload final proposal' },
                          { key: 'bahasa',   label: 'Sudah melakukan test bahasa'  },
                        ].map(({ key, label }) => (
                          <div
                            key={key}
                            className={`dm-check-item ${checks[key] ? 'checked' : ''} ${isReadOnly ? 'dm-check-readonly' : ''}`}
                            onClick={() => toggleCheck(key)}
                            style={isReadOnly ? { cursor: 'default', opacity: 0.85 } : {}}
                          >
                            <span className="dm-check-icon">{checks[key] ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span>
                            <span className="dm-check-label">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dm-section" style={{ marginBottom: 16 }}>
                      <div className="dm-section-label">Tanggal Kedaluwarsa SKTA (Exp Date) *</div>
                      {isReadOnly ? (
                        <div className="dm-readonly-field">
                          {batasPerbaikan ? new Date(batasPerbaikan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </div>
                      ) : (
                        <input type="date" className="dm-input" value={batasPerbaikan} onChange={e => { setBatasPerbaikan(e.target.value); setValidationError(''); }} />
                      )}
                    </div>

                    {!isReadOnly && (
                      <>
                        <div className="dm-section" style={{ marginBottom: 16 }}>
                          <div className="dm-section-label">Alur Penerbitan</div>
                          <ol className="dm-alur-list">
                            {ALUR_STEPS.map((stepItem, i) => (
                              <li key={i} className="dm-alur-item">
                                <span className="dm-alur-num">{i + 1}</span>
                                <span className="dm-alur-text">{stepItem}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="dm-section" style={{ marginBottom: 24 }}>
                          <div className="dm-section-label">Upload File SK Final {isPerpanjangan ? '(Baru) *' : '*'}</div>
                          {existingResponse?.sktaUploadPath && !uploadedFile && !isPerpanjangan && (
                            <div className="dm-file-exists-info" style={{ marginBottom: 8 }}>
                              <CheckCircle2 size={14} /> File SK sudah diupload sebelumnya. Upload file baru untuk mengganti.
                            </div>
                          )}
                          <div
                            className={`dm-upload-area ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current.click()}
                          >
                            <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf" onChange={e => { if (e.target.files[0]) { setUploadedFile(e.target.files[0]); setValidationError(''); } }} />
                            {uploadedFile ? (
                              <>
                                <div className="dm-upload-icon uploaded"><FileText size={22} /></div>
                                <p className="dm-upload-filename">{uploadedFile.name}</p>
                                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Klik untuk ganti file</p>
                              </>
                            ) : (
                              <>
                                <div className="dm-upload-icon"><Upload size={22} /></div>
                                <p className="dm-upload-main">
                                  {isPerpanjangan ? 'Upload SK yang telah diperpanjang masa berlakunya' : 'Drag & Drop atau klik untuk pilih file'}
                                </p>
                                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Format: PDF</p>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {(!isReadOnly && activeTab === 'reject') && (
                  <>
                    <div className="dm-section" style={{ marginBottom: 16 }}>
                      <div className="dm-section-label">Alasan Penolakan / Catatan untuk Mahasiswa *</div>
                      <textarea
                        className="dm-textarea"
                        placeholder="Tuliskan alasan penolakan secara jelas agar mahasiswa dapat memperbaiki dokumen..."
                        value={catatan}
                        onChange={e => { setCatatan(e.target.value); setValidationError(''); }}
                        rows={4}
                      />
                    </div>
                    <div className="dm-section">
                      <div className="dm-section-label">Batas Waktu Perbaikan</div>
                      <input type="date" className="dm-input" value={isEdit} onChange={e => setIsEdit(e.target.value)} />
                      <p style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>Berikan tenggat waktu bagi mahasiswa untuk merevisi berkas mereka.</p>
                    </div>
                  </>
                )}

              </motion.div>
            )}

          </div>

          {/* FOOTER */}
          <div className="vm-footer">
            {step === 1 ? (
              <>
                <button onClick={onClose} className="vm-btn-secondary">Batal</button>
                <button onClick={() => setStep(2)} className="vm-btn-primary">Lanjut: Verifikasi</button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(1)} className="vm-btn-secondary">Kembali</button>
                {!isReadOnly && (
                  <button
                    onClick={handleSubmit}
                    className={activeTab === 'reject' ? 'vm-btn-danger' : 'vm-btn-success'}
                  >
                    {activeTab === 'reject' ? 'Tolak Pengajuan' : 'Setujui & Kirim'}
                  </button>
                )}
                {isReadOnly && (
                  <button onClick={onClose} className="vm-btn-success">Tutup</button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {selectedPreview && (
        <div className="vm-preview-overlay" onClick={closePreview}>
          <motion.div className="vm-preview-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#2a2a2a', borderBottom: '1px solid #3a3a3a', flexShrink: 0 }}>
              <h4 style={{ margin: 0, fontSize: 13, color: '#e5e7eb', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                {selectedPreview.name}
              </h4>
              <button onClick={closePreview} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedPreview.type === 'pdf' ? (
                <iframe src={selectedPreview.url} title={selectedPreview.name} width="100%" height="100%" style={{ border: 'none', display: 'block' }} />
              ) : (
                <img src={selectedPreview.url} alt={selectedPreview.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default VerifikasiModal;