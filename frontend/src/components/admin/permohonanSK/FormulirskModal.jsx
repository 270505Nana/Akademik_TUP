import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import { generateDokumenValidasiBlob, mapSktaDataToPDF } from './Dokumenvalidasipdf';
import { uploadDokumenValidasi } from '../../../service/api';
import logoTelkom from '../../../assets/logo-telkom.png';

const formatTanggal = (isoStr) => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

const getResponseDate = (sktaResponse) => {
  const created = sktaResponse?.createdAt;
  const updated = sktaResponse?.updatedAt;
  if (created && updated && new Date(updated) > new Date(created)) {
    return updated;
  }
  return created || new Date().toISOString();
};

//  PDF Styles 
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 45,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },

  // KOP
  kopWrap:        { flexDirection: 'row', border: '1pt solid #000', marginBottom: 14 },
  kopLogoCell:    { width: 65, borderRight: '1pt solid #000', alignItems: 'center', justifyContent: 'center', padding: 6 },
  kopLogo:        { width: 46, height: 46 },
  kopMiddle:      { flex: 1, borderRight: '1pt solid #000' },
  kopMidRow:      { padding: '4 8', borderBottom: '1pt solid #000', alignItems: 'center', justifyContent: 'center' },
  kopMidRowLast:  { padding: '4 8', alignItems: 'center', justifyContent: 'center' },
  kopRight:       { width: 158 },
  kopRRow:        { flexDirection: 'row', borderBottom: '1pt solid #000', minHeight: 18 },
  kopRRowLast:    { flexDirection: 'row', minHeight: 18 },
  kopRLabel:      { width: 76, padding: '3 4', fontSize: 7.5, borderRight: '1pt solid #000' },
  kopRValue:      { flex: 1, padding: '3 4', fontSize: 7.5, fontFamily: 'Helvetica-Bold', flexWrap: 'wrap' },

  // Judul
  judul: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', textDecoration: 'underline', marginBottom: 12 },

  // Tabel data mahasiswa
  dmTable:    { border: '1pt solid #000', marginBottom: 12 },
  dmRow:      { flexDirection: 'row', borderBottom: '1pt solid #000' },
  dmRowLast:  { flexDirection: 'row' },
  dmLabel:    { width: 118, padding: '5 7', fontSize: 9, fontFamily: 'Helvetica-Bold', borderRight: '1pt solid #000', flexShrink: 0 },
  dmValue:    { flex: 1, padding: '5 7', fontSize: 9 },

  // Tabel dokumen
  docTable:       { border: '1pt solid #000', marginBottom: 8 },
  docHdrRow:      { flexDirection: 'row', backgroundColor: '#EEEEEE', borderBottom: '1pt solid #000' },
  docBodyRow:     { flexDirection: 'row', borderBottom: '1pt solid #000' },
  docBodyRowLast: { flexDirection: 'row' },
  docNo:          { width: 28, padding: '5 3', fontSize: 9, textAlign: 'center', borderRight: '1pt solid #000' },
  docNoHdr:       { width: 28, padding: '5 3', fontSize: 9, textAlign: 'center', fontFamily: 'Helvetica-Bold', borderRight: '1pt solid #000' },
  docDesc:        { flex: 1, padding: '5 7', fontSize: 9, borderRight: '1pt solid #000' },
  docDescHdr:     { flex: 1, padding: '5 7', fontSize: 9, fontFamily: 'Helvetica-Bold', borderRight: '1pt solid #000' },
  docStatus:      { width: 52, alignItems: 'center', justifyContent: 'center', padding: '5 3' },
  docStatusHdr:   { width: 58, padding: '5 2', fontSize: 8, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  docRedText:     { fontSize: 8, color: '#CC0000', fontFamily: 'Helvetica-Oblique' },

  // Centang
  centangWrap: { width: 58, alignItems: 'center', justifyContent: 'center', padding: '5 3' },
  centangImg:  { width: 16, height: 16 },

  note: { fontSize: 7.5, color: '#555555', marginBottom: 24 },

  // TTD
  ttdWrap:   { alignItems: 'flex-end' },
  ttdBlock:  { alignItems: 'center', width: 175 },
  ttdCity:   { fontSize: 9.5, marginBottom: 2, textAlign: 'center' },
  ttdJob:    { fontSize: 9.5, marginBottom: 14, textAlign: 'center' },
  ttdQR:     { width: 96, height: 96, marginBottom: 8 },
  ttdQRBox:  { width: 96, height: 96, border: '1pt dashed #CBD5E1', marginBottom: 8 },
  ttdName:   { fontSize: 9.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 2 },
  ttdNip:    { fontSize: 9.5, textAlign: 'center' },
});


const CHECKMARK_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAIAAABuYg/PAAAAqklEQVR4nO3XsRKAIAgG4Oj939kGF0JApF+XcPBa5DtFOaLW2nVq3Mekwgp7DyI6hHVJeFswbvBvPCZ2w4sGGHMkPOZIYIxvSy25MGwqwbDxSe3C/EuBxOKSjgXPZFVSMLXMQCSJWWUGIklMrLG8nCSxuJeQFGy6PvJ4FzARxUpkogcMvbP4FU1ifvJyra23MytiuomeHOMY90u7Ps9Zj87n9KD6sSjsn9gDKzpXR7qfndgAAAAASUVORK5CYII=";

const Centang = ({ checked }) => (
  <View style={S.centangWrap}>
    {checked && <Image style={S.centangImg} src={CHECKMARK_PNG} />}
  </View>
);

const FormulirPDF = ({ item, sktaResponse, prodiName, qrDataUrl }) => {
  const student     = item?.student || {};
  const hasProposal = sktaResponse?.hasUploadedFinalProposal === true;
  const hasBahasa   = sktaResponse?.hasTakenLanguageTest     === true;
  const today       = formatTanggal(getResponseDate(sktaResponse));

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/*  KOP SURAT  */}
        <View style={S.kopWrap}>
          <View style={S.kopLogoCell}>
            <Image style={S.kopLogo} src={logoTelkom} />
          </View>

          <View style={S.kopMiddle}>
            <View style={S.kopMidRow}>
              <Text style={{ fontSize: 11.5, fontFamily: 'Helvetica-Bold' }}>UNIVERSITAS TELKOM</Text>
            </View>
            <View style={S.kopMidRow}>
              <Text style={{ fontSize: 8 }}>Jl. Telekomunikasi No. 1, Dayeuh Kolot, Kab. Bandung 40257</Text>
            </View>
            <View style={S.kopMidRow}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>FORMULIR KELENGKAPAN</Text>
            </View>
            <View style={S.kopMidRowLast}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>PERSYARATAN PENGAJUAN SK TUGAS AKHIR</Text>
            </View>
          </View>

          <View style={S.kopRight}>
            <View style={S.kopRRow}>
              <Text style={S.kopRLabel}>No. Dokumen</Text>
              <Text style={S.kopRValue}>TUP-SPM-FM-TA-003</Text>
            </View>
            <View style={S.kopRRow}>
              <Text style={S.kopRLabel}>No. Revisi</Text>
              <Text style={S.kopRValue}>00</Text>
            </View>
            <View style={S.kopRRow}>
              <Text style={S.kopRLabel}>Berlaku Efektif</Text>
              <Text style={S.kopRValue}>02 Januari 2025</Text>
            </View>
            <View style={S.kopRRowLast}>
              <Text style={S.kopRLabel}>Halaman</Text>
              <Text style={S.kopRValue}>1 dari 1</Text>
            </View>
          </View>
        </View>

        {/*  JUDUL  */}
        <Text style={S.judul}>
          FORMULIR KELENGKAPAN PERSYARATAN PENERBITAN SK TUGAS AKHIR
        </Text>

        {/*  DATA MAHASISWA  */}
        <View style={S.dmTable}>
          <View style={S.dmRow}>
            <Text style={S.dmLabel}>NIM</Text>
            <Text style={S.dmValue}>{student.nim || '-'}</Text>
          </View>
          <View style={S.dmRow}>
            <Text style={S.dmLabel}>Nama Mahasiswa</Text>
            <Text style={S.dmValue}>{student.name || '-'}</Text>
          </View>
          <View style={S.dmRow}>
            <Text style={S.dmLabel}>Program Studi</Text>
            <Text style={S.dmValue}>{prodiName || '-'}</Text>
          </View>
          <View style={S.dmRowLast}>
            <Text style={S.dmLabel}>Judul Proposal TA</Text>
            <View style={{ flex: 1, padding: '5 7' }}>
              <Text style={{ fontSize: 9 }}>{item?.proposalTitleId || '-'}</Text>
            </View>
          </View>
        </View>

        {/*  TABEL DOKUMEN PERSYARATAN  */}
        <View style={S.docTable}>
          {/* Header */}
          <View style={S.docHdrRow}>
            <Text style={S.docNoHdr}>No</Text>
            <Text style={S.docDescHdr}>Dokumen persyaratan</Text>
            <Text style={S.docStatusHdr}>Status{'\n'}(OK)</Text>
          </View>

          <View style={S.docBodyRow}>
            <Text style={S.docNo}>1</Text>
            <View style={{ flex: 1, padding: '5 7', borderRight: '1pt solid #000' }}>
              <Text style={{ fontSize: 9 }}>
                Telah mengunggah proposal akhir melalui aplikasi i-Gracias
              </Text>
            </View>
            <View style={S.docStatus}>
              <Centang checked={hasProposal} />
            </View>
          </View>

          <View style={S.docBodyRowLast}>
            <Text style={S.docNo}>2</Text>
            <View style={{ flex: 1, padding: '5 7', borderRight: '1pt solid #000' }}>
              <Text style={{ fontSize: 9 }}>
                {'Sertifikat TOEFL / EprT / Tes lain yang setara (Fotocopy) dengan mengunggah di aplikasi i-Gracias '}
              </Text>
              <Text style={S.docRedText}>(MINIMAL PERNAH 1X TES BAHASA)</Text>
            </View>
            <View style={S.docStatus}>
              <Centang checked={hasBahasa} />
            </View>
          </View>
        </View>

        <Text style={S.note}>* Beri tanda centang jika persyaratan sudah OK</Text>

        <View style={S.ttdWrap}>
          <View style={S.ttdBlock}>
            <Text style={S.ttdCity}>Purwokerto, {today}</Text>
            <Text style={S.ttdJob}>Kepala Urusan Akademik,</Text>
            {qrDataUrl
              ? <Image style={S.ttdQR} src={qrDataUrl} />
              : <View style={S.ttdQRBox} />
            }
            <Text style={S.ttdName}>Dr. Ridwan Pandiya, S.Si., M.Sc.</Text>
            <Text style={S.ttdNip}>NIP. 15820053</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

//  Modal 
const FormulirSKModal = ({ item, existingResponse, onClose }) => {
  const qrCanvasRef = useRef(null);

  const [qrUrl,       setQrUrl]       = useState(null);
  const [qrDataUrl,   setQrDataUrl]   = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const initQR = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const studentId = item?.studentId;
        if (!studentId) throw new Error('studentId tidak ditemukan');

        const pdfData  = mapSktaDataToPDF(item, existingResponse, logoTelkom);
        const pdfBlob  = await generateDokumenValidasiBlob(pdfData);
        const namaFile = `Dokumen_Validasi_SKTA_${item?.student?.nim || studentId}`;
        const result   = await uploadDokumenValidasi(studentId, pdfBlob, namaFile);

        const downloadUrl = result?.downloadUrl;
        if (!downloadUrl) throw new Error('downloadUrl tidak ditemukan dari response BE');

        setQrUrl(downloadUrl);
      } catch (err) {
        console.error('[FormulirSKModal] initQR error:', err);
        setError(err.message || 'Gagal memproses dokumen validasi.');
      } finally {
        setIsLoading(false);
      }
    };
    initQR();
  }, [item?.studentId]);

  // QR canvas render → ambil dataURL
  useEffect(() => {
    if (!qrUrl) return;
    const timer = setTimeout(() => {
      try {
        const canvas  = qrCanvasRef.current?.querySelector('canvas');
        const dataUrl = canvas?.toDataURL('image/png');
        if (dataUrl) setQrDataUrl(dataUrl);
      } catch (e) {
        console.error('QR canvas toDataURL error:', e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [qrUrl]);

  // export PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const prodiName = item?.prodiName || item?.student?.studyProgram?.name || '-';
      const blob = await pdf(
        <FormulirPDF
          item={item}
          sktaResponse={existingResponse}
          prodiName={prodiName}
          qrDataUrl={qrDataUrl}
        />
      ).toBlob();

      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      const nim  = item?.student?.nim  || 'mahasiswa';
      const nama = (item?.student?.name || '').replace(/\s+/g, '_');
      link.download = `Formulir_SK_TA_${nim}_${nama}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[FormulirSKModal] handleExportPDF error:', err);
      setError('Gagal export PDF. Coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const canExport   = !isLoading && !isExporting && !error;
  const student     = item?.student || {};
  const hasProposal = existingResponse?.hasUploadedFinalProposal === true;
  const hasBahasa   = existingResponse?.hasTakenLanguageTest     === true;
  const today       = formatTanggal(getResponseDate(existingResponse));
  const prodiName   = item?.prodiName || item?.student?.studyProgram?.name || '-';

  return (
    <>
      <div
        ref={qrCanvasRef}
        style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1, opacity: 0 }}
        aria-hidden="true"
      >
        {qrUrl && <QRCodeCanvas value={qrUrl} size={200} level="M" includeMargin={false} />}
      </div>

      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9000, padding: '12px', overflowY: 'auto',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.95, opacity: 0, y: 12 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '860px', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
            flexShrink: 0, gap: '8px', flexWrap: 'wrap',
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
              Preview Formulir SK TA
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {isLoading && (
                <span style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Memproses QR...
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
              <button
                onClick={handleExportPDF}
                disabled={!canExport}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                  background: canExport ? '#C0182A' : '#E5E7EB',
                  color:      canExport ? '#fff'    : '#9CA3AF',
                  border: 'none', cursor: canExport ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
                }}
              >
                {isExporting
                  ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Mengekspor...</>
                  : <><Download size={12} /> Export PDF</>
                }
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div style={{
            flex: 1, overflow: 'auto', padding: '20px',
            background: '#F1F5F9', display: 'flex', justifyContent: 'center',
          }}>
            {error ? (
              <div style={{
                padding: '20px', background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: '8px', color: '#DC2626', fontSize: '13px',
                maxWidth: '380px', textAlign: 'center', lineHeight: 1.6,
              }}>
                <AlertCircle size={20} style={{ marginBottom: 8 }} /><br />{error}
              </div>
            ) : (

              <div style={{
                background: '#fff', width: '595px', minHeight: '842px',
                padding: '36px 45px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000',
              }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '65px' }} />
                    <col />
                    <col style={{ width: '148px' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td rowSpan={4} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <img src={logoTelkom} alt="Logo" style={{ width: '46px', height: 'auto' }} />
                      </td>
                      <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>UNIVERSITAS TELKOM</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px' }}><b>No. Dokumen</b><br />TUP-SPM-FM-TA-003</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '3px 8px', textAlign: 'center', fontSize: '8px' }}>Jl. Telekomunikasi No. 1, Dayeuh Kolot, Kab. Bandung 40257</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px' }}><b>No. Revisi</b><br />00</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '3px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>FORMULIR KELENGKAPAN</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px' }}><b>Berlaku Efektif</b><br />02 Januari 2025</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '3px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>PERSYARATAN PENGAJUAN SK TUGAS AKHIR</td>
                      <td style={{ border: '1px solid #000', padding: '3px 4px', fontSize: '8px' }}><b>Halaman</b><br />1 dari 1</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '10.5px', textDecoration: 'underline', marginBottom: '12px' }}>
                  FORMULIR KELENGKAPAN PERSYARATAN PENERBITAN SK TUGAS AKHIR
                </p>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', tableLayout: 'fixed' }}>
                  <colgroup><col style={{ width: '118px' }} /><col /></colgroup>
                  <tbody>
                    {[
                      { label: 'NIM',               value: student.nim           || '-' },
                      { label: 'Nama Mahasiswa',    value: student.name          || '-' },
                      { label: 'Program Studi',     value: prodiName             || '-' },
                      { label: 'Judul Proposal TA', value: item?.proposalTitleId || '-' },
                    ].map(({ label, value }) => (
                      <tr key={label}>
                        <td style={{ border: '1px solid #000', padding: '5px 7px', fontWeight: 600, fontSize: '9px', verticalAlign: 'top' }}>{label}</td>
                        <td style={{ border: '1px solid #000', padding: '5px 7px', fontSize: '9px', wordBreak: 'break-word' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '28px' }} />
                    <col />
                    <col style={{ width: '52px' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ backgroundColor: '#EEEEEE' }}>
                      <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', fontSize: '9px' }}>No</th>
                      <th style={{ border: '1px solid #000', padding: '5px 7px', textAlign: 'left', fontSize: '9px' }}>Dokumen persyaratan</th>
                      <th style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', fontSize: '9px' }}>Status (OK)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', fontSize: '9px', verticalAlign: 'top' }}>1</td>
                      <td style={{ border: '1px solid #000', padding: '5px 7px', fontSize: '9px' }}>Telah mengunggah proposal akhir melalui aplikasi i-Gracias</td>
                      <td style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{
                          width: 12, height: 12, border: '1px solid #000',
                          backgroundColor: hasProposal ? '#000' : 'transparent',
                          margin: '0 auto',
                        }} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', fontSize: '9px', verticalAlign: 'top' }}>2</td>
                      <td style={{ border: '1px solid #000', padding: '5px 7px', fontSize: '9px' }}>
                        Sertifikat TOEFL / EprT / Tes lain yang setara (Fotocopy) dengan mengunggah di aplikasi i-Gracias{' '}
                        <span style={{ color: '#CC0000', fontStyle: 'italic' }}>(MINIMAL PERNAH 1X TES BAHASA)</span>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '5px 3px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{
                          width: 12, height: 12, border: '1px solid #000',
                          backgroundColor: hasBahasa ? '#000' : 'transparent',
                          margin: '0 auto',
                        }} />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontSize: '8px', color: '#555', marginBottom: '24px' }}>* Beri tanda centang jika persyaratan sudah OK</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center', width: '175px' }}>
                    <p style={{ fontSize: '10px', margin: '0 0 2px 0' }}>Purwokerto, {today}</p>
                    <p style={{ fontSize: '10px', margin: '0 0 14px 0' }}>Kepala Urusan Akademik,</p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      {isLoading ? (
                        <div style={{ width: 96, height: 96, border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#9CA3AF' }} />
                        </div>
                      ) : qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code" style={{ width: 96, height: 96 }} />
                      ) : (
                        <div style={{ width: 96, height: 96, border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#9CA3AF' }}>
                          QR Error
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '10px', margin: '0 0 2px 0', fontWeight: 'bold' }}>Dr. Ridwan Pandiya, S.Si., M.Sc.</p>
                    <p style={{ fontSize: '10px', margin: 0 }}>NIP. 15820053</p>
                  </div>
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