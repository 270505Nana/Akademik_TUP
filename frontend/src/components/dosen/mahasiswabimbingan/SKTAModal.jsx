import React, { useState, useEffect, useRef } from 'react';
import { FileText, X, AlertCircle, Loader, Download } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../../service/api';
import { generateDokumenValidasiBlob } from '../../admin/permohonanSK/Dokumenvalidasipdf';
import Telulogo from '../../../assets/logo-telkom.png';


const SKTAModal = ({ student, onClose }) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState(null);

  const mhs = student?.mahasiswa || {};
  const studentName = mhs.name || 'Mahasiswa';
  const studentNim = mhs.nim || '-';
  const prodiName = mhs.studyProgram?.name || '-';
  const hasSkta = Boolean(student?.sktaDownloadUrl);
  const isExpired = student?.status === 'Kadaluarsa';

  const pdfBlobUrlRef = useRef(null);

  useEffect(() => {
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = null;
    }

    if (!student || !hasSkta) {
      setPdfBlobUrl(null);
      return;
    }

    let isMounted = true;
    setLoadingPdf(true);
    setErrorPdf(null);

    const loadPdfDoc = async () => {
      try {
        if (student.sktaDownloadUrl) {
          const response = await api.get(student.sktaDownloadUrl, {
            responseType: 'blob',
          });
          if (isMounted) {
            const url = URL.createObjectURL(response.data);
            pdfBlobUrlRef.current = url;
            setPdfBlobUrl(url);
          }
          return;
        }

        const payloadData = {
          nim: studentNim,
          namaMahasiswa: studentName,
          programStudi: prodiName,
          judulTAId: student.judulTugasAkhirIndonesia || '-',
          judulTAEn: student.judulTugasAkhirInggris || student.judulTugasAkhirIndonesia || '-',
          dosenPembimbing1: '-',
          dosenPembimbing2: '-',
          tanggalBerlakuSK: student.createdAt || new Date().toISOString(),
          tanggalBerakhirSK: null,
          statusAktif: 'AKTIF',
          logoUrl: Telulogo,
        };

        const blob = await generateDokumenValidasiBlob(payloadData);
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          pdfBlobUrlRef.current = url;
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error('Gagal memuat preview dokumen SK TA:', err);
        if (isMounted) setErrorPdf('Gagal memuat dokumen PDF SK TA.');
      } finally {
        if (isMounted) setLoadingPdf(false);
      }
    };

    loadPdfDoc();

    return () => {
      isMounted = false;
    };
  }, [student, hasSkta, studentName, studentNim, prodiName]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
      }
    };
  }, []);

  if (!student) return null;

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    // Format nama file: SKTA_<NIM>_<NamaMahasiswa>.pdf
    const cleanNim = studentNim.replace(/[/\\?%*:|"<>]/g, '').trim();
    const cleanName = studentName.replace(/[/\\?%*:|"<>]/g, '').trim();
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `SKTA_${cleanNim}_${cleanName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mb-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className={`mb-modal-content ${hasSkta ? 'is-terbit' : ''}`}      >
        <div className="mb-modal-header">
          <div className="mb-modal-header-left">
            <div className="mb-modal-icon-badge">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="mb-modal-title">Surat Keputusan Tugas Akhir</h3>
              <p className="mb-modal-sub">
                {studentName} &bull; NIM: {studentNim} &bull; {prodiName}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="mb-modal-close-btn" title="Tutup Modal">
            <X size={18} />
          </button>
        </div>

        <div className={`mb-modal-body-pdf${!hasSkta ? ' is-unreleased' : ''}`}>
          {hasSkta ? (
            loadingPdf ? (
              <div className="mb-pdf-loading-wrap">
                <Loader size={32} color="#FFFFFF" className="mb-spinner" />
                <span className="mb-pdf-loading-text">Memuat Dokumen SK TA...</span>
              </div>
            ) : errorPdf ? (
              <div className="mb-pdf-error-wrap">
                <AlertCircle size={36} color="#EF4444" className="mb-pdf-error-icon" />
                <span className="mb-pdf-error-text">{errorPdf}</span>
              </div>
            ) : pdfBlobUrl ? (
              <>
                {isExpired && (
                  <div className="mb-pdf-expired-banner">
                    <AlertCircle size={16} />
                    <span>SK TA ini sudah kadaluarsa (masa berlaku telah berakhir).</span>
                  </div>
                )}
                <iframe
                  src={pdfBlobUrl}
                  title={`SK TA - ${studentName}`}
                  width="100%"
                  height="100%"
                  className="mb-pdf-iframe"
                />
              </>
            ) : null
          ) : (
            <div className="mb-pdf-unreleased-wrap">
              <div className="mb-pdf-unreleased-icon">
                <AlertCircle size={28} />
              </div>
              <h4 className="mb-pdf-unreleased-title">
                Dokumen SK TA belum tersedia
              </h4>
              <p className="mb-pdf-unreleased-desc">
                Mahasiswa <strong>{studentName}</strong> belum memiliki SK Tugas Akhir yang diterbitkan oleh bagian Akademik.
              </p>
            </div>
          )}
        </div>

        <div className="mb-modal-footer">
          <button type="button" onClick={onClose} className="btn-detail mb-modal-btn-close">
            Tutup
          </button>
          {hasSkta && pdfBlobUrl &&
           (<button
            type="button"
            onClick={handleDownload}
            className="mb-modal-btn-download"
          >
            <Download size={14} /> Unduh
          </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SKTAModal;