import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadNotaDinas } from '../../service/api';

const NotaDinasModal = ({ item, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState(null);

  const mhs = item?.mahasiswa || item?.raw?.mahasiswa || {};
  const studentName = mhs.name || item?.nama || 'Mahasiswa';
  const studentNim = mhs.nim || item?.nim || '-';
  const prodiName = mhs.studyProgram?.name || item?.prodi || '-';

  useEffect(() => {
    if (!item?.id) {
      setPdfUrl(null);
      return;
    }

    let isMounted = true;
    setLoadingPdf(true);
    setErrorPdf(null);

    const loadPdfDoc = async () => {
      try {
        const response = await downloadNotaDinas(item.id);
        const previewUrl = response?.data?.data?.previewUrl || response?.data?.previewUrl;
        if (!previewUrl) throw new Error('URL preview tidak tersedia dari server.');
        if (isMounted) {
          setPdfUrl(previewUrl);
        }
      } catch (err) {
        console.error('Gagal memuat preview nota dinas:', err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat dokumen Nota Dinas.';
        if (isMounted) {
          setErrorPdf(msg);
        }
      } finally {
        if (isMounted) {
          setLoadingPdf(false);
        }
      }
    };

    loadPdfDoc();

    return () => {
      isMounted = false;
    };
  }, [item?.id]);

  if (!item) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const cleanNim = String(studentNim).replace(/[/\\?%*:|"<>]/g, '').trim();
    const cleanName = String(studentName).replace(/[/\\?%*:|"<>]/g, '').trim();
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `NotaDinas_${cleanNim}_${cleanName}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal Preview */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>
              Pratinjau: Nota Dinas Sidang - {studentName}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
              NIM: {studentNim} &bull; {prodiName}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pdfUrl && (
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#C0182A',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <Download size={16} /> Unduh File
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#E2E8F0',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Modal: Native Browser PDF Viewer (Iframe 100% height) */}
        <div style={{ flex: 1, position: 'relative', background: '#F1F5F9' }}>
          {loadingPdf ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#64748B',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Memuat pratinjau dokumen...
            </div>
          ) : errorPdf ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#EF4444',
                fontWeight: 500,
                fontSize: '14px',
                textAlign: 'center',
                padding: '0 20px',
              }}
            >
              {errorPdf}
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={`Nota Dinas - ${studentName}`}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
            />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default NotaDinasModal;
