import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadEvidence, downloadFileFromUrl, getLecturers } from '../../../service/api';

const EvidenceModal = ({ item, onClose }) => {
  const [selectedPreview,  setSelectedPreview]  = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [errorMsg,         setErrorMsg]         = useState({});
  const [dosen1,           setDosen1]           = useState(null);
  const [dosen2,           setDosen2]           = useState(null);

  // Ambil data langsung dari item atau dari hasil fetch sktaRequest
  const sktaRequest = item?.sktaRequest || item || {};
  const student = sktaRequest?.mahasiswa || sktaRequest?.student || item?.mahasiswa || item?.student || {};
  
  // Jika evidenceUploads kosong tapi ada evidenceDownloadUrl dari BE, kita buat array buatan
  const evidenceUploads = item?.evidenceUploads?.length
    ? item.evidenceUploads
    : sktaRequest?.evidenceDownloadUrl
      ? [{ 
          id: sktaRequest.id, 
          name: 'Dokumen_Evidence.pdf', 
          downloadUrl: sktaRequest.evidenceDownloadUrl 
        }]
      : (sktaRequest.sktaRequestUploads || []);

  // Fallback: Jika nama dosen tidak di-populate BE, fetch manual
  useEffect(() => {
    const d1Id = sktaRequest?.dosenPembimbing1Id;
    const d2Id = sktaRequest?.dosenPembimbing2Id;
    // Jika data dosen sudah lengkap dari BE, lewati fetch
    if (sktaRequest?.dosenPembimbing1?.name && sktaRequest?.dosenPembimbing2?.name) return;
    if (!d1Id && !d2Id) return;

    getLecturers().then(list => {
      if (d1Id && !sktaRequest?.dosenPembimbing1) setDosen1(list.find(d => String(d.id) === String(d1Id)) ?? null);
      if (d2Id && !sktaRequest?.dosenPembimbing2) setDosen2(list.find(d => String(d.id) === String(d2Id)) ?? null);
    }).catch(() => {});
  }, [sktaRequest]);

  if (!item) return null;

  const formatDosen = (d) => {
    if (!d) return '-';
    const kode = d.kodeDosen ?? d.lecturerCode ?? d.kode ?? '';
    const nama = d.user?.name ?? d.name ?? d.nama ?? '';
    return kode && nama ? `${kode} — ${nama}` : nama || kode || '-';
  };

  const fetchBlob = async (upload) => {
    if (upload?.downloadUrl) {
      return await downloadFileFromUrl(upload.downloadUrl);
    }
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
      const mimeType = blob.type || 'application/pdf'; // Default PDF
      const filename = upload.filename || upload.name || 'Dokumen_Evidence.pdf';
      const isPdf    = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
      setSelectedPreview({ url: URL.createObjectURL(blob), name: filename, type: isPdf ? 'pdf' : 'image' });
    } catch (err) {
      console.error('[EvidenceModal] openPreview error:', err);
      setErrorMsg(prev => ({ ...prev, [uploadId]: `Gagal memuat preview (${err.response?.status ?? err.message})` }));
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleDownload = async (upload) => {
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
      console.error('[EvidenceModal] handleDownload error:', err);
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
      <div className="ev-modal-overlay" onClick={onClose}>
        <motion.div
          className="ev-modal-box"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: 580, width: '95vw' }}
        >

          <div className="ev-modal-header">
            <h3>Evidence — {student?.name || 'Mahasiswa'}</h3>
          </div>

          <div className="ev-modal-content scrollable">

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C0182A', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, margin: '0 0 10px 0' }}>
                Identitas Mahasiswa
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <InfoRow label="Nama Lengkap"  value={student?.name} />
                <InfoRow label="NIM"           value={student?.nim} />
                <InfoRow label="Program Studi" value={student?.studyProgram?.name || item?.prodiName} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C0182A', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px 0' }}>
                Informasi Tugas Akhir
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                <InfoRow label="Judul TA (Bahasa Indonesia)" value={sktaRequest?.judulProposalIndonesia || sktaRequest?.proposalTitleId} />
                <InfoRow label="Judul TA (Bahasa Inggris)"  value={sktaRequest?.judulProposalInggris || sktaRequest?.proposalTitleEn} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C0182A', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px 0' }}>
                Dosen Pembimbing
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
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

            {/* Dokumen Evidence  */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#C0182A', textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 10px 0' }}>
                Dokumen Evidence
              </p>

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
                        <FileText size={20} color="#C0182A" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
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

                      <div className="ev-file-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        <button
                          className="ev-btn-preview"
                          onClick={() => openPreview(upload)}
                          disabled={Boolean(loadingPreviewId)}
                          style={loadingPreviewId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        >
                          {isLoading
                            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...</>
                            : <><Eye size={14} /> Preview</>
                          }
                        </button>
                        <button
                          className="ev-btn-download"
                          onClick={() => handleDownload(upload)}
                          disabled={Boolean(loadingPreviewId)}
                          style={loadingPreviewId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        >
                          <Download size={14} /> Unduh
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="ev-modal-footer">
            <button className="btn-close-modal" onClick={onClose}>Tutup</button>
          </div>
        </motion.div>
      </div>

      {/* PREVIEW MODAL */}
      {selectedPreview && (
        <div
          className="preview-overlay"
          onClick={closePreview}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <motion.div
            className="preview-box"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a', borderRadius: 12, overflow: 'hidden',
              width: '90vw', height: '90vh',
              display: 'flex', flexDirection: 'column', zIndex: 10000,
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: '#2a2a2a', borderBottom: '1px solid #3a3a3a', flexShrink: 0,
            }}>
              <h4 style={{ margin: 0, fontSize: 13, color: '#e5e7eb', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                {selectedPreview.name}
              </h4>
              <button onClick={closePreview} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default EvidenceModal;