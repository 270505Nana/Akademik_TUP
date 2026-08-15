import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, Circle, Upload, FileText, Download, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { ALUR_STEPS } from '../../common/Skstatushelper';
import { downloadSK } from '../../../service/api';

const VerifikasiModal = ({
  selectedPermohonan,
  existingResponse,
  isReadOnly = false,
  onClose,
  onSave,
}) => {
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
  const fileInputRef = useRef();

  const [activeTab, setActiveTab] = useState('approve'); // 'approve' | 'reject'

  useEffect(() => {
    if (!existingResponse) return;
    setChecks({
      proposal: existingResponse.hasUploadedFinalProposal || false,
      bahasa:   existingResponse.hasTakenLanguageTest     || false,
    });
    setCatatan(existingResponse.message || '');
    setBatasPerbaikan(
      existingResponse.expDate ? existingResponse.expDate.split('T')[0] : ''
    );
    setIsEdit(
      existingResponse.isEdit ? existingResponse.isEdit.split('T')[0] : ''
    );
    // Set active tab based on existing state
    if (existingResponse.message) {
      setActiveTab('reject');
    } else {
      setActiveTab('approve');
    }
  }, [existingResponse]);

  const toggleCheck = (key) => {
    if (isReadOnly) return;
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0]);
  };

  const handleDownloadSK = async () => {
    const uploadId = existingSkFile?.id;
    if (!uploadId) {
      setDownloadError('ID file SK tidak ditemukan.');
      return;
    }
    setDownloadingSK(true);
    setDownloadError(null);
    try {
      const blob = await downloadSK(selectedPermohonan.id); // download by permohonan ID
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
    if (activeTab === 'reject' && !catatan.trim()) {
      alert('Catatan/Alasan penolakan wajib diisi.');
      return;
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

  const studentName    = selectedPermohonan?.student?.name || 'Mahasiswa';
  const existingSkFile = existingResponse?.sktaUploadPath;

  return (
    <div className="dm-overlay" onClick={onClose}>
      <motion.div
        className="dm-box"
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.93, opacity: 0, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="dm-header">
          <h3 className="dm-header-title">Verifikasi Permohonan SKTA — {studentName}</h3>
        </div>

        <div className="dm-body">
          {/* TABS FOR APPROVE / REJECT */}
          {!isReadOnly && (
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px 0',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'approve' ? '3px solid #16A34A' : 'none',
                  color: activeTab === 'approve' ? '#16A34A' : '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveTab('approve')}
              >
                Setujui (Approve)
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px 0',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'reject' ? '3px solid #DC2626' : 'none',
                  color: activeTab === 'reject' ? '#DC2626' : '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => setActiveTab('reject')}
              >
                Tolak (Reject)
              </button>
            </div>
          )}

          {/* APPROVE FLOW */}
          {(isReadOnly || activeTab === 'approve') && (
            <>
              <div className="dm-section">
                <div className="dm-section-label">Checklist Kelengkapan Dokumen</div>
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
                      <span className="dm-check-icon">
                        {checks[key] ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </span>
                      <span className="dm-check-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exp Date SKTA */}
              <div className="dm-section">
                <div className="dm-section-label">Tanggal Kedaluwarsa SKTA (Exp Date)</div>
                {isReadOnly ? (
                  <div className="dm-readonly-field">
                    {batasPerbaikan
                      ? new Date(batasPerbaikan).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })
                      : '-'}
                  </div>
                ) : (
                  <input
                    type="date"
                    className="dm-input"
                    value={batasPerbaikan}
                    onChange={e => setBatasPerbaikan(e.target.value)}
                  />
                )}
              </div>

              {!isReadOnly && (
                <>
                  {/* Alur Penerbitan */}
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

                  {/* Upload SK */}
                  <div className="dm-section">
                    <div className="dm-section-label">Upload File SK Final</div>
                    {existingResponse?.sktaUploadPath && !uploadedFile && (
                      <div className="dm-file-exists-info">
                        <CheckCircle2 size={14} />
                        File SK sudah diupload sebelumnya. Upload file baru untuk mengganti.
                      </div>
                    )}
                    <div
                      className={`dm-upload-area ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        accept=".pdf"
                        onChange={e => { if (e.target.files[0]) setUploadedFile(e.target.files[0]); }}
                      />
                      {uploadedFile ? (
                        <>
                          <div className="dm-upload-icon uploaded"><FileText size={22} /></div>
                          <p className="dm-upload-filename">{uploadedFile.name}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                            Klik untuk ganti file
                          </p>
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

          {/* REJECT FLOW */}
          {(!isReadOnly && activeTab === 'reject') && (
            <>
              {/* Catatan Perbaikan */}
              <div className="dm-section">
                <div className="dm-section-label">Alasan Penolakan / Catatan untuk Mahasiswa *</div>
                <textarea
                  className="dm-textarea"
                  placeholder="Tuliskan alasan penolakan secara jelas agar mahasiswa dapat memperbaiki dokumen..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Batas Perbaikan (isEdit) */}
              <div className="dm-section">
                <div className="dm-section-label">Batas Waktu Perbaikan</div>
                <input
                  type="date"
                  className="dm-input"
                  value={isEdit}
                  onChange={e => setIsEdit(e.target.value)}
                />
                <p style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                  Berikan tenggat waktu bagi mahasiswa untuk merevisi berkas mereka.
                </p>
              </div>
            </>
          )}

          {/* Download SK (jika sudah diterbitkan sebelumnya) */}
          {existingSkFile && (
            <div className="dm-section">
              <div className="dm-section-label">File SK Final Saat Ini</div>
              {downloadError && (
                <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 8, marginTop: 0 }}>
                  ⚠ {downloadError}
                </p>
              )}
              <button
                className="dm-btn-download-skta"
                onClick={handleDownloadSK}
                disabled={downloadingSK}
                style={downloadingSK ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              >
                {downloadingSK
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mengunduh...</>
                  : <><Download size={16} /> Unduh SK Final</>
                }
              </button>
              <style>{'.dm-btn-download-skta { display:inline-flex; align-items:center; gap:8px; } @keyframes spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dm-footer">
          {isReadOnly ? (
            <button className="dm-btn-simpan" onClick={onClose}>Kembali</button>
          ) : (
            <>
              <button className="dm-btn-batal"  onClick={onClose}>Batal</button>
              <button
                className="dm-btn-simpan"
                onClick={handleSubmit}
                style={{
                  background: activeTab === 'reject' ? '#DC2626' : '#16A34A',
                  borderColor: activeTab === 'reject' ? '#DC2626' : '#16A34A',
                }}
              >
                {activeTab === 'reject' ? 'Tolak Pengajuan' : 'Setujui & Kirim'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifikasiModal;