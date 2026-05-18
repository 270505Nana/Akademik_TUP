import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import logoTelkom from "../../../assets/logo-telkom.png";

const FormulirSKModal = ({ item, existingResponse, onClose }) => {
  const printRef = useRef();

  const student  = item?.student  || {};
  const prodiName = item?.prodiName || '-';
  const judulTA   = item?.proposalTitleId || '-';
  const hasProposal = existingResponse?.hasUploadedFinalProposal === true;
  const hasLang     = existingResponse?.hasTakenLanguageTest     === true;
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow  = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Formulir SK TA — ${student.name || ''}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              color: #000;
              background: #fff;
            }
            .formulir-wrapper {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 20mm 20mm 20mm 25mm;
            }
            /* Tabel Kop */
            .kop-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .kop-table td, .kop-table th {
              border: 1px solid #000;
              padding: 4px 8px;
              font-size: 10pt;
              vertical-align: middle;
            }
            .kop-logo-cell {
              width: 80px;
              text-align: center;
              padding: 4px;
            }
            .kop-logo {
              width: 70px;
              height: auto;
            }
            .kop-title {
              text-align: center;
              font-weight: bold;
              font-size: 11pt;
            }
            .kop-sub-title {
              text-align: center;
              font-weight: bold;
              font-size: 10pt;
            }
            .kop-meta-label { font-size: 9.5pt; }
            .kop-meta-value { font-size: 9.5pt; }
            /* Judul Formulir */
            .form-main-title {
              text-align: center;
              font-weight: bold;
              font-size: 12pt;
              margin: 18px 0 16px;
              text-transform: uppercase;
              text-decoration: underline;
            }
            /* Tabel Data Mahasiswa */
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            .data-table td {
              border: 1px solid #000;
              padding: 5px 8px;
              font-size: 10.5pt;
              vertical-align: top;
            }
            .data-label { width: 130px; white-space: nowrap; }
            .data-colon { width: 10px; }
            /* Tabel Checklist */
            .check-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .check-table th, .check-table td {
              border: 1px solid #000;
              padding: 5px 8px;
              font-size: 10.5pt;
              text-align: left;
              vertical-align: middle;
            }
            .check-table th {
              text-align: center;
              font-weight: bold;
            }
            .col-no     { width: 35px; text-align: center; }
            .col-status { width: 80px; text-align: center; }
            .checkmark  { font-size: 13pt; font-weight: bold; }
            /* Keterangan */
            .keterangan {
              font-size: 10pt;
              margin: 6px 0 24px;
            }
            /* TTD Section */
            .ttd-section {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
            }
            .ttd-box {
              text-align: center;
              width: 200px;
            }
            .ttd-kota { font-size: 10.5pt; margin-bottom: 60px; }
            .ttd-nama { font-size: 10.5pt; font-weight: bold; }
            .ttd-jabatan { font-size: 10pt; }
            .ttd-img {
              width: 90px;
              height: auto;
              margin: 0 auto 4px;
              display: block;
              opacity: 0.7;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .formulir-wrapper { padding: 15mm 15mm 15mm 20mm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="formulir-overlay" onClick={onClose}>
      <style>{`
        .formulir-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 3000;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .formulir-modal-box {
          background: #fff;
          border-radius: 12px;
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
        }
        .formulir-modal-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
          border-radius: 12px 12px 0 0;
          flex-shrink: 0;
        }
        .formulir-modal-topbar h3 {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
        }
        .formulir-modal-actions { display: flex; gap: 10px; align-items: center; }
        .btn-print {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px;
          background: #C0182A; color: white;
          border: none; border-radius: 6px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-print:hover { background: #A01423; }
        .btn-close-formulir {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid #CBD5E1; border-radius: 6px;
          background: white; cursor: pointer;
          color: #64748B;
        }
        .btn-close-formulir:hover { background: #FFF1F2; color: #C0182A; border-color: #C0182A; }
        .formulir-modal-body {
          overflow-y: auto;
          padding: 24px;
          background: #94A3B8;
          flex: 1;
        }
        /* Kertas A4 preview */
        .formulir-paper {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #fff;
          padding: 20mm 20mm 20mm 25mm;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          color: #000;
        }
        /* Tabel Kop */
        .kop-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .kop-table td {
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 10pt;
          vertical-align: middle;
        }
        .kop-logo-cell {
          width: 82px;
          text-align: center;
          padding: 4px;
        }
        .kop-logo { width: 72px; height: auto; }
        .kop-title { text-align: center; font-weight: bold; font-size: 11pt; }
        .kop-sub-title { text-align: center; font-weight: bold; font-size: 10pt; line-height: 1.5; }
        .kop-meta-label { white-space: nowrap; font-size: 9.5pt; }
        .kop-meta-value { font-size: 9.5pt; }
        /* Judul Formulir */
        .form-main-title {
          text-align: center;
          font-weight: bold;
          font-size: 12pt;
          margin: 18px 0 16px;
          text-transform: uppercase;
          text-decoration: underline;
        }
        /* Tabel Data */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .data-table td {
          border: 1px solid #000;
          padding: 5px 8px;
          font-size: 10.5pt;
          vertical-align: top;
        }
        .data-label { width: 130px; white-space: nowrap; }
        .data-colon { width: 10px; }
        /* Tabel Checklist */
        .check-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .check-table th, .check-table td {
          border: 1px solid #000;
          padding: 5px 8px;
          font-size: 10.5pt;
          vertical-align: middle;
        }
        .check-table th { text-align: center; font-weight: bold; }
        .col-no     { width: 35px; text-align: center; }
        .col-status { width: 90px; text-align: center; }
        .checkmark  { font-size: 14pt; font-weight: bold; }
        /* Keterangan */
        .keterangan { font-size: 10pt; margin: 8px 0 28px; }
        /* TTD */
        .ttd-section { display: flex; justify-content: flex-end; margin-top: 8px; }
        .ttd-box { text-align: center; width: 210px; }
        .ttd-kota { font-size: 10.5pt; margin-bottom: 4px; }
        .ttd-img-wrap { height: 80px; display: flex; align-items: center; justify-content: center; }
        .ttd-img { width: 80px; height: auto; opacity: 0.6; }
        .ttd-nama { font-size: 10.5pt; font-weight: bold; margin-top: 4px; }
        .ttd-jabatan { font-size: 10pt; }
      `}</style>

      <motion.div
        className="formulir-modal-box"
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1,   opacity: 1, y: 0  }}
        exit={{    scale: 0.93, opacity: 0, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Topbar */}
        <div className="formulir-modal-topbar">
          <h3>Preview Formulir Penerbitan SK TA</h3>
          <div className="formulir-modal-actions">
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={15} /> Export PDF
            </button>
            <button className="btn-close-formulir" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="formulir-modal-body">
          <div className="formulir-paper" ref={printRef}>

            {/*  KOP SURAT  */}
            <table className="kop-table">
              <tbody>
                <tr>

                  <td className="kop-logo-cell" rowSpan={3}>
                    <img src={logoTelkom} alt="Logo Telkom" className="kop-logo" />
                  </td>
                  {/* Nama universitas */}
                  <td className="kop-title" style={{ width: '55%' }}>
                    UNIVERSITAS TELKOM
                  </td>
                  {/* Meta kanan */}
                  <td className="kop-meta-label">No. Dokumen</td>
                  <td className="kop-meta-value">TUP-SPM-FM-TA-003</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'center', fontSize: '9.5pt' }}>
                    Jl. Telekomunikasi No. 1, Dayeuh Kolot, Kab. Bandung 40257
                  </td>
                  <td className="kop-meta-label">No. Revisi</td>
                  <td className="kop-meta-value">00</td>
                </tr>
                <tr>
                  <td className="kop-sub-title" rowSpan={2}>
                    FORMULIR KELENGKAPAN<br />
                    PERSYARATAN PENGAJUAN SK TUGAS<br />
                    AKHIR
                  </td>
                  <td className="kop-meta-label">Berlaku Efektif</td>
                  <td className="kop-meta-value">02 Januari 2025</td>
                </tr>
                <tr>
                  <td className="kop-logo-cell" />
                  <td className="kop-meta-label">Halaman</td>
                  <td className="kop-meta-value">1 dari 1</td>
                </tr>
              </tbody>
            </table>

            {/*  JUDUL FORMULIR  */}
            <div className="form-main-title">
              Formulir Kelengkapan Persyaratan Penerbitan SK Tugas Akhir
            </div>

            {/*  DATA MAHASISWA  */}
            <table className="data-table">
              <tbody>
                <tr>
                  <td className="data-label">NIM</td>
                  <td className="data-colon">:</td>
                  <td>{student.nim || '-'}</td>
                </tr>
                <tr>
                  <td className="data-label">Nama Mahasiswa</td>
                  <td className="data-colon">:</td>
                  <td>{student.name || '-'}</td>
                </tr>
                <tr>
                  <td className="data-label">Program Studi</td>
                  <td className="data-colon">:</td>
                  <td>{prodiName}</td>
                </tr>
                <tr>
                  <td className="data-label">Judul Proposal TA</td>
                  <td className="data-colon">:</td>
                  <td>{judulTA}</td>
                </tr>
              </tbody>
            </table>

            {/*  TABEL CHECKLIST  */}
            <table className="check-table">
              <thead>
                <tr>
                  <th className="col-no">No</th>
                  <th>Dokumen persyaratan</th>
                  <th className="col-status">Status (OK)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="col-no">1</td>
                  <td>
                    Telah mengunggah proposal akhir melalui aplikasi i-Gracias
                  </td>
                  <td className="col-status">
                    {hasProposal && <span className="checkmark">✓</span>}
                  </td>
                </tr>
                <tr>
                  <td className="col-no">2</td>
                  <td>
                    Sertifikat TOEFL / EprT / Tes lain yang setara (Fotocopy) dengan mengunggah di
                    aplikasi i-Gracias <em style={{ color: '#B91C1C', fontWeight: 'bold' }}>
                      (MINIMAL PERNAH 1X TES BAHASA)
                    </em>
                  </td>
                  <td className="col-status">
                    {hasLang && <span className="checkmark">✓</span>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Keterangan */}
            <p className="keterangan">
              * Beri tanda <em>✓</em> jika persyaratan sudah OK
            </p>

            {/*  TTD  */}
            <div className="ttd-section">
              <div className="ttd-box">
                <p className="ttd-kota">Purwokerto, {today}</p>
                <p style={{ fontSize: '10.5pt', marginBottom: '4px' }}>Admin Akademik,</p>
                {/* Placeholder TTD — logo Telkom sebagai contoh stempel */}
                <div className="ttd-img-wrap">
                  <img src={logoTelkom} alt="Stempel" className="ttd-img" />
                </div>
                <p className="ttd-nama">Admin Akademik</p>
                <p className="ttd-jabatan">REK-403</p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FormulirSKModal;