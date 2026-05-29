import React, { useState } from 'react';
import { X, FileText, Download, Eye, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadEvidence } from '../../../service/api';

/**
 * Preview & download evidence mahasiswa.
 * Endpoint: GET /api/skta-requests/uploads/{id}/download → 200 OK (confirmed working)
 */
const EvidenceModal = ({ item, onClose }) => {
  if (!item) return null;

  const student         = item.student || {};
  const sktaRequest     = item.sktaRequest || {};
  const evidenceUploads = item.evidenceUploads?.length
    ? item.evidenceUploads
    : (sktaRequest.sktaRequestUploads || []);

  const [selectedPreview,  setSelectedPreview]  = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [errorMsg,         setErrorMsg]         = useState({});

  const fetchBlob = async (upload) => {
    const uploadId = upload?.id;
    if (!uploadId) {
      throw new Error(`Upload ID tidak ditemukan. Fields tersedia: ${Object.keys(upload || {}).join(', ')}`);
    }
    return await downloadEvidence(uploadId);
  };

  const openPreview = async (upload) => {
    const uploadId = upload?.id;
    setLoadingPreviewId(uploadId);
    setErrorMsg(prev => ({ ...prev, [uploadId]: null }));

    try {
      const blob = await fetchBlob(upload);

      const mimeType = blob.type || '';
      const filename = upload.filename || upload.name || '';
      const isPdf    = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');

      setSelectedPreview({
        url:  URL.createObjectURL(blob),
        name: filename || `Evidence`,
        type: isPdf ? 'pdf' : 'image',
      });
    } catch (err) {
      console.error('[EvidenceModal] openPreview error:', err);
      setErrorMsg(prev => ({
        ...prev,
        [uploadId]: `Gagal memuat preview (${err.response?.status ?? err.message})`
      }));
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleDownload = async (upload) => {
    const uploadId = upload?.id;
    setLoadingPreviewId(uploadId);

    try {
      const blob     = await fetchBlob(upload);
      const blobUrl  = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = blobUrl;
      a.download     = upload.name || upload.filename || `evidence_${uploadId}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[EvidenceModal] handleDownload error:', err);
      setErrorMsg(prev => ({
        ...prev,
        [uploadId]: `Gagal mengunduh (${err.response?.status ?? err.message})`
      }));
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const closePreview = () => {
    if (selectedPreview?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedPreview.url);
    }
    setSelectedPreview(null);
  };

  return (
    <>
      <div className="ev-modal-overlay" onClick={onClose}>
        <motion.div
          className="ev-modal-box"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="ev-modal-header">
            <h3>Evidence — {student.name || 'Mahasiswa'}</h3>
            <button className="ev-modal-close" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="ev-modal-content scrollable">

            <div className="ev-info-grid">
              <div className="ev-info-row">
                <span className="ev-info-label">NIM</span>
                <span>{student.nim || sktaRequest.nim || '-'}</span>
              </div>
              <div className="ev-info-row">
                <span className="ev-info-label">Program Studi</span>
                <span>{item.prodiName || '-'}</span>
              </div>
              <div className="ev-info-row">
                <span className="ev-info-label">Judul TA (ID)</span>
                <span>{sktaRequest.proposalTitleId || '-'}</span>
              </div>
              <div className="ev-info-row">
                <span className="ev-info-label">Judul TA (EN)</span>
                <span>{sktaRequest.proposalTitleEn || '-'}</span>
              </div>
            </div>

            <h4 className="ev-section-title">Dokumen Evidence:</h4>

            {evidenceUploads.length === 0 ? (
              <p className="ev-no-data">Tidak ada dokumen evidence yang diunggah.</p>
            ) : (
              evidenceUploads.map((upload, idx) => {
                const uploadId  = upload?.id ?? idx;
                const isLoading = loadingPreviewId === uploadId;
                const errMsg    = errorMsg[uploadId];
                const filename  = upload.name || upload.filename || `File ${idx + 1}`;

                return (
                  <div key={uploadId} className="ev-file-card">
                    <div className="ev-file-info">
                      <FileText size={20} color="#C0182A" />
                      <div>
                        <div className="ev-file-name">{filename}</div>
                        {upload.filename && upload.filename !== upload.name && (
                          <small className="ev-file-meta">{upload.filename}</small>
                        )}
                        {errMsg && (
                          <small style={{ color: '#EF4444', fontSize: 11, display: 'block', marginTop: 2 }}>
                            ⚠ {errMsg}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="ev-file-actions">
                      <button
                        className="ev-btn-preview"
                        onClick={() => openPreview(upload)}
                        disabled={!!loadingPreviewId}
                        style={!!loadingPreviewId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                      >
                        {isLoading
                          ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...</>
                          : <><Eye size={16} /> Preview</>
                        }
                      </button>

                      <button
                        className="ev-btn-download"
                        onClick={() => handleDownload(upload)}
                        disabled={!!loadingPreviewId}
                        style={!!loadingPreviewId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                      >
                        <Download size={16} /> Unduh
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="ev-modal-footer">
            <button className="btn-close-modal" onClick={onClose}>Tutup</button>
          </div>
        </motion.div>
      </div>


      {selectedPreview && (
        <div
          className="preview-overlay"
          onClick={closePreview}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,         
          }}
        >
          <motion.div
            className="preview-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              borderRadius: 12,
              overflow: 'hidden',
              width: '90vw',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10000,
            }}
          >
            <div
              className="preview-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#2a2a2a',
                borderBottom: '1px solid #3a3a3a',
                flexShrink: 0,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 13, color: '#e5e7eb', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                {selectedPreview.name}
              </h4>
              <button
                onClick={closePreview}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="preview-content"
              style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {selectedPreview.type === 'pdf' ? (
                <iframe
                  src={selectedPreview.url}
                  title={selectedPreview.name}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', display: 'block' }}
                />
              ) : (
                <img
                  src={selectedPreview.url}
                  alt={selectedPreview.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default EvidenceModal;