import React, { useRef, useState, useEffect } from "react";
import { Check, UploadCloud, FileText, AlertTriangle, ChevronRight, Info, Download, X, CheckCircle2, Loader } from "lucide-react";
import { useYudisiumContext } from "../../../context/YudisiumFormContext";
import { SECTIONS } from "./yudisiumDocument";
import api, { uploadYudisiumRegistrationFile, downloadFileFromUrl } from "../../../service/api";

const PreviewModal = ({ doc, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchBlob = async () => {
      if (!doc || !doc.fileUrl) return;

      if (doc.fileUrl.startsWith('blob:')) {
        setBlobUrl(doc.fileUrl);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const blobData = await downloadFileFromUrl(doc.fileUrl);
        if (active) {
          const url = URL.createObjectURL(blobData);
          setBlobUrl(url);
        }
      } catch (err) {
        if (active) {
          console.error("Gagal memuat preview:", err);
          setError("Sesi telah habis atau file tidak ditemukan.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchBlob();

    return () => {
      active = false;
      if (blobUrl && !blobUrl.startsWith('blob:') && doc?.fileUrl !== blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [doc]);

  if (!doc) return null;

  const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.fileUrl?.toLowerCase().includes('.pdf') || doc.file?.type === 'application/pdf';

  return (
    <div 
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} 
      onClick={onClose}
    >
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 850, height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <FileText size={18} color="#C0182A" style={{ flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Preview - {doc.fileName || doc.name}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 4, flexShrink: 0 }}><X size={22} /></button>
        </div>
        
        <div style={{ flex: 1, background: '#F8FAFC', overflow: 'auto', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#64748B' }}>
              <Loader size={30} style={{ color: '#DC2626', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <div>Memuat Dokumen...</div>
            </div>
          ) : error ? (
            <div style={{ color: '#DC2626', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
               <AlertTriangle size={32} />
               <span>{error}</span>
            </div>
          ) : blobUrl ? (
             isPdf ? (
              <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Preview Dokumen" />
            ) : (
              <img src={blobUrl} alt="Preview Dokumen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', padding: 16 }} />
            )
          ) : null}
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end' }}>
          <a 
            href={blobUrl || doc.fileUrl} 
            download={doc.fileName || 'dokumen_yudisium'} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', textDecoration: 'none', transition: '0.2s', cursor: 'pointer' }}
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

const TemplatePreviewModal = ({ blobUrl, title, mimeType, onClose, onDownload, isDownloading }) => {
  if (!blobUrl) return null;
  const isPdf = mimeType === 'application/pdf' || (title && title.toLowerCase().endsWith('.pdf'));

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 850, height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <FileText size={18} color="#C0182A" style={{ flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Preview Template - {title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 4 }}><X size={22} /></button>
        </div>
        <div style={{ flex: 1, background: '#F8FAFC', overflow: 'auto', position: 'relative' }}>
          {isPdf ? (
            <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Preview Template" />
          ) : (
            <img src={blobUrl} alt="Preview Template" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: 'auto', display: 'block', padding: 16 }} />
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onDownload} disabled={isDownloading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', cursor: isDownloading ? 'not-allowed' : 'pointer' }}>
            {isDownloading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />} {isDownloading ? 'Mengunduh...' : 'Unduh Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DocUploadPanel = ({ sectionTitle, documents, activeDocId, onSetActive, onUpload, onDropFile, onSave, isUploading, onPreview, isEditMode, showTemplateBox = true }) => {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const [isDragging, setIsDragging] = useState(false);

  const [templateState, setTemplateState] = useState({ isFetching: false, isDownloading: false, error: null });
  const [templateModal, setTemplateModal] = useState({ blobUrl: null, title: "", mimeType: null });

  if (!activeDoc) return null;

  const isRejected = isEditMode && activeDoc.isValid === false;
  const isReadOnly = isEditMode && activeDoc.fileUrl && !isRejected && !activeDoc.file;

  const hasLocalUploadError = activeDoc.error && !activeDoc.error.toLowerCase().includes("ditolak");

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isReadOnly && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFile(activeDoc.id, e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleCloseTemplateModal = () => {
    if (templateModal.blobUrl) URL.revokeObjectURL(templateModal.blobUrl);
    setTemplateModal({ blobUrl: null, title: "", mimeType: null });
  };

  const handlePreviewTemplate = async () => {
    const templateCode = activeDoc?.slug;
    if (!templateCode) return;

    setTemplateState({ isFetching: true, isDownloading: false, error: null });
    try {
      const res = await api.get(`/api/templates/preview/${templateCode}`, { responseType: 'blob' });
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      setTemplateModal({ blobUrl, title: activeDoc.name, mimeType: blob?.type || null });
      setTemplateState({ isFetching: false, isDownloading: false, error: null });
    } catch (err) {
      setTemplateState({ isFetching: false, isDownloading: false, error: "Template belum tersedia dari admin." });
    }
  };

  const handleDownloadTemplate = async () => {
    const templateCode = activeDoc?.slug;
    if (!templateCode || templateState.isDownloading) return;
    
    setTemplateState(prev => ({ ...prev, isDownloading: true, error: null }));
    try {
      const res = await api.get(`/api/templates/download/${templateCode}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      
      let filename = `Template_${activeDoc.name}.pdf`;
      const disposition = res.headers?.["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
         const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
         if (match && match[1]) filename = match[1].replace(/['"]/g, "").trim();
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setTemplateState(prev => ({ ...prev, error: "Gagal mengunduh template." }));
    } finally {
      setTemplateState(prev => ({ ...prev, isDownloading: false }));
    }
  };

  return (
    <div className="doc-section-container" style={{ marginBottom: "4rem" }}>
      <h3 className="doc-path-title" style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "1.5rem", color: "#1a202c", textTransform: "uppercase" }}>
        {sectionTitle}
      </h3>

      <div className="doc-management-container">
        <div className="doc-sidebar">
          {documents.map((doc, index) => {
            const docRejected = isEditMode && doc.isValid === false;
            return (
              <button
                key={doc.id}
                className={`doc-item ${activeDoc.id === doc.id ? "active" : ""} ${doc.status === "completed" ? "completed" : ""}`}
                style={docRejected ? { borderColor: '#FECACA', background: activeDoc.id === doc.id ? '#FEF2F2' : '#fff' } : {}}
                onClick={() => onSetActive(doc.id)}
              >
                <div className="doc-number" style={docRejected ? { background: '#DC2626', color: '#fff', borderColor: '#DC2626' } : {}}>
                  {docRejected ? <AlertTriangle size={14} /> : doc.status === "completed" ? <Check size={14} strokeWidth={3} /> : index + 1}
                </div>
                <span className="doc-name" style={docRejected ? { color: '#DC2626', fontWeight: 700 } : {}}>{doc.name}</span>
              </button>
            );
          })}
        </div>

        <div className="doc-panel">
          <div className="doc-panel-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="panel-header-main" style={{ fontWeight: 800, fontSize: '0.95rem' }}>{sectionTitle.split(' - ')[0]}</span>
            <ChevronRight className="panel-header-icon" size={14} style={{ flexShrink: 0 }} />
            <span className="panel-header-sub" style={{ color: "var(--text-grey)", fontSize: '0.95rem' }}>{activeDoc.name}</span>
          </div>

          <div>
            {showTemplateBox && (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#1E293B", fontSize: "1rem" }}>Dokumen Persyaratan</h4>
                    <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>Lihat contoh berkas sebagai panduan atau unduh template yang telah tersedia.</p>
                    {templateState.error && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: "#DC2626", marginTop: "0.75rem", fontSize: "0.8rem", fontWeight: 600, background: '#FEF2F2', padding: '6px 10px', borderRadius: 6, border: '1px solid #FECACA', width: 'fit-content' }}>
                        <AlertTriangle size={14} /> {templateState.error}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      onClick={handlePreviewTemplate}
                      disabled={templateState.isFetching}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid #CBD5E1', background: '#fff', color: '#334155', cursor: templateState.isFetching ? 'not-allowed' : 'pointer', transition: '0.2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={(e) => !templateState.isFetching && (e.currentTarget.style.background = '#F1F5F9')}
                      onMouseLeave={(e) => !templateState.isFetching && (e.currentTarget.style.background = '#fff')}
                    >
                      {templateState.isFetching ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
                      <span>{templateState.isFetching ? "Memuat..." : "Lihat & Unduh Dokumen Disini"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isRejected && !activeDoc.file && (
              <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <AlertTriangle size={18} color="#DC2626" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: "13px", color: "#991B1B", fontWeight: 700, marginBottom: "4px" }}>Perbaikan Diperlukan</div>
                  <div style={{ fontSize: "12px", color: "#B91C1C", lineHeight: "1.4" }}>Berkas yang kamu unggah sebelumnya ditolak. Silakan lihat catatan perbaikan di atas dan unggah dokumen yang baru.</div>
                </div>
              </div>
            )}

            {isReadOnly ? (
              <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", gap: "10px", alignItems: "center" }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <span style={{ fontSize: "13px", color: "#166534", fontWeight: 600 }}>Berkas ini sudah divalidasi dan disetujui. Tidak perlu diunggah ulang.</span>
              </div>
            ) : (
              <>
                <h4 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: '1rem' }}>Pilih file atau Tarik ke sini</h4>
                <div 
                  style={{ padding: "2rem 1rem", border: isDragging ? "2px dashed #c0182a" : "2px dashed #cbd5e1", borderRadius: "10px", textAlign: "center", cursor: "pointer", background: isDragging ? "#fff1f2" : "#f8fafc", transition: "0.2s", maxWidth: "600px" }}
                  onMouseEnter={(e) => { if(!isDragging) e.currentTarget.style.borderColor = "#c0182a" }}
                  onMouseLeave={(e) => { if(!isDragging) e.currentTarget.style.borderColor = "#cbd5e1" }}
                  onClick={() => onUpload(activeDoc.id)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud size={36} color={isDragging ? "#c0182a" : "#94a3b8"} style={{ margin: "0 auto 8px", transition: "0.2s" }} />
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: '10px' }}>
                    <span style={{ color: "#3182ce" }}>Pilih File</span> atau Tarik dan Lepaskan di sini
                  </p>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', padding: '3px 6px', background: '#E2E8F0', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>PDF/JPG/PNG</span>
                    <span style={{ fontSize: '10px', padding: '3px 6px', background: '#E2E8F0', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>Max 3MB</span>
                  </div>
                </div>
              </>
            )}

            {(activeDoc.fileUrl || activeDoc.fileName || activeDoc.error) && (
              <div style={{ marginTop: "1.5rem", maxWidth: "600px" }}>
                <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: '0.95rem' }}>
                  {isReadOnly ? "File yang Disetujui" : isRejected && !activeDoc.file ? "File Sebelumnya (Ditolak)" : "File Terpilih"}
                </h4>
                
                {(!hasLocalUploadError && (activeDoc.fileUrl || activeDoc.fileName)) ? (
                  <div className="file-card" style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", overflow: "hidden", gap: "1rem", border: "1px solid #E2E8F0", borderRadius: "10px", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div className="file-card-icon" style={{ width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
                        <FileText size={20} color="#64748B" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="file-name" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {activeDoc.fileName}
                        </div>
                        <div className="file-meta" style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          {activeDoc.fileSize || "File tersimpan"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="action-buttons-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button 
                        onClick={() => onPreview(activeDoc)} 
                        style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: "6px", cursor: "pointer", transition: "0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#DBEAFE"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#EFF6FF"}
                      >
                        Lihat Preview
                      </button>
                      
                      {activeDoc.isValid === true ? (
                         <div className="status-badge" style={{ padding: "5px 10px", fontSize: "11px", background: "#DCFCE7", color: "#15803D", fontWeight: 700, borderRadius: "6px", border: "1px solid #BBF7D0" }}>
                           Valid
                         </div>
                      ) : isRejected && !activeDoc.file ? (
                         <div className="status-badge" style={{ padding: "5px 10px", fontSize: "11px", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, borderRadius: "6px", border: "1px solid #FECACA" }}>
                           Ditolak
                         </div>
                      ) : activeDoc.status === "completed" ? (
                         <div className="status-badge" style={{ padding: "5px 10px", fontSize: "11px", background: "#F0FDF4", color: "#15803D", fontWeight: 700, borderRadius: "6px", border: "1px solid #BBF7D0" }}>
                           Tersimpan
                         </div>
                      ) : (
                         <div className="status-badge" style={{ padding: "5px 10px", fontSize: "11px", background: "#F1F5F9", color: "#475569", fontWeight: 700, borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                           Siap Upload
                         </div>
                      )}
                    </div>
                  </div>
                ) : hasLocalUploadError ? (
                  <div className="file-card" style={{ padding: "1rem", display: "flex", alignItems: "center", width: "100%", overflow: "hidden", gap: "1rem", border: "1px solid #FECACA", borderRadius: "10px", background: "#FEF2F2" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div className="file-card-icon" style={{ background: "transparent", color: "#DC2626", border: "2px solid #DC2626", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AlertTriangle size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="file-name" style={{ color: "#B91C1C", fontWeight: 800, fontSize: "0.85rem", marginBottom: "2px" }}>Error: Upload Dibatalkan</div>
                        <div className="file-meta" style={{ color: "#DC2626", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeDoc.error}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {!isReadOnly && (
              <button
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => onSave(activeDoc.id)}
                disabled={isUploading || activeDoc.status === "completed"}
              >
                {isUploading 
                  ? "Mengunggah..." 
                  : activeDoc.status === "completed" 
                    ? "Tersimpan" 
                    : "Simpan Dokumen"
                }
              </button>
            )}
          </div>
        </div>
      </div>

      <TemplatePreviewModal 
        blobUrl={templateModal.blobUrl} 
        title={templateModal.title} 
        mimeType={templateModal.mimeType} 
        onClose={handleCloseTemplateModal} 
        onDownload={handleDownloadTemplate} 
        isDownloading={templateState.isDownloading} 
      />
    </div>
  );
};

export default function Step2Yudisium({ registrationId, studentInfo, setFormAlert }) {
  const { state, dispatch } = useYudisiumContext();
  const { data, documents, activeDocIds } = state;
  
  const fileInputRef = useRef(null);
  const uploadTargetIdRef = useRef(null);
  const fileMapRef = useRef({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const isEditMode = !!data.isEdit;

  const getSectionDocs = (section) => documents.filter((d) => d.section === section);
  const wajibDocs = getSectionDocs(SECTIONS.WAJIB);

  const processFile = (file, targetId) => {
    if (!file || !targetId) return;
    setFormAlert(null); 

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

    dispatch({ type: "UPLOAD_DOCUMENT", docId: targetId, file: file, fileUrl, fileName: file.name, fileSize });
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
    setFormAlert(null);
    const doc = documents.find((d) => d.id === docId);
    const file = fileMapRef.current[docId];

    if (!doc?.fileUrl || !file) {
      setFormAlert({ type: "warning", title: "Peringatan", msg: "Silahkan pilih file terlebih dahulu sebelum menyimpan." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!registrationId) {
      setFormAlert({ type: "error", title: "Error", msg: "ID Registrasi tidak ditemukan. Silakan kembali ke Step 1 dan klik Simpan." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const safeNim = studentInfo?.nim || "0000000000";
    const extension = file.name.split('.').pop();
    
    let sectionName = "Evidence";
    if (doc.section === SECTIONS.WAJIB) sectionName = "KelengkapanDokYudisium";
    else if (doc.section === SECTIONS.JURNAL) sectionName = "EvidenceJurnal";
    else if (doc.section === SECTIONS.PAMERAN) sectionName = "EvidencePameran";
    else if (doc.section === SECTIONS.LOMBA) sectionName = "EvidenceLomba";
    else if (doc.section === SECTIONS.HKI) sectionName = "EvidenceHKI";
    else if (doc.section === SECTIONS.WIRAUSAHA) sectionName = "EvidenceWirausaha";

    const formattedFileName = `${safeNim}_${sectionName}_${doc.slug}.${extension}`;
    const renamedFile = new File([file], formattedFileName, { type: file.type });

    try {
      setIsUploading(true);
      await uploadYudisiumRegistrationFile(registrationId, {
        file: renamedFile,       
        slug: doc.slug, 
        name: formattedFileName,  
      });
      dispatch({ type: "COMPLETE_DOCUMENT", docId });
      
      setFormAlert({ type: "success", title: "Berhasil", msg: `File "${formattedFileName}" berhasil diunggah.` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Gagal upload dokumen:", error);
      setFormAlert({ type: "error", title: "Gagal Mengunggah", msg: "Gagal mengunggah dokumen. Silakan coba lagi." });
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
      
      <div className="info-banner" style={{ marginBottom: "2rem" }}>
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
          isEditMode={isEditMode}
          showTemplateBox={true}
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
          isEditMode={isEditMode}
          showTemplateBox={true}
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
           isEditMode={isEditMode}
           showTemplateBox={true}
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
           isEditMode={isEditMode}
           showTemplateBox={true}
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
           isEditMode={isEditMode}
           showTemplateBox={true}
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
           isEditMode={isEditMode}
           showTemplateBox={true}
         />
      )}

      <style>{`
        .doc-management-container {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }
        .doc-sidebar {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .doc-panel {
          flex: 1;
          min-width: 0;
        }
        
        @media (max-width: 991px) {
          .doc-management-container {
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          .doc-sidebar {
            width: 100% !important;
            max-height: 240px;
            overflow-y: auto;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 8px;
            background: #fff;
          }
          .doc-panel {
            width: 100% !important;
          }
        }

        @media (max-width: 576px) {
          .file-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .file-card .action-buttons-wrap {
            width: 100% !important;
            justify-content: flex-end !important;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
          }
          .doc-panel-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
          .panel-header-icon {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}