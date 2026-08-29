import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, Circle, Upload, FileText, Download, Eye, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { ALUR_STEPS } from '../../common/Skstatushelper';
import { downloadSK, downloadEvidence, downloadFileFromUrl, getLecturers } from '../../../service/api';

const VerifikasiModal = ({
  selectedPermohonan,
  existingResponse,
  isReadOnly = false,
  onClose,
  onSave,
}) => {
  // --- STATE UNTUK STEPPER ---
  const [step, setStep] = useState(selectedPermohonan.initialStep || 1);

  // --- STATE DARI VERIFIKASI MODAL ---
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
  const [downloadingSK,  setDownloadingSK]  = useState(false);
  const [downloadError,  setDownloadError]  = useState(null);
  const [validationError, setValidationError] = useState(''); // State untuk custom alert text merah
  const fileInputRef = useRef();
  const [activeTab, setActiveTab] = useState('approve'); 

  // --- STATE UNTUK PREVIEW SK FINAL ---
  const [skPreviewUrl, setSkPreviewUrl] = useState(null);
  const [isLoadingSkPreview, setIsLoadingSkPreview] = useState(false);

  // --- STATE DARI EVIDENCE MODAL ---
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

  const evidenceUploads = selectedPermohonan?.evidenceUploads?.length
    ? selectedPermohonan.evidenceUploads
    : sktaRequest?.evidenceDownloadUrl
      ? [{ id: sktaRequest.id, name: 'Dokumen_Evidence.pdf', downloadUrl: sktaRequest.evidenceDownloadUrl }]
      : (sktaRequest.sktaRequestUploads || []);

  const existingSkFile = existingResponse?.sktaUploadPath;
  const isExpired = !!(existingResponse?.expDate && new Date(existingResponse.expDate) < new Date());

  // --- EFFECTS ---
  useEffect(() => {
    if (!existingResponse) return;
    setChecks({
      proposal: existingResponse.hasUploadedFinalProposal || false,
      bahasa:   existingResponse.hasTakenLanguageTest     || false,
    });
    setCatatan(existingResponse.message || '');
    setBatasPerbaikan(existingResponse.expDate ? existingResponse.expDate.split('T')[0] : '');
    setIsEdit(existingResponse.isEdit ? existingResponse.isEdit.split('T')[0] : '');
    if (existingResponse.message) {
      setActiveTab('reject');
    } else {
      setActiveTab('approve');
    }
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

  // Effect untuk otomatis fetch SK blob agar bisa dipreview
  useEffect(() => {
    if (existingSkFile && selectedPermohonan?.id) {
      const fetchSkPreview = async () => {
        setIsLoadingSkPreview(true);
        try {
          const blob = await downloadSK(selectedPermohonan.id);
          const url = URL.createObjectURL(blob);
          setSkPreviewUrl(url);
        } catch (err) {
          console.error("Gagal memuat preview SK", err);
        } finally {
          setIsLoadingSkPreview(false);
        }
      };
      fetchSkPreview();
    }
  }, [existingSkFile, selectedPermohonan?.id]);

  // --- HANDLERS ---
  const formatDosen = (d) => {
    if (!d) return '-';
    const kode = d.kodeDosen ?? d.lecturerCode ?? d.kode ?? '';
    const nama = d.user?.name ?? d.name ?? d.nama ?? '';
    return kode && nama ? `${kode} - ${nama}` : nama || kode || '-';
  };

  const toggleCheck = (key) => {
    if (isReadOnly) return;
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    setValidationError(''); // Hilangkan error saat user klik checkbox
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0]);
    setValidationError('');
  };

  const handleDownloadSK = async () => {
    // Kalau URL preview sudah ada, kita bisa langsung unduh dari memori tanpa hit API lagi (lebih cepat)
    if (skPreviewUrl) {
      const a = document.createElement('a');
      a.href = skPreviewUrl;
      a.download = `SK_TA_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback jika preview URL belum sempat terload
    const uploadId = existingSkFile?.id || existingResponse?.sktaUploadPath;
    if (!uploadId) {
      setDownloadError('ID file SK tidak ditemukan.');
      return;
    }
    setDownloadingSK(true);
    setDownloadError(null);
    try {
      const blob = await downloadSK(selectedPermohonan.id);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `SK_TA_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(err.response?.data?.message || 'Gagal mengunduh SK. Coba lagi.');
    } finally {
      setDownloadingSK(false);
    }
  };

  const handleSubmit = () => {
    setValidationError(''); // Reset error
    
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

  // --- EVIDENCE HANDLERS ---
  const fetchBlob = async (upload) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, lineHeight: 1.5 }}>{value || '-'}</span>
    </div>
  );

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.95, opacity: 0, y: 16 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '850px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111827' }}>
                Verifikasi Permohonan SKTA - {studentName}
              </h2>
              <span style={{ background: '#F1F5F9', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#475569', border: '1px solid #E2E8F0' }}>
                NIM {studentNim}
              </span>
              {isExpired && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 9999, background: '#FEE2E2', color: '#B91C1C', border: '1.5px solid #FCA5A5', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Expired
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {/* STEPPER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', zIndex: 2 }} onClick={() => setStep(1)}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= 1 ? '#10B981' : '#E5E7EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: step === 1 ? '3px solid #D1FAE5' : 'none', transition: 'all 0.2s' }}>
                {step > 1 ? <CheckCircle2 size={20} /> : '1'}
              </div>
              <span style={{ fontSize: 12, fontWeight: step >= 1 ? 700 : 500, color: step >= 1 ? '#10B981' : '#6B7280' }}>Informasi & Evidence</span>
            </div>
            <div style={{ width: 120, height: 2, background: step > 1 ? '#10B981' : '#E5E7EB', margin: '0 -15px', alignSelf: 'flex-start', marginTop: 17, zIndex: 1 }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', zIndex: 2 }} onClick={() => setStep(2)}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= 2 ? '#E11D48' : '#E5E7EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: step === 2 ? '3px solid #FFE4E6' : 'none', transition: 'all 0.2s' }}>
                2
              </div>
              <span style={{ fontSize: 12, fontWeight: step >= 2 ? 700 : 500, color: step >= 2 ? '#E11D48' : '#6B7280' }}>Periksa & Verifikasi</span>
            </div>
          </div>

          {/* BODY CONTENT */}
          <div className="scrollable" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            
            {/* TAHAP 1: INFORMASI & EVIDENCE */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#C0182A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    Informasi Tugas Akhir & Akademik
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
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
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#C0182A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                    Dokumen Evidence Mahasiswa
                  </p>
                  {evidenceUploads.length === 0 ? (
                    <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Tidak ada dokumen evidence yang diunggah.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {evidenceUploads.map((upload, idx) => {
                        const uploadId  = upload?.id ?? idx;
                        const isLoading = loadingPreviewId === uploadId;
                        const errMsg    = errorMsg[uploadId];
                        const filename  = upload.name || upload.filename || `File ${idx + 1}`;

                        return (
                          <div key={uploadId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <FileText size={24} color="#C0182A" style={{ flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{filename}</div>
                                {errMsg && <small style={{ color: '#EF4444', fontSize: 11, display: 'block', marginTop: 2 }}>⚠ {errMsg}</small>}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button
                                onClick={() => openPreview(upload)}
                                disabled={Boolean(loadingPreviewId)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '6px', fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', cursor: loadingPreviewId ? 'not-allowed' : 'pointer', opacity: loadingPreviewId ? 0.6 : 1 }}
                              >
                                {isLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={14} />} Preview
                              </button>
                              <button
                                onClick={() => handleDownloadEvidence(upload)}
                                disabled={Boolean(loadingPreviewId)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '6px', fontSize: 12, fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', cursor: loadingPreviewId ? 'not-allowed' : 'pointer', opacity: loadingPreviewId ? 0.6 : 1 }}
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
                {!isReadOnly && (
                  <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
                    <button
                      type="button"
                      style={{ flex: 1, padding: '12px 0', textAlign: 'center', fontWeight: 700, fontSize: 14, border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.15s ease', borderBottom: activeTab === 'approve' ? '3px solid #16A34A' : 'none', color: activeTab === 'approve' ? '#16A34A' : '#6B7280' }}
                      onClick={() => { setActiveTab('approve'); setValidationError(''); }}
                    >
                      Setujui (Approve)
                    </button>
                    <button
                      type="button"
                      style={{ flex: 1, padding: '12px 0', textAlign: 'center', fontWeight: 700, fontSize: 14, border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.15s ease', borderBottom: activeTab === 'reject' ? '3px solid #DC2626' : 'none', color: activeTab === 'reject' ? '#DC2626' : '#6B7280' }}
                      onClick={() => { setActiveTab('reject'); setValidationError(''); }}
                    >
                      Tolak (Reject)
                    </button>
                  </div>
                )}

                {(isReadOnly || activeTab === 'approve') && (
                  <>
                    <div className="dm-section">
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

                    <div className="dm-section">
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
                        <div className="dm-section">
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

                        <div className="dm-section">
                          <div className="dm-section-label">Upload File SK Final *</div>
                          {existingResponse?.sktaUploadPath && !uploadedFile && (
                            <div className="dm-file-exists-info">
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
                                <p className="dm-upload-main">Drag & Drop atau klik untuk pilih file</p>
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
                    <div className="dm-section">
                      <div className="dm-section-label">Alasan Penolakan / Catatan untuk Mahasiswa *</div>
                      <textarea
                        className="dm-textarea"
                        placeholder="Tuliskan alasan penolakan secara jelas agar mahasiswa dapat memperbaiki dokumen..."
                        value={catatan}
                        onChange={e => { setCatatan(e.target.value); setValidationError(''); }}
                        rows={5}
                      />
                    </div>
                    <div className="dm-section">
                      <div className="dm-section-label">Batas Waktu Perbaikan</div>
                      <input type="date" className="dm-input" value={isEdit} onChange={e => setIsEdit(e.target.value)} />
                      <p style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>Berikan tenggat waktu bagi mahasiswa untuk merevisi berkas mereka.</p>
                    </div>
                  </>
                )}

                {/* AREA TAMPIL PREVIEW & DOWNLOAD SK FINAL */}
                {existingSkFile && (
                  <div className="dm-section" style={{ marginTop: 24 }}>
                    <div className="dm-section-label" style={{ marginBottom: 12 }}>File SK Final Saat Ini</div>
                    
                    {/* Kotak iframe Preview */}
                    {isLoadingSkPreview ? (
                      <div style={{ padding: '30px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', marginBottom: 16 }}>
                        <Loader size={24} color="#C0182A" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 10 }}>Memuat preview SK...</p>
                      </div>
                    ) : skPreviewUrl ? (
                      <div style={{ height: '360px', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 16 }}>
                        <iframe src={skPreviewUrl} width="100%" height="100%" style={{ border: 'none' }} title="Preview SK Final" />
                      </div>
                    ) : (
                      <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: 16 }}>
                        <p style={{ fontSize: 12, color: '#DC2626', margin: 0, textAlign: 'center' }}>Preview dokumen tidak tersedia.</p>
                      </div>
                    )}

                    {downloadError && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 8, marginTop: 0 }}>⚠ {downloadError}</p>}
                    
                    <button
                      onClick={handleDownloadSK}
                      disabled={downloadingSK}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#16A34A',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: 'none',
                        cursor: downloadingSK ? 'not-allowed' : 'pointer',
                        opacity: downloadingSK ? 0.7 : 1,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#15803D'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#16A34A'}
                    >
                      {downloadingSK ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Mengunduh...</> : <><Download size={18} /> Unduh SK Final</>}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Custom Alert Message */}
            {validationError && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: 4 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#B91C1C', fontWeight: 500 }}>
                  {validationError}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
            {step === 1 ? (
              <>
                <button onClick={onClose} style={{ padding: '8px 24px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Batal</button>
                <button onClick={() => setStep(2)} style={{ padding: '8px 24px', backgroundColor: '#2563EB', color: '#fff', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Lanjut: Verifikasi</button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(1)} style={{ padding: '8px 24px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Kembali</button>
                {!isReadOnly && (
                  <button
                    onClick={handleSubmit}
                    style={{ padding: '8px 24px', backgroundColor: activeTab === 'reject' ? '#DC2626' : '#16A34A', color: 'white', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                  >
                    {activeTab === 'reject' ? 'Tolak Pengajuan' : 'Setujui & Kirim'}
                  </button>
                )}
                {isReadOnly && (
                  <button onClick={onClose} style={{ padding: '8px 24px', backgroundColor: '#16A34A', color: 'white', borderRadius: '6px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Tutup</button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* PREVIEW OVERLAY (Sama seperti Evidence Modal sebelumnya) */}
      {selectedPreview && (
        <div className="preview-overlay" onClick={closePreview} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <motion.div className="preview-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
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