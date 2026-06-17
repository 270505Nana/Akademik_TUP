import React, { useState, useEffect } from 'react';
import { X, Download, Loader, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadTemplate } from '../../service/api'; 

const TemplateEvidenceModal = ({ slug, title = 'Preview Template', onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { blob, name } = await downloadTemplate(slug);
        const lowerName = (name || '').toLowerCase();
        const isPdf = lowerName.endsWith('.pdf') || blob.type.includes('pdf');
        const isPng = lowerName.endsWith('.png') || blob.type === 'image/png';
        const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || blob.type === 'image/jpeg';

        const resolvedType = isPdf ? 'application/pdf' : isPng ? 'image/png' : isJpg ? 'image/jpeg' : blob.type;
        const normalizedBlob = new Blob([blob], { type: resolvedType });
        objectUrl = URL.createObjectURL(normalizedBlob);

        if (isMounted) {
          setPreview({
            url:  objectUrl,
            name: name || `template-${slug}`,
            type: isPdf ? 'pdf' : (isPng || isJpg) ? 'image' : 'unsupported',
          });
        }
      } catch (err) {
        console.error('[TemplateEvidenceModal] load error:', err);
        if (isMounted) setError(`Gagal memuat template (${err.response?.status ?? err.message})`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [slug]);

  const handleDownload = () => {
    if (!preview?.url) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = preview.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <motion.div
        className="ev-modal-box"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, width: '95vw' }}
      >
        <div className="ev-modal-header">
          <h3>{title}</h3>
          <button className="ev-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="ev-modal-content scrollable" style={{ minHeight: 360 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '70px 0' }}>
              <Loader size={28} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 12, color: '#6B7280' }}>Memuat template...</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 0', color: '#EF4444', textAlign: 'center' }}>
              <AlertCircle size={28} />
              <p style={{ fontSize: 13 }}>{error}</p>
            </div>
          )}

          {!loading && !error && preview?.type === 'pdf' && (
            <iframe
              src={preview.url}
              title={preview.name}
              width="100%"
              height="500"
              style={{ border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          )}

          {!loading && !error && preview?.type === 'image' && (
            <img
              src={preview.url}
              alt={preview.name}
              style={{ maxWidth: '100%', display: 'block', margin: '0 auto', borderRadius: 8 }}
            />
          )}

          {!loading && !error && preview?.type === 'unsupported' && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#6B7280' }}>
              <FileText size={28} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13 }}>Preview tidak didukung untuk tipe file ini. Silakan unduh untuk melihat isinya.</p>
            </div>
          )}
        </div>

        <div className="ev-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-close-modal" onClick={onClose}>Tutup</button>
          {!loading && !error && (
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 9999,
                fontSize: 13, fontWeight: 700,
                background: '#C0182A', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              <Download size={14} /> Download
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TemplateEvidenceModal;