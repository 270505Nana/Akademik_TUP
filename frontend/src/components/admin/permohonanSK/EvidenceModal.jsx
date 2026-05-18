import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';

const EvidenceModal = ({ item, onClose }) => {
  if (!item) return null;
  const student = item.student || {};
  const uploads = item.sktaRequestUploads || [];

  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <motion.div
        className="ev-modal-box"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        exit={{    scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ev-modal-header">
          <h3>Evidence — {student.name}</h3>
          <button className="ev-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ev-modal-body">
          <div className="ev-info-row">
            <span className="ev-info-label">NIM</span>
            <span>{student.nim || '-'}</span>
          </div>
          <div className="ev-info-row">
            <span className="ev-info-label">Prodi</span>
            <span>{item.prodiName || '-'}</span>
          </div>

          <h4 style={{ margin: '20px 0 10px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            Dokumen Evidence:
          </h4>

          {uploads.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Tidak ada dokumen evidence.</p>
          ) : (
            uploads.map(upload => (
              <div
                key={upload.id}
                style={{
                  marginBottom: 12, padding: 10,
                  border: '1px solid #E2E8F0', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <FileText size={18} color="#C0182A" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {upload.name || upload.filename}
                  </div>
                  <small style={{ color: '#9CA3AF' }}>{upload.filename}</small>
                </div>
                <a href={upload.downloadUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#C0182A' }}>
                  <Download size={18} />
                </a>
              </div>
            ))
          )}
        </div>

        <div className="ev-modal-footer">
          <button className="btn-close-modal" onClick={onClose}>Tutup</button>
        </div>
      </motion.div>
    </div>
  );
};

export default EvidenceModal;