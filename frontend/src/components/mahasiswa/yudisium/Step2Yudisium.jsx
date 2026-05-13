import React, { useState } from 'react';
import { useYudisiumForm } from '../../context/YudisiumFormContext';
import { BsChevronLeft, BsChevronRight, BsCloudArrowUp, BsDownload, BsCheckCircleFill } from 'react-icons/bs';
import CustomAlert from '../common/CustomAlert';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const BERKAS_LIST = [
  { id: 1, name: 'BERKAS LEMBAR REVISI TA' },
  { id: 2, name: 'BERKAS LEMBAR PENGESAHAN TUGAS AKHIR' },
  { id: 3, name: 'BERKAS SURAT BEBAS KEWAJIBAN PUSTAKA' },
  { id: 4, name: 'BERKAS SCAN BUKTI PEMBAYARAN WISUDA' },
  { id: 5, name: 'BERKAS BUKTI UNGGAH 5 TAK TERBAIK (SKPI)' },
  { id: 6, name: 'BERKAS SKPI SUDAH APPROVE BK' },
  { id: 7, name: 'BERKAS BUKTI UPLOAD OPENLIBRARY' },
  { id: 8, name: 'BERKAS BUKTI SIMILARITY' },
  { id: 9, name: 'BERKAS KELENGKAPAN DOKUMEN YUDISIUM' },
];

const SKEMA_CONFIG = {
  'Publikasi Jurnal': {
    title: 'PUBLIKASI JURNAL(SUMMA CUMLAUDE & CUMLAUDE)',
    docs: [
      { id: '1', name: 'BERKAS LoA DARI PUBLISHER' },
      { id: '2', name: 'BERKAS EVIDENCE PENDUKUNG' },
    ]
  },
  'Pameran': {
    title: 'PAMERAN(HANYA CUMLAUDE)',
    docs: [
      { id: '1', name: 'BERKAS SERTIFIKAT' },
      { id: '2', name: 'BERKAS EVIDENCE PENDUKUNG' },
    ]
  },
  'Lomba': {
    title: 'LOMBA(HANYA CUMLAUDE)',
    docs: [
      { id: '1', name: 'BERKAS SERTIFIKAT' },
      { id: '2', name: 'BERKAS EVIDENCE PENDUKUNG' },
    ]
  },
  'HKI': {
    title: 'HKI (HANYA CUMLAUDE)',
    docs: [
      { id: '1', name: 'BERKAS SERTIFIKAT' },
      { id: '2', name: 'BERKAS EVIDENCE PENDUKUNG' },
    ]
  }
};

const UploadSection = ({ title, docs, berkasData, onFileChange, sectionId, fileError }) => {
  const [activeDocId, setActiveDocId] = useState(docs[0].id);
  const currentDoc = docs.find(d => idToString(d.id) === idToString(activeDocId)) || docs[0];
  const isCompleted = (name) => !!berkasData?.[name];

  function idToString(id) {
    return String(id);
  }

  const handleNext = () => {
    const currentIndex = docs.findIndex(d => idToString(d.id) === idToString(activeDocId));
    if (currentIndex < docs.length - 1) {
      setActiveDocId(docs[currentIndex + 1].id);
    }
  };

  return (
    <div className="upload-section-block" style={{ marginBottom: '4rem' }}>
      <div className="section-divider" style={{ border: 'none', marginBottom: '1.5rem', marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', color: '#1e293b' }}>{title}</h2>
      </div>

      <div className="doc-upload-grid">
        <div className="doc-sidebar-list">
          {docs.map((doc) => (
            <div 
              key={doc.id} 
              className={`doc-upload-item ${idToString(activeDocId) === idToString(doc.id) ? 'active' : ''} ${isCompleted(doc.name) ? 'done' : ''}`}
              onClick={() => setActiveDocId(doc.id)}
            >
              <div className="doc-id-circle"><span>{doc.id}</span></div>
              <span className="doc-upload-name">{doc.name}</span>
            </div>
          ))}
        </div>

        <div className="upload-panel-card">
          <div className="breadcrumb-path">
            <span>Step {docs.findIndex(d => String(d.id) === String(activeDocId)) + 1} - {docs.length}</span>
            <span className="separator"><BsChevronRight /></span>
            <span>{currentDoc.name}</span>
          </div>

          <div className="template-download-section">
            <div className="template-info">
              <h4>Download Template</h4>
              <p>Pada tahap ini kamu membutuhkan menggunakan template. Silahkan unduh dan isi template di samping ini.</p>
            </div>
            <button className="download-btn-red" onClick={() => window.open('#', '_blank')}>
              <BsDownload size={18} />
              <span>Download Template Disini</span>
            </button>
          </div>

          <div className="upload-zone-wrapper">
            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: '#1e293b' }}>Pilih file dan Upload disini</p>
            <div className="dropzone-container" onClick={() => document.getElementById(`fileInput-${currentDoc.id}`).click()}>
              <BsCloudArrowUp className="cloud-icon" />
              <p className="drop-text-blue">Drag and Drop of <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Choose File</span> To upload</p>
              <div className="format-pills">
                <span className="format-pill">PDF</span>
                <span className="format-pill">JPG/PNG</span>
                <span className="format-pill">Max 3MB</span>
              </div>
              <input 
                id={`fileInput-${currentDoc.id}`}
                type="file" 
                style={{ display: 'none' }} 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => onFileChange(currentDoc.name, e.target.files[0])}
              />
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: '#1e293b' }}>File Terpilih</p>
              
              {fileError && (
                <CustomAlert 
                  type="error" 
                  title="Error: Ukuran File"
                  message={fileError} 
                  style={{ margin: '0' }}
                />
              )}

              {isCompleted(currentDoc.name) && !fileError && (
                <div style={{ padding: '1rem 1.5rem', background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '12px', color: '#166534', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BsCheckCircleFill size={16} />
                  <span>Berhasil Diunggah: {berkasData[currentDoc.name].name}</span>
                </div>
              )}
              
              {!isCompleted(currentDoc.name) && !fileError && (
                <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada file yang dipilih</p>
              )}
            </div>
          </div>

          <button 
            className="download-btn-red" 
            style={{ marginTop: '2rem', width: 'fit-content', padding: '12px 40px' }}
            onClick={handleNext}
          >
            Simpan dan Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};

const Step2Yudisium = () => {
  const { state, dispatch } = useYudisiumForm();
  const { data } = state;
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fileError, setFileError] = useState(null);

  const handleFileChange = (docName, file) => {
    if (!file) return;
    const limit = 3 * 1024 * 1024;
    if (file.size > limit) {
      setFileError(file.name + " melebihi batas 3MB.");
      return;
    }
    setFileError(null);
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { 
        berkas: { ...data.berkas, [docName]: file } 
      } 
    });
  };

  const checkIncomplete = () => {
    // Check Step 1 mandatory fields
    const step1Required = [
      'nama', 'nim', 'prodi', 'tak', 'program', 
      'doswal', 'skemaSidang', 'jalurYudisium', 
      'judulId', 'judulEn'
    ];
    const step1Incomplete = step1Required.some(field => !data[field] || data[field].toString().trim() === '');
    if (step1Incomplete) return true;

    // Check mandatory docs for Step 2
    const mandatoryIncomplete = BERKAS_LIST.some(d => !data.berkas?.[d.name]);
    if (mandatoryIncomplete) return true;

    // Check additional docs for specific jalur
    if (data.jalurYudisium !== 'Non Cumlaude') {
      for (const skema of data.skemaTambahan || []) {
        const config = SKEMA_CONFIG[skema];
        if (config && config.docs.some(d => !data.berkas?.[d.name])) return true;
      }
      
      // Check evidenList for Cumlaude
      if (data.jalurYudisium === 'Pengajuan Cumlaude' || data.jalurYudisium === 'Pengajuan Summa Cumlaude') {
        const stripHtml = (html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return doc.body.textContent || "";
        };
        const plainText = stripHtml(data.evidenList || '');
        if (plainText.trim().length === 0) return true;
      }
    }
    return false;
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (checkIncomplete()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    alert('Pendaftaran Yudisium Berhasil Terkirim!');
  };

  return (
    <div className="yudisium-page-container">
      <div className="step-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="step-label-red" style={{ fontSize: '1.25rem' }}>Step 2</span>
        <h2 className="step-title-red" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>Pendaftaran Yudisium Telkom University Purwokerto</h2>
      </div>

      <div className="form-section">
        <div className="section-divider">
          <h2>Informasi Tugas Akhir</h2>
        </div>
        
        {(data.jalurYudisium === 'Pengajuan Cumlaude' || data.jalurYudisium === 'Pengajuan Summa Cumlaude') && (
          <div className="textarea-container" style={{ marginBottom: '2.5rem' }}>
            <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'block' }}>LIST DATA EVIDEN CUMLAUDE / SUMMA CUMLAUDE</label>
            <div className="quill-editor-wrapper" style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <ReactQuill 
                theme="snow"
                value={data.evidenList || ''} 
                onChange={(content) => dispatch({ type: 'UPDATE_DATA', payload: { evidenList: content } })}
                placeholder="Begin typing..."
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    [{ 'font': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                  ]
                }}
                style={{ height: '250px', marginBottom: '45px' }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
              Masukan nama jurnal/conference publikasi Tugas Akhir anda atau predikat juara+nama lomba sesuai bidang keilmuan tingkat nasional/internasional
            </p>
          </div>
        )}

        {submitAttempted && checkIncomplete() && (
          <CustomAlert 
            type="error" 
            message="Mohon Lengkapi Semua Dokumen Sebelum Submit" 
            style={{ marginBottom: '2.5rem' }}
          />
        )}

        {data.jalurYudisium !== 'Non Cumlaude' && (data.skemaTambahan || []).map((skema, idx) => (
          <UploadSection 
            key={skema}
            title={SKEMA_CONFIG[skema]?.title}
            docs={SKEMA_CONFIG[skema]?.docs}
            berkasData={data.berkas}
            onFileChange={handleFileChange}
            sectionId={`1-${idx + 1}`}
            fileError={fileError}
          />
        ))}

        <UploadSection 
          title="LENGKAPI DOKUMEN WAJIB"
          docs={BERKAS_LIST}
          berkasData={data.berkas}
          onFileChange={handleFileChange}
          sectionId={`1-9`}
          fileError={fileError}
        />
      </div>

      <div className="footer-pagination-yudisium">
        <div className="nav-arrows">
          <button className="nav-arrow-btn" onClick={() => dispatch({ type: 'SET_STEP', value: 1 })}><BsChevronLeft /></button>
          <div className="page-numbers">
            <div className="page-number" onClick={() => dispatch({ type: 'SET_STEP', value: 1 })}>1</div>
            <div className="page-number active">2</div>
          </div>
          <button className="nav-arrow-btn" disabled><BsChevronRight /></button>
        </div>
        <button className="btn-submit-yudisium" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Step2Yudisium;
