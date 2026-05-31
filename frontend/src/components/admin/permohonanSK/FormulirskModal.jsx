import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { generateDokumenValidasiBlob, mapSktaDataToPDF } from './DokumenValidasiPDF';
import { uploadDokumenValidasi } from '../../../service/api';
import logoTelkom from '../../../assets/logo-telkom.png';


const formatTanggal = (isoStr) => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};


const FormulirContent = React.forwardRef(({ item, sktaResponse, prodiName, qrUrl }, ref) => {
  const student     = item?.student || {};
  const request     = item          || {};
  const today       = formatTanggal(sktaResponse?.createdAt || new Date().toISOString());
  const hasProposal = sktaResponse?.hasUploadedFinalProposal === true;
  const hasBahasa   = sktaResponse?.hasTakenLanguageTest     === true;

  return (
    <div
      ref={ref}
      style={{

        width:           '794px',
        minHeight:       '1123px',
        padding:         '75px 94px',
        backgroundColor: '#fff',
        fontFamily:      '"Arial", "Helvetica Neue", Helvetica, sans-serif',
        fontSize:        '13px',
        color:           '#000',
        boxSizing:       'border-box',
        letterSpacing:   '0',
        lineHeight:      '1.4',
      }}
    >
      {/*  KOP SURAT  */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '90px' }} />
          <col />
          <col style={{ width: '110px' }} />
          <col style={{ width: '130px' }} />
        </colgroup>
        <tbody>
          <tr>
            <td rowSpan={4} style={{ textAlign: 'center', border: '1px solid #000', padding: '8px', verticalAlign: 'middle' }}>
              <img src={logoTelkom} alt="Telkom" style={{ width: '60px', height: 'auto', display: 'block', margin: '0 auto' }} />
            </td>
            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', border: '1px solid #000', padding: '4px 8px' }}>
              UNIVERSITAS TELKOM
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>No. Dokumen</td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold' }}>TUP-SPM-FM-TA-003</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontSize: '11px', border: '1px solid #000', padding: '4px 8px' }}>
              Jl. Telekomunikasi No. 1, Dayeuh Kolot, Kab. Bandung 40257
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>No. Revisi</td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>00</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', border: '1px solid #000', padding: '4px 8px' }}>
              FORMULIR KELENGKAPAN
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>Berlaku Efektif</td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>02 Januari 2025</td>
          </tr>
          <tr>
            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', border: '1px solid #000', padding: '4px 8px' }}>
              PERSYARATAN PENGAJUAN SK TUGAS AKHIR
            </td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>Halaman</td>
            <td style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>1 dari 1</td>
          </tr>
        </tbody>
      </table>

      {/*  JUDUL  */}
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginBottom: '18px', textDecoration: 'underline' }}>
        FORMULIR KELENGKAPAN PERSYARATAN PENERBITAN SK TUGAS AKHIR
      </p>

      {/*  DATA MAHASISWA  */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '150px' }} />
          <col />
        </colgroup>
        <tbody>
          {[
            { label: 'NIM',               value: student.nim  || '-' },
            { label: 'Nama Mahasiswa',    value: student.name || '-' },
            { label: 'Program Studi',     value: prodiName    || '-' },
            { label: 'Judul Proposal TA', value: request.proposalTitleId || '-' },
          ].map(({ label, value }) => (
            <tr key={label}>
              <td style={{ border: '1px solid #000', padding: '7px 10px', fontWeight: '600', verticalAlign: 'top' }}>{label}</td>
              <td style={{ border: '1px solid #000', padding: '7px 10px', wordBreak: 'break-word' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/*  TABEL DOKUMEN PERSYARATAN  */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '44px' }} />
          <col />
          <col style={{ width: '88px' }} />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #000', padding: '7px 6px', textAlign: 'center' }}>No</th>
            <th style={{ border: '1px solid #000', padding: '7px 10px', textAlign: 'left' }}>Dokumen persyaratan</th>
            <th style={{ border: '1px solid #000', padding: '7px 6px', textAlign: 'center' }}>Status (OK)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '7px 6px', textAlign: 'center', verticalAlign: 'middle' }}>1</td>
            <td style={{ border: '1px solid #000', padding: '7px 10px' }}>
              Telah mengunggah proposal akhir melalui aplikasi i-Gracias
            </td>
            <td style={{ border: '1px solid #000', padding: '7px 6px', textAlign: 'center', fontSize: '16px', verticalAlign: 'middle' }}>
              {hasProposal ? '✓' : ''}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '7px 6px', textAlign: 'center', verticalAlign: 'middle' }}>2</td>
            <td style={{ border: '1px solid #000', padding: '7px 10px' }}>
              Sertifikat TOEFL / EprT / Tes lain yang setara (Fotocopy) dengan mengunggah di
              aplikasi i-Gracias{' '}
              <span style={{ color: '#CC0000', fontStyle: 'italic' }}>
                (MINIMAL PERNAH 1X TES BAHASA)
              </span>
            </td>
            <td style={{ border: '1px solid #000', padding: '7px 6px', textAlign: 'center', fontSize: '16px', verticalAlign: 'middle' }}>
              {hasBahasa ? '✓' : ''}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '11px', margin: '0 0 50px 0' }}>
        * Beri tanda ✓ jika persyaratan sudah OK
      </p>

      {/*  TTD + QR  */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', width: '180px' }}>

          <p style={{ fontSize: '12px', margin: '0 0 3px 0' }}>
            Purwokerto, {today}
          </p>

          <p style={{ fontSize: '12px', margin: '0 0 16px 0' }}>
            Kepala Urusan Akademik,
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            {qrUrl ? (
              <QRCode
                value={qrUrl}
                size={110}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div style={{
                width: 110, height: 110,
                border: '1.5px dashed #CBD5E1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', color: '#9CA3AF',
              }}>
                QR Loading...
              </div>
            )}
          </div>


          <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 3px 0' }}>
            Dr. Ridwan Pandiya, S.Si., M.Sc.
          </p>


          <p style={{ fontSize: '12px', margin: 0 }}>
            NIP. 15820053
          </p>
        </div>
      </div>

    </div>
  );
});

FormulirContent.displayName = 'FormulirContent';

// ── Modal Utama ───────────────────────────────────────────────────────────────
const FormulirSKModal = ({ item, existingResponse, onClose }) => {
  const formulirRef = useRef(null);

  const [qrUrl,       setQrUrl]       = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error,       setError]       = useState(null);

  // ── Generate PDF validasi → upload → dapat downloadUrl untuk QR ──────────
  useEffect(() => {
    const initQR = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const studentId = item?.studentId;
        if (!studentId) throw new Error('studentId tidak ditemukan');

        const pdfData = mapSktaDataToPDF(item, existingResponse, logoTelkom);
        const pdfBlob = await generateDokumenValidasiBlob(pdfData);
        const namaFile = `Dokumen_Validasi_SKTA_${item?.student?.nim || studentId}`;

        const result      = await uploadDokumenValidasi(studentId, pdfBlob, namaFile);
        const downloadUrl = result?.downloadUrl;
        if (!downloadUrl) throw new Error('downloadUrl tidak ditemukan dari response BE');

        setQrUrl(downloadUrl);
      } catch (err) {
        console.error('[FormulirSKModal] initQR error:', err);
        setError(err.message || 'Gagal memproses dokumen validasi. Coba tutup dan buka lagi.');
      } finally {
        setIsLoading(false);
      }
    };
    initQR();
  }, [item?.studentId]);

  // ── Export PDF — pakai ukuran A4 pixel eksplisit agar tidak berantakan ────
  const handleExportPDF = async () => {
    if (!formulirRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(formulirRef.current, {
        scale:           2,
        useCORS:         true,
        logging:         false,
        backgroundColor: '#ffffff',
        allowTaint:      false,
        // Kunci: paksa lebar sesuai elemen agar tidak ada reflow
        windowWidth:     794,
        windowHeight:    1123,
      });

      const imgData   = canvas.toDataURL('image/png');
      const pdfDoc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth  = pdfDoc.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdfDoc.internal.pageSize.getHeight();  // 297mm

      // Paksa fit ke A4 penuh — tidak ada margin
      pdfDoc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const nim  = item?.student?.nim  || 'mahasiswa';
      const nama = (item?.student?.name || '').replace(/\s+/g, '_');
      pdfDoc.save(`Formulir_SK_TA_${nim}_${nama}.pdf`);

    } catch (err) {
      console.error('[FormulirSKModal] handleExportPDF error:', err);
      setError('Gagal export PDF. Coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = !isLoading && !isExporting && !error && qrUrl;

  return (
    <>
      {/* ── Hidden formulir A4 untuk di-screenshot html2canvas ── */}
      {/* Dirender di luar viewport agar tidak terlihat user tapi bisa di-capture */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
        <FormulirContent
          ref={formulirRef}
          item={item}
          sktaResponse={existingResponse}
          prodiName={item?.prodiName || '-'}
          qrUrl={qrUrl}
        />
      </div>

      {/* ── Modal Overlay ── */}
      <div
        style={{
          position:       'fixed',
          inset:          0,
          background:     'rgba(0,0,0,0.65)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         9000,
          padding:        '12px',
          overflowY:      'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.95, opacity: 0, y: 12 }}
          onClick={e => e.stopPropagation()}
          style={{
            background:    '#fff',
            borderRadius:  '12px',
            width:         '100%',
            maxWidth:      '860px',
            maxHeight:     '92vh',
            display:       'flex',
            flexDirection: 'column',
            overflow:      'hidden',
            boxShadow:     '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* ── HEADER ── */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '12px 16px',
            borderBottom:   '1px solid #E5E7EB',
            flexShrink:     0,
            gap:            '8px',
            flexWrap:       'wrap',  // mobile: wrap jika sempit
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827', flexShrink: 0 }}>
              Preview Formulir SK TA
            </h3>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
              {/* Status indicator */}
              {isLoading && (
                <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  Memproses QR...
                </span>
              )}
              {!isLoading && qrUrl && !error && (
                <span style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> QR Siap
                </span>
              )}
              {error && (
                <span style={{ fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} /> Gagal
                </span>
              )}

              {/* Tombol Export PDF */}
              <button
                onClick={handleExportPDF}
                disabled={!canExport}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '5px',
                  padding:      '7px 14px',
                  borderRadius: '6px',
                  fontSize:     '12px',
                  fontWeight:   700,
                  background:   canExport ? '#C0182A' : '#E5E7EB',
                  color:        canExport ? '#fff'    : '#9CA3AF',
                  border:       'none',
                  cursor:       canExport ? 'pointer' : 'not-allowed',
                  whiteSpace:   'nowrap',
                }}
              >
                {isExporting
                  ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Mengekspor...</>
                  : <><Download size={12} /> Export PDF</>
                }
              </button>

              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── BODY: preview visual (bukan yang di-capture) ── */}
          <div style={{
            flex:           1,
            overflow:       'auto',
            padding:        '20px',
            background:     '#F1F5F9',
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'flex-start',
          }}>
            {error ? (
              <div style={{
                padding:      '20px',
                background:   '#FEF2F2',
                border:       '1px solid #FECACA',
                borderRadius: '8px',
                color:        '#DC2626',
                fontSize:     '13px',
                maxWidth:     '380px',
                textAlign:    'center',
                lineHeight:   1.6,
              }}>
                <AlertCircle size={20} style={{ marginBottom: 8 }} />
                <br />{error}
              </div>
            ) : (
              /* Preview visual — scale down agar muat di layar */
              <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  transform:       'scale(0.75)',
                  transformOrigin: 'top center',
                  marginBottom:    '-210px', // kompensasi scale 0.75 dari 1123px
                  flexShrink:      0,
                }}>
                  {/* Preview ini hanya visual — BUKAN yang di-capture */}
                  <FormulirContent
                    item={item}
                    sktaResponse={existingResponse}
                    prodiName={item?.prodiName || '-'}
                    qrUrl={qrUrl}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default FormulirSKModal;