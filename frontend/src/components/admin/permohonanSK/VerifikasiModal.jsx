import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, Circle, Upload, FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { ALUR_STEPS } from '../../common/skStatusHelper';


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
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const fileInputRef = useRef();

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

  const handleSubmit = () =>
    onSave({
      selectedPermohonan,
      checks,
      catatan,
      uploadedFile,
      existingResponse,
      batasPerbaikan,
      isEdit,
    });

  const studentName    = selectedPermohonan?.student?.name || 'Mahasiswa';
  const existingSkFile = existingResponse?.skUploads?.[0];

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
          <h3 className="dm-header-title">Proses Penerbitan SK — {studentName}</h3>
          <button className="dm-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="dm-body">
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


          <div className="dm-section">
            <div className="dm-section-label">Exp Date SKTA</div>
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


          <div className="dm-section">
            <div className="dm-section-label">Batas Perbaikan</div>
            {isReadOnly ? (
              <div className="dm-readonly-field">
                {isEdit
                  ? new Date(isEdit).toLocaleDateString('id-ID', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })
                  : '-'}
              </div>
            ) : (
              <>
                <input
                  type="date"
                  className="dm-input"
                  value={isEdit}
                  onChange={e => setIsEdit(e.target.value)}
                />
                <p style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                  Isi jika mahasiswa perlu mengirim ulang dokumen evidence.
                  Kosongkan jika tidak perlu perbaikan.
                </p>
              </>
            )}
          </div>

          {!isReadOnly && (
            <>

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

              {/* Catatan */}
              <div className="dm-section">
                <div className="dm-section-label">Catatan untuk Mahasiswa</div>
                <textarea
                  className="dm-textarea"
                  placeholder="Tuliskan catatan perbaikan atau informasi lainnya..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  rows={4}
                />
              </div>


              <div className="dm-section">
                <div className="dm-section-label">Upload File SK Final</div>
                {existingResponse?.skUploads?.length > 0 && !uploadedFile && (
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

          {/* Download SK jika readOnly */}
          {isReadOnly && existingSkFile && (
            <div className="dm-section">
              <a
                href={existingSkFile.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dm-btn-download-skta"
              >
                <Download size={16} />
                Download SKTA
              </a>
            </div>
          )}

        </div>


        <div className="dm-footer">
          {isReadOnly ? (
            <button className="dm-btn-simpan" onClick={onClose}>Kembali</button>
          ) : (
            <>
              <button className="dm-btn-batal"  onClick={onClose}>Batal</button>
              <button className="dm-btn-simpan" onClick={handleSubmit}>Simpan & Kirim</button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifikasiModal;