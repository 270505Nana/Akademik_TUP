
import React, { useRef } from 'react';
import { Search, Info, Check, UploadCloud, FileText, AlertTriangle, Download, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { useSidangContext } from '../../context/SidangFormContext';
import { SECTIONS, PATH_MAP } from '../../requirement/sidangDocument';

const DocUploadPanel = ({ sectionTitle, sectionId, documents, activeDocId, onSetActive, onUpload, onSave, onUpdateLink, linkPaperValue, showLinkInput }) => {
  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  return (
    <div className="doc-section-container" style={{ marginBottom: '4rem' }}>
      <h3 className="doc-path-title" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem', color: '#1a202c', textTransform: 'uppercase' }}>
        {sectionTitle}
      </h3>
      
      <div className="doc-management-container">
        <div className="doc-sidebar">
          {documents.map((doc, index) => (
            <button 
              key={doc.id} 
              className={`doc-item ${activeDocId === doc.id ? 'active' : ''} ${doc.status === 'completed' ? 'completed' : ''}`}
              onClick={() => onSetActive(doc.id)}
            >
              <div className="doc-number">
                {doc.status === 'completed' ? <Check size={14} strokeWidth={3} /> : index + 1}
              </div>
              <span className="doc-name">{doc.name}</span>
            </button>
          ))}
        </div>

        <div className="doc-panel">
          <div className="doc-panel-header">
            <span style={{ fontWeight: 800 }}>{sectionTitle}</span>
            <ChevronRight size={16} />
            <span style={{ color: 'var(--text-grey)' }}>{activeDoc.name}</span>
          </div>

          <div style={{ border: '1px solid var(--border-grey)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Download Template</h4>
                   <p style={{ fontSize: '0.85rem' }}>Pada tahap ini kamu membutuhkan menggunakan template.<br/>Silahkan unduh dan isi template di samping ini.</p>
                </div>
                <button className="download-btn">
                   <Download size={16} />
                   <span>Download Template Disini</span>
                </button>
             </div>
          </div>

          <div>
             <h4 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Pilih file dan Upload disini</h4>
             <div className="upload-box" style={{ padding: '2rem' }} onClick={() => onUpload(activeDoc.id)}>
                <UploadCloud className="upload-icon" />
                <p className="upload-text-main">Drag and Drop or <span style={{ color: '#3182ce' }}>Choose File</span> To upload</p>
                <div className="upload-text-formats">
                  <span className="format-badge">PDF</span>
                  <span className="format-badge">JPG/PNG</span>
                  <span className="format-badge">Max 3MB</span>
                </div>
             </div>

             {(activeDoc.fileUrl || activeDoc.error) && (
               <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>File Terpilih</h4>
                  {activeDoc.fileUrl ? (
                    <div className="file-card" style={{ padding: '1.5rem', justifyContent: 'space-between' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                          <div className="file-card-icon" style={{ width: '56px', height: '56px', borderRadius: '12px' }}>
                             <FileText size={28} />
                          </div>
                          <div style={{ flex: 1 }}>
                             <div className="file-name" style={{ fontSize: '1rem', marginBottom: '4px', lineHeight: '1.4' }}>
                                {activeDoc.fileName}
                             </div>
                             <div className="file-meta" style={{ fontSize: '0.85rem' }}>
                                {activeDoc.fileSize} • {activeDoc.fileName.split('.').pop().toUpperCase()}
                             </div>
                          </div>
                       </div>
                       <div className="status-badge" style={{ padding: '4px 12px', fontSize: '0.85rem', background: '#def7ec', color: '#03543f' }}>
                          {activeDoc.status === 'completed' ? 'Tersimpan' : 'Siap'}
                       </div>
                    </div>
                  ) : (
                    <div className="file-card" style={{ padding: '1.5rem', borderColor: 'var(--error-red)', backgroundColor: '#fff5f5' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                          <div className="file-card-icon" style={{ background: 'transparent', color: 'var(--error-red)', border: '2px solid var(--error-red)', borderRadius: '50%', width: '56px', height: '56px' }}>
                             <AlertTriangle size={32} />
                          </div>
                          <div style={{ flex: 1 }}>
                             <div className="file-name" style={{ color: 'var(--error-red)', fontWeight: 800, fontSize: '1.1rem' }}>Error: Ukuran File</div>
                             <div className="file-meta" style={{ color: 'var(--error-red)' }}>{activeDoc.error}</div>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
             )}

             {showLinkInput && (
               <div className="input-group" style={{ marginTop: '2rem' }}>
                 <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>Link Paper (Opsional jika sudah terbit)</label>
                 <div className="input-with-icon">
                    <LinkIcon className="input-icon" size={18} />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Masukan Link Paper Anda"
                      value={linkPaperValue || ''}
                      onChange={(e) => onUpdateLink(e.target.value)}
                    />
                 </div>
               </div>
             )}

             <button 
              className="btn-primary" 
              style={{ marginTop: '2rem' }}
              onClick={() => onSave(activeDoc.id)}
             >
              Simpan dan Lanjutkan
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Step2() {
  const { state, dispatch } = useSidangContext();
  const { data, documents, activeDocIds } = state;
  const fileInputRef = useRef(null);
  const uploadTargetIdRef = useRef(null);

  // Filter documents by section
  const getSectionDocs = (section) => documents.filter(d => d.section === section);

  // Dokumen prasyarat Test Bahasa 
  const testBahasaDoc = documents.find(d => d.section === SECTIONS.WAJIB && d.name.includes('TEST BAHASA')) || documents[8];

  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const targetId = uploadTargetIdRef.current;
    
    if (!file || !targetId) {
      e.target.value = '';
      return;
    }

    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      dispatch({ 
        type: 'SET_DOCUMENT_ERROR', 
        docId: targetId, 
        error: `${file.name} melebihi batas 3MB.` 
      });
      e.target.value = '';
      uploadTargetIdRef.current = null;
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    dispatch({ 
      type: 'UPLOAD_DOCUMENT', 
      docId: targetId, 
      fileUrl, 
      fileName: file.name, 
      fileSize 
    });
    
    e.target.value = '';
    uploadTargetIdRef.current = null;
  };

  const handleManualUpload = (targetId) => {
    dispatch({ type: 'CLEAR_DOCUMENT_STATUS', docId: targetId });
    uploadTargetIdRef.current = targetId;
    fileInputRef.current.click();
  };

  const handleSaveDoc = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc?.fileUrl) {
      alert('Silahkan pilih file terlebih dahulu sebelum menyimpan.');
      return;
    }
    dispatch({ type: 'COMPLETE_DOCUMENT', docId });
  };

  const handleSetActive = (section, docId) => {
    dispatch({ type: 'SET_ACTIVE_DOC', section, value: docId });
  };

  return (
    <div className="step-content">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      <div className="step-title-container">
        <div className="step-label">Step 2</div>
        <h2 className="step-main-title">Pendaftaran Sidang Telkom University Purwokerto</h2>
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dokumen Test Bahasa Mahasiswa</h3>

      <div className="input-group" style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Apakah Test Bahasa Sudah Memenuhi Persyaratan <span style={{ color: 'var(--primary-red)' }}>Minimum 450</span></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div 
            className={`radio-item ${data.testBahasaPersyaratan === 'Sudah' ? 'active' : ''}`}
            onClick={() => updateField('testBahasaPersyaratan', 'Sudah')}
          >
            <div className="radio-visual"></div>
            <span>Sudah</span>
          </div>
          <div 
            className={`radio-item ${data.testBahasaPersyaratan === 'Belum' ? 'active' : ''}`}
            onClick={() => updateField('testBahasaPersyaratan', 'Belum')}
          >
            <div className="radio-visual"></div>
            <span>Belum</span>
          </div>
        </div>
        <span className="helper-text" style={{ color: 'var(--primary-red)', marginTop: '0.5rem' }}>
          *opsi belum hanya untuk mahasiswa yang jadwal retake diluar periode sidang dengan melampirkan jadwal retake test bahasa
        </span>
      </div>

      <div className="step2-top-grid" style={{ marginBottom: '4rem' }}>
        <div className="upload-container">
           <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>Unggah Dokumen Prasyarat</label>
           <div className="upload-box" onClick={() => handleManualUpload(testBahasaDoc.id)}>
              <UploadCloud className="upload-icon" />
              <p className="upload-text-main">Tarik & Lepas file di sini</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)', marginBottom: '1rem' }}>atau klik untuk memilih dari komputer</p>
              <div className="upload-text-formats">
                <span className="format-badge">PDF</span>
                <span className="format-badge">JPG/PNG</span>
                <span className="format-badge">Max 3MB</span>
              </div>
           </div>
        </div>

        <div className="selected-files-section">
           <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>File Terpilih</label>
           <div className="file-selected-list">
              {(testBahasaDoc.fileUrl || testBahasaDoc.error) ? (
                <>
                  {testBahasaDoc.fileUrl && (
                    <div className="file-card">
                       <div className="file-card-icon"><FileText size={20} /></div>
                       <div className="file-card-info">
                          <div className="file-name">{testBahasaDoc.fileName}</div>
                          <div className="file-meta">{testBahasaDoc.fileSize} • PDF</div>
                       </div>
                       <div className="status-badge" style={{ background: '#def7ec', color: '#03543f' }}>Siap</div>
                    </div>
                  )}
                  {testBahasaDoc.error && (
                    <div className="file-card" style={{ borderColor: 'var(--error-red)', backgroundColor: '#fff5f5' }}>
                       <div className="file-card-icon" style={{ color: 'var(--error-red)' }}>
                          <AlertTriangle size={20} />
                       </div>
                       <div className="file-card-info">
                          <div className="file-name" style={{ color: 'var(--error-red)', fontWeight: 700 }}>Error: Ukuran File</div>
                          <div className="file-meta" style={{ color: 'var(--error-red)' }}>{testBahasaDoc.error}</div>
                       </div>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-grey)', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada file terpilih.</p>
              )}
           </div>
        </div>
      </div>

      <div className="divider" style={{ borderTop: '1px solid var(--border-grey)', margin: '3rem 0' }}></div>

      {data.skema === 'Non Sidang' && data.jalurNonSidang && data.jalurNonSidang.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '3rem', color: '#2d3748' }}>
            SYARAT BERKAS EVIDENCE UNTUK JALUR SIDANG NON REGULER
          </h2>

          {data.jalurNonSidang.map((jalurName) => {
            const sectionId = PATH_MAP[jalurName];
            if (!sectionId) return null;
            
            return (
              <DocUploadPanel 
                key={sectionId}
                sectionTitle={jalurName}
                sectionId={sectionId}
                documents={getSectionDocs(sectionId)}
                activeDocId={activeDocIds[sectionId]}
                onSetActive={(id) => handleSetActive(sectionId, id)}
                onUpload={handleManualUpload}
                onSave={handleSaveDoc}
                onUpdateLink={(val) => updateField(`linkPaper${sectionId === SECTIONS.JURNAL ? 'Jurnal' : 'Proceeding'}`, val)}
                linkPaperValue={sectionId === SECTIONS.JURNAL ? data.linkPaperJurnal : data.linkPaperProceeding}
                showLinkInput={sectionId === SECTIONS.JURNAL || sectionId === SECTIONS.PROCEEDING}
              />
            );
          })}
        </>
      )}

      {/* layout berkas wajib sidang di bwh */}
      <div className="divider" style={{ borderTop: '2px solid #2d3748', margin: '4rem 0' }}></div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '3rem', color: '#2d3748' }}>
        SYARAT BERKAS WAJIB SIDANG
      </h2>

      <DocUploadPanel 
        sectionTitle="Berkas Wajib Sidang"
        sectionId={SECTIONS.WAJIB}
        documents={getSectionDocs(SECTIONS.WAJIB)}
        activeDocId={activeDocIds[SECTIONS.WAJIB]}
        onSetActive={(id) => handleSetActive(SECTIONS.WAJIB, id)}
        onUpload={handleManualUpload}
        onSave={handleSaveDoc}
        showLinkInput={false}
      />
    </div>
  );
}
