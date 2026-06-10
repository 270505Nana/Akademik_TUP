import React, { useState, useEffect } from 'react';
import { X, FileText, AlertTriangle, Loader } from 'lucide-react';
import { getTemplateBlob } from '../../service/api'; 
// Template evidence buat preview semua template
const TemplateEvidenceModal = ({ slug, onClose }) => {
  const [status,   setStatus]   = useState('loading');
  const [fileUrl,  setFileUrl]  = useState(null);
  const [fileName, setFileName] = useState('Template');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!slug) {
      setErrorMsg('Slug template tidak diberikan.');
      setStatus('error');
      return;
    }

    let objectUrl = null; 

    const load = async () => {
      setStatus('loading');
      try {
        //Fetch file sebagai Blob via axios
        const blob = await getTemplateBlob(slug);

        //Buat object URL dari Blob
        objectUrl = URL.createObjectURL(blob);

        const ext = blob.type?.includes('pdf') ? 'PDF' : 'File';
        setFileName(`Template ${ext}`);
        setFileUrl(objectUrl);
        setStatus('ready');
      } catch (err) {
        console.error('[TemplateEvidenceModal] Gagal load template:', err);
        setErrorMsg(
          err.response?.data?.message || 
          `Gagal memuat template (${err.response?.status ?? err.message}). Coba lagi.`
        );
        setStatus('error');
      }
    };

    load();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [slug]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 760,
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: '#FEF2F2', border: '1px solid #FECACA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={17} color="#C0182A" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                Template Evidence
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                {status === 'ready' ? fileName : '—'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid #E5E7EB', background: '#F9FAFB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#6B7280',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#F8FAFC' }}>
          {status === 'loading' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <Loader size={28} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Memuat template...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {status === 'error' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#FEF2F2', border: '1px solid #FECACA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={24} color="#C0182A" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>
                Gagal Memuat Template
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, textAlign: 'center' }}>
                {errorMsg}
              </p>
            </div>
          )}

          {status === 'ready' && fileUrl && (
            <iframe
              src={fileUrl}
              title={fileName}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'flex-end',
          flexShrink: 0,
          background: '#fff',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 24px', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              background: '#C0182A', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEvidenceModal;