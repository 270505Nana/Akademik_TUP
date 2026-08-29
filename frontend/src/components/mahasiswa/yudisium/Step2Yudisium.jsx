import React, { useRef, useState } from "react";
import { Check, UploadCloud, FileText, AlertTriangle, ChevronRight, Info, Download, X } from "lucide-react";
import { useYudisiumContext } from "../../../context/YudisiumFormContext";
import { SECTIONS } from "./YudisiumDocument";
import { uploadYudisiumRegistrationFile } from "../../../service/api";

const PreviewModal = ({ doc, onClose }) => {
  if (!doc) return null;
  
  const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.file?.type === 'application/pdf';

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, 
        zIndex: 9999, 
        background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: 16 
      }} 
      onClick={onClose}
    >
      <div 
        style={{ 
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 850, height: '88vh', 
          display: 'flex', flexDirection: 'column', overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} color="#C0182A" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Preview - {doc.fileName || doc.name}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 4 }}>
            <X size={22} />
          </button>
        </div>
        
        <div style={{ flex: 1, background: '#F8FAFC', overflow: 'auto', position: 'relative' }}>
          {isPdf ? (
            <iframe src={doc.fileUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Preview Dokumen" />
          ) : (
            <img src={doc.fileUrl} alt="Preview Dokumen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: 'auto', display: 'block', padding: 16 }} />
          )}
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end' }}>
          <a 
            href={doc.fileUrl} 
            download={doc.fileName || 'dokumen_yudisium'} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, 
              fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0', background: '#fff', 
              color: '#374151', textDecoration: 'none', transition: '0.2s', cursor: 'pointer' 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <Download size={16} /> Unduh Berkas
          </a>
        </div>
      </div>
    </div>
  );
};

const DocUploadPanel = ({ sectionTitle, documents, activeDocId, onSetActive, onUpload, onDropFile, onSave, isUploading, onPreview }) => {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const [isDragging, setIsDragging] = useState(false);

  if (!activeDoc) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFile(activeDoc.id, e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="doc-section-container" style={{ marginBottom: "4rem" }}>
      <h3 className="doc-path-title" style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "2rem", color: "#1a202c", textTransform: "uppercase" }}>
        {sectionTitle}
      </h3>

      <div className="doc-management-container">
        <div className="doc-sidebar">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              className={`doc-item ${activeDoc.id === doc.id ? "active" : ""} ${doc.status === "completed" ? "completed" : ""}`}
              onClick={() => onSetActive(doc.id)}
            >
              <div className="doc-number">
                {doc.status === "completed" ? <Check size={14} strokeWidth={3} /> : index + 1}
              </div>
              <span className="doc-name">{doc.name}</span>
            </button>
          ))}
        </div>

        <div className="doc-panel">
          <div className="doc-panel-header">
            <span style={{ fontWeight: 800 }}>{sectionTitle.split(' - ')[0]}</span>
            <ChevronRight size={16} />
            <span style={{ color: "var(--text-grey)" }}>{activeDoc.name}</span>
          </div>

          <div>
            {activeDoc.templateUrl && (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1.2rem 1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: "0.25rem", color: "#1E293B" }}>Unduh Template Dokumen</h4>
                  <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>Silahkan unduh dan isi template yang disediakan oleh admin.</p>
                </div>
                <a 
                  href={activeDoc.templateUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: '#fff', border: '1px solid #CBD5E1', padding: '8px 16px', borderRadius: '8px', color: '#334155', fontWeight: 600, fontSize: '14px', transition: '0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                >
                  <Download size={16} />
                  <span>Download</span>
                </a>
              </div>
            )}

            <h4 style={{ fontWeight: 700, marginBottom: "1.5rem" }}>Pilih file atau Tarik ke sini</h4>

            <div 
              style={{ 
                padding: "2.5rem 1rem", border: isDragging ? "2px dashed #c0182a" : "2px dashed #cbd5e1", borderRadius: "12px", textAlign: "center", cursor: "pointer", background: isDragging ? "#fff1f2" : "#f8fafc", transition: "0.2s" 
              }}
              onMouseEnter={(e) => { if(!isDragging) e.currentTarget.style.borderColor = "#c0182a" }}
              onMouseLeave={(e) => { if(!isDragging) e.currentTarget.style.borderColor = "#cbd5e1" }}
              onClick={() => onUpload(activeDoc.id)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud size={44} color={isDragging ? "#c0182a" : "#94a3b8"} style={{ margin: "0 auto 12px", transition: "0.2s" }} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#334155", marginBottom: '12px' }}>
                <span style={{ color: "#3182ce" }}>Pilih File</span> atau Tarik dan Lepaskan di sini
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: '#E2E8F0', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>PDF/JPG/PNG</span>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: '#E2E8F0', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>Max 3MB</span>
              </div>
            </div>

            {(activeDoc.fileUrl || activeDoc.error) && (
              <div style={{ marginTop: "2rem" }}>
                <h4 style={{ fontWeight: 700, marginBottom: "1rem" }}>File Terpilih</h4>
                {activeDoc.fileUrl ? (
                  <div className="file-card" style={{ padding: "1.5rem", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1, minWidth: 0 }}>
                      <div className="file-card-icon" style={{ width: "56px", height: "56px", borderRadius: "12px", flexShrink: 0 }}>
                        <FileText size={28} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                        <div className="file-name" style={{ fontSize: "1rem", marginBottom: "4px", lineHeight: "1.4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {activeDoc.fileName}
                        </div>
                        <div className="file-meta" style={{ fontSize: "0.85rem" }}>
                          {activeDoc.fileSize}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <button 
                        onClick={() => onPreview(activeDoc)} 
                        style={{ padding: "6px 12px", fontSize: "12px", fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: "6px", cursor: "pointer", transition: "0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#DBEAFE"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#EFF6FF"}
                      >
                        Lihat Preview
                      </button>
                      <div className="status-badge" style={{ padding: "6px 12px", fontSize: "12px", background: "#def7ec", color: "#03543f", fontWeight: 700 }}>
                        {activeDoc.status === "completed" ? "Tersimpan" : "Siap Upload"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="file-card" style={{ padding: "1.5rem", borderColor: "var(--error-red)", backgroundColor: "#fff5f5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1 }}>
                      <div className="file-card-icon" style={{ background: "transparent", color: "var(--error-red)", border: "2px solid var(--error-red)", borderRadius: "50%", width: "56px", height: "56px", flexShrink: 0 }}>
                        <AlertTriangle size={32} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="file-name" style={{ color: "var(--error-red)", fontWeight: 800, fontSize: "1.1rem" }}>Error: Gagal Memilih</div>
                        <div className="file-meta" style={{ color: "var(--error-red)" }}>{activeDoc.error}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ marginTop: "2rem" }}
              onClick={() => onSave(activeDoc.id)}
              disabled={isUploading || (!activeDoc.file && activeDoc.status === "completed")}
            >
              {isUploading 
                ? "Mengunggah..." 
                : activeDoc.file 
                  ? (activeDoc.status === "completed" ? "Simpan Perubahan File" : "Simpan Dokumen") 
                  : (activeDoc.status === "completed" ? "Sudah Diunggah" : "Simpan Dokumen")
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Step2Yudisium({ registrationId, studentInfo }) {
  const { state, dispatch } = useYudisiumContext();
  const { data, documents, activeDocIds } = state;
  
  const fileInputRef = useRef(null);
  const uploadTargetIdRef = useRef(null);
  const fileMapRef = useRef({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const getSectionDocs = (section) => documents.filter((d) => d.section === section);
  const wajibDocs = getSectionDocs(SECTIONS.WAJIB);

  const processFile = (file, targetId) => {
    if (!file || !targetId) return;

    if (file.size > 3 * 1024 * 1024) {
      dispatch({ type: "SET_DOCUMENT_ERROR", docId: targetId, error: "Ukuran file maksimal 3MB." });
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      dispatch({ type: "SET_DOCUMENT_ERROR", docId: targetId, error: "Format file harus PDF, JPG, JPEG, atau PNG." });
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    fileMapRef.current[targetId] = file;

    dispatch({ type: "UPLOAD_DOCUMENT", docId: targetId, fileUrl, fileName: file.name, fileSize });
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0], uploadTargetIdRef.current);
    e.target.value = ""; 
    uploadTargetIdRef.current = null;
  };

  const handleDropFile = (targetId, file) => {
    processFile(file, targetId);
  };

  const handleManualUpload = (targetId) => {
    dispatch({ type: "CLEAR_DOCUMENT_STATUS", docId: targetId });
    uploadTargetIdRef.current = targetId;
    fileInputRef.current.click();
  };

  const handleSaveDoc = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    const file = fileMapRef.current[docId];

    if (!doc?.fileUrl || !file) {
      alert("Silahkan pilih file terlebih dahulu sebelum menyimpan.");
      return;
    }

    if (!registrationId) {
      alert("ID Registrasi tidak ditemukan. Silakan kembali ke Step 1 dan klik Simpan.");
      return;
    }
    // Buat rename file, send ke BE nim-nama-slug
    const safeName = (studentInfo?.nama || "mahasiswa")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const safeNim = studentInfo?.nim || "0000000000";
    
    const extension = file.name.split('.').pop();
    
    const formattedFileName = `${safeNim}-${safeName}-${doc.slug}.${extension}`;

    const renamedFile = new File([file], formattedFileName, { type: file.type });


    try {
      setIsUploading(true);
      await uploadYudisiumRegistrationFile(registrationId, {
        file: renamedFile,       
        category: doc.slug,
        name: formattedFileName,  
      });
      dispatch({ type: "COMPLETE_DOCUMENT", docId });
    } catch (error) {
      console.error("Gagal upload dokumen:", error);
      alert("Gagal mengunggah dokumen. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = (section, docId) => {
    dispatch({ type: "SET_ACTIVE_DOC", section, value: docId });
  };

  const showJurnal = data.pengajuanCumlaude !== "Non Cumlaude" && data.skemaCumlaude.includes("Publikasi Jurnal");
  const showPameran = data.pengajuanCumlaude !== "Non Cumlaude" && data.skemaCumlaude.includes("Pameran");
  const showLomba = data.pengajuanCumlaude !== "Non Cumlaude" && data.skemaCumlaude.includes("Prestasi Lomba");
  const showHki = data.pengajuanCumlaude !== "Non Cumlaude" && data.skemaCumlaude.includes("HKI/Paten");

  return (
    <div className="step-content">
      <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
      
      <div className="info-banner" style={{ marginBottom: "3rem" }}>
        <div className="banner-icon-container"><Info color="#d69e2e" size={24} /></div>
        <div className="banner-content">
          <h4>Pemberitahuan Unggah Dokumen</h4>
          <p>Kamu dapat <strong>menyicil</strong> unggahan dokumen satu per satu. Klik "Simpan Dokumen" pada setiap file yang kamu pilih.</p>
        </div>
      </div>

      {wajibDocs.length > 0 && (
        <DocUploadPanel 
          sectionTitle={SECTIONS.WAJIB}
          documents={wajibDocs}
          activeDocId={activeDocIds[SECTIONS.WAJIB]}
          onSetActive={(id) => handleSetActive(SECTIONS.WAJIB, id)}
          onUpload={handleManualUpload}
          onDropFile={handleDropFile}
          onSave={handleSaveDoc}
          isUploading={isUploading}
          onPreview={(doc) => setPreviewDoc(doc)}
        />
      )}

      {showJurnal && (
        <DocUploadPanel 
          sectionTitle={SECTIONS.JURNAL}
          documents={getSectionDocs(SECTIONS.JURNAL)}
          activeDocId={activeDocIds[SECTIONS.JURNAL]}
          onSetActive={(id) => handleSetActive(SECTIONS.JURNAL, id)}
          onUpload={handleManualUpload}
          onDropFile={handleDropFile}
          onSave={handleSaveDoc}
          isUploading={isUploading}
          onPreview={(doc) => setPreviewDoc(doc)}
        />
      )}

      {showPameran && (
         <DocUploadPanel 
           sectionTitle={SECTIONS.PAMERAN}
           documents={getSectionDocs(SECTIONS.PAMERAN)}
           activeDocId={activeDocIds[SECTIONS.PAMERAN]}
           onSetActive={(id) => handleSetActive(SECTIONS.PAMERAN, id)}
           onUpload={handleManualUpload}
           onDropFile={handleDropFile}
           onSave={handleSaveDoc}
           isUploading={isUploading}
           onPreview={(doc) => setPreviewDoc(doc)}
         />
      )}

      {showLomba && (
         <DocUploadPanel 
           sectionTitle={SECTIONS.LOMBA}
           documents={getSectionDocs(SECTIONS.LOMBA)}
           activeDocId={activeDocIds[SECTIONS.LOMBA]}
           onSetActive={(id) => handleSetActive(SECTIONS.LOMBA, id)}
           onUpload={handleManualUpload}
           onDropFile={handleDropFile}
           onSave={handleSaveDoc}
           isUploading={isUploading}
           onPreview={(doc) => setPreviewDoc(doc)}
         />
      )}

      {showHki && (
         <DocUploadPanel 
           sectionTitle={SECTIONS.HKI}
           documents={getSectionDocs(SECTIONS.HKI)}
           activeDocId={activeDocIds[SECTIONS.HKI]}
           onSetActive={(id) => handleSetActive(SECTIONS.HKI, id)}
           onUpload={handleManualUpload}
           onDropFile={handleDropFile}
           onSave={handleSaveDoc}
           isUploading={isUploading}
           onPreview={(doc) => setPreviewDoc(doc)}
         />
      )}

      {data.minatWirausaha === "Ya" && (
         <DocUploadPanel 
           sectionTitle={SECTIONS.WIRAUSAHA}
           documents={getSectionDocs(SECTIONS.WIRAUSAHA)}
           activeDocId={activeDocIds[SECTIONS.WIRAUSAHA]}
           onSetActive={(id) => handleSetActive(SECTIONS.WIRAUSAHA, id)}
           onUpload={handleManualUpload}
           onDropFile={handleDropFile}
           onSave={handleSaveDoc}
           isUploading={isUploading}
           onPreview={(doc) => setPreviewDoc(doc)}
         />
      )}
    </div>
  );
}