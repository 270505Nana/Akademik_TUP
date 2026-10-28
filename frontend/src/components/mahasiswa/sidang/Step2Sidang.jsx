import React, { useRef, useState, useEffect } from "react";
import {
  Check,
  UploadCloud,
  FileText,
  AlertTriangle,
  ChevronRight,
  Info,
  Download,
  X,
  Link as LinkIcon,
  CheckCircle2,
  Loader,
} from "lucide-react";
import { useSidangContext } from "../../../context/SidangFormContext";
import { SECTIONS, PATH_MAP } from "../../../requirement/sidangDocument";
import {
  uploadSidangRegistrationFile,
  downloadFileFromUrl,
} from "../../../service/api";
import {
  fetchTemplatePreviewBlob,
  triggerTemplateDownload,
} from "../../../service/sidangTemplateHandler";
import FilePreviewModal from "./FilePreviewModal";
import CustomAlert from "../../common/CustomAlert";

/* ------------------------------------------------------------------ */
/* Modal preview untuk file yang sudah dipilih / tersimpan di server   */
/* ------------------------------------------------------------------ */
const PreviewModal = ({ doc, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doc || !doc.fileUrl) return undefined;

    let active = true;
    let createdUrl = null;

    // File lokal (baru dipilih) sudah berupa blob URL
    if (doc.fileUrl.startsWith("blob:")) {
      setBlobUrl(doc.fileUrl);
      setMimeType(null);
      setError(null);
      return undefined;
    }

    const fetchBlob = async () => {
      setIsLoading(true);
      setError(null);
      setBlobUrl(null);
      try {
        const blobData = await downloadFileFromUrl(doc.fileUrl);
        if (!active) return;
        createdUrl = URL.createObjectURL(blobData);
        setBlobUrl(createdUrl);
        setMimeType(blobData?.type || null);
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
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [doc]);

  if (!doc) return null;

  const isPdf =
    mimeType === "application/pdf" ||
    doc.fileName?.toLowerCase().endsWith(".pdf") ||
    doc.fileUrl?.toLowerCase().includes(".pdf");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 850,
          height: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <FileText size={18} color="#C0182A" style={{ flexShrink: 0 }} />
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 800,
                color: "#0F172A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Preview - {doc.fileName || doc.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              padding: 4,
              flexShrink: 0,
            }}
          >
            <X size={22} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            background: "#F8FAFC",
            overflow: "auto",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: "center", color: "#64748B" }}>
              <Loader
                size={30}
                style={{ color: "#DC2626", animation: "spin 1s linear infinite", margin: "0 auto 10px" }}
              />
              <div>Memuat Dokumen...</div>
            </div>
          ) : error ? (
            <div
              style={{
                color: "#DC2626",
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <AlertTriangle size={32} />
              <span>{error}</span>
            </div>
          ) : blobUrl ? (
            isPdf ? (
              <iframe
                src={blobUrl}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                title="Preview Dokumen"
              />
            ) : (
              <img
                src={blobUrl}
                alt="Preview Dokumen"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  padding: 16,
                }}
              />
            )
          ) : null}
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            background: "#FAFAFA",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <a
            href={blobUrl || doc.fileUrl}
            download={doc.fileName || "dokumen_sidang"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              border: "1px solid #E2E8F0",
              background: "#fff",
              color: "#374151",
              textDecoration: "none",
              transition: "0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            <Download size={16} /> Unduh Berkas
          </a>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Panel upload per section (sidebar daftar berkas + panel kanan)      */
/* ------------------------------------------------------------------ */
const DocUploadPanel = ({
  sectionTitle,
  documents = [],
  activeDocId,
  onSetActive,
  onUpload,
  onDropFile,
  onSave,
  onPreview,
  onUpdateLink,
  linkPaperValue,
  showLinkInput = false,
  showTemplateBox = true,
  isUploading,
  isLoading = false,
  readOnly = false,
  panelAlert = null,
}) => {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const [isDragging, setIsDragging] = useState(false);

  // State untuk alur preview template via modal in-page
  const [templateState, setTemplateState] = useState({
    isFetching: false,
    isDownloading: false,
    previewedDocId: null,
    error: null,
  });
  const [templateModal, setTemplateModal] = useState({
    blobUrl: null,
    blob: null,
    title: "",
    mimeType: null,
  });

  // Reset state template saat user berpindah ke dokumen lain
  useEffect(() => {
    if (templateState.previewedDocId && templateState.previewedDocId !== activeDoc?.id) {
      setTemplateState({ isFetching: false, isDownloading: false, previewedDocId: null, error: null });
    }
  }, [activeDoc?.id]);

  const handleCloseTemplateModal = () => {
    if (templateModal.blobUrl) URL.revokeObjectURL(templateModal.blobUrl);
    setTemplateModal({ blobUrl: null, blob: null, title: "", mimeType: null });
  };

  const handlePreviewTemplate = async () => {
    const templateCode = activeDoc?.templateCode || activeDoc?.slug;
    if (!templateCode) {
      setTemplateState((prev) => ({ ...prev, error: "Template untuk dokumen ini belum tersedia." }));
      return;
    }
    setTemplateState((prev) => ({ ...prev, isFetching: true, error: null }));
    try {
      const { blob, name } = await fetchTemplatePreviewBlob(templateCode);
      const blobUrl = URL.createObjectURL(blob);
      setTemplateModal({ blobUrl, blob, title: name || activeDoc.name, mimeType: blob?.type || null });
      setTemplateState({ isFetching: false, isDownloading: false, previewedDocId: activeDoc.id, error: null });
    } catch (err) {
      const isNotFound =
        err?.response?.status === 404 ||
        err?.message === "URL preview tidak tersedia untuk template ini" ||
        err?.message === "Template tidak ditemukan";
      setTemplateState((prev) => ({
        ...prev,
        isFetching: false,
        error: isNotFound
          ? "Template untuk dokumen ini belum diunggah oleh admin."
          : "Gagal memuat template. Silakan coba lagi.",
      }));
    }
  };

  const handleDownloadTemplate = async () => {
    const templateCode = activeDoc?.templateCode || activeDoc?.slug;
    if (!templateCode || templateState.isDownloading) return;
    setTemplateState((prev) => ({ ...prev, isDownloading: true, error: null }));
    try {
      await triggerTemplateDownload(templateCode);
    } catch (err) {
      const isNotFound =
        err?.response?.status === 404 ||
        err?.message === "Download URL tidak ditemukan dalam response." ||
        err?.message === "Template tidak ditemukan";
      setTemplateState((prev) => ({
        ...prev,
        error: isNotFound
          ? "Template untuk dokumen ini belum diunggah oleh admin."
          : "Gagal mengunduh template. Silakan coba lagi.",
      }));
    } finally {
      setTemplateState((prev) => ({ ...prev, isDownloading: false }));
    }
  };

  const isPreviewReady = templateState.previewedDocId === activeDoc?.id;

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div className="doc-section-container" style={{ marginBottom: "4rem" }}>
        <h3
          className="doc-path-title"
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            marginBottom: "1.5rem",
            color: "#1a202c",
            textTransform: "uppercase",
          }}
        >
          {sectionTitle}
        </h3>
        <div
          style={{
            padding: "3rem 2rem",
            background: "#F8FAFC",
            borderRadius: "12px",
            border: "1.5px dashed #CBD5E1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            minHeight: "220px",
            color: "#64748B",
            textAlign: "center",
          }}
        >
          <Loader size={28} style={{ color: "#C0182A", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: "14px", fontWeight: 700, margin: "0.25rem 0 0", color: "#1E293B" }}>
            Memuat Berkas Persyaratan...
          </p>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Mengambil daftar persyaratan dan template terbaru dari server.
          </span>
        </div>
      </div>
    );
  }

  if (!activeDoc) return null;

  const isVerified = activeDoc.isValid === true;
  const isRejected = activeDoc.isValid === false;
  const hasFile = Boolean(
    activeDoc.fileUrl || activeDoc.fileName || activeDoc.downloadUrl || activeDoc.status === "completed",
  );
  const canPreview = Boolean(activeDoc.fileUrl || activeDoc.downloadUrl);
  const showUploadArea = !readOnly && !isVerified;

  const handleDragOver = (e) => {
    e.preventDefault();
    if (showUploadArea) setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (showUploadArea && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFile(activeDoc.id, e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="doc-section-container" style={{ marginBottom: "4rem" }}>
      <h3
        className="doc-path-title"
        style={{
          fontSize: "1.4rem",
          fontWeight: 800,
          marginBottom: "1.5rem",
          color: "#1a202c",
          textTransform: "uppercase",
        }}
      >
        {sectionTitle}
      </h3>

      <div className="doc-management-container">
        {/* Kolom kiri: daftar berkas */}
        <div className="doc-sidebar">
          {documents.map((doc, index) => {
            const docRejected = doc.isValid === false;
            const isCurrent = activeDoc.id === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                className={`doc-item ${isCurrent ? "active" : ""} ${doc.status === "completed" ? "completed" : ""}`}
                style={
                  docRejected
                    ? { borderColor: "#FECACA", background: isCurrent ? "#FEF2F2" : "#fff" }
                    : {}
                }
                onClick={() => onSetActive(doc.id)}
              >
                <div
                  className="doc-number"
                  style={docRejected ? { background: "#DC2626", color: "#fff", borderColor: "#DC2626" } : {}}
                >
                  {docRejected ? (
                    <AlertTriangle size={14} />
                  ) : doc.status === "completed" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="doc-name" style={docRejected ? { color: "#DC2626", fontWeight: 700 } : {}}>
                  {doc.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Kolom kanan: panel upload */}
        <div className="doc-panel">
          <div
            className="doc-panel-header"
            style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
          >
            <span className="panel-header-main" style={{ fontWeight: 800, fontSize: "0.95rem" }}>
              {sectionTitle.split(" - ")[0]}
            </span>
            <ChevronRight className="panel-header-icon" size={14} style={{ flexShrink: 0 }} />
            <span className="panel-header-sub" style={{ color: "var(--text-grey)", fontSize: "0.95rem" }}>
              {activeDoc.name}
            </span>
          </div>

          <div>
            {/* Alert hasil simpan dokumen */}
            {panelAlert && panelAlert.section === activeDoc.section && (
              <div style={{ marginBottom: "1.25rem" }}>
                <CustomAlert type={panelAlert.type} message={panelAlert.msg} />
              </div>
            )}

            {/* Kotak template */}
            {showTemplateBox && (
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <h4 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#1E293B", fontSize: "1rem" }}>
                      Dokumen Persyaratan
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                      Lihat contoh berkas sebagai panduan atau unduh template yang telah tersedia.
                    </p>
                    {templateState.error && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#DC2626",
                          marginTop: "0.75rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background: "#FEF2F2",
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #FECACA",
                          width: "fit-content",
                        }}
                      >
                        <AlertTriangle size={14} /> {templateState.error}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={handlePreviewTemplate}
                      disabled={templateState.isFetching}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        border: "1px solid #CBD5E1",
                        background: "#fff",
                        color: "#334155",
                        cursor: templateState.isFetching ? "not-allowed" : "pointer",
                        transition: "0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => !templateState.isFetching && (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={(e) => !templateState.isFetching && (e.currentTarget.style.background = "#fff")}
                    >
                      {templateState.isFetching ? (
                        <Loader size={16} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <FileText size={16} />
                      )}
                      <span>{templateState.isFetching ? "Memuat..." : "Lihat & Unduh Dokumen Disini"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifikasi berkas ditolak admin */}
            {isRejected && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <AlertTriangle size={18} color="#DC2626" style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "13px", color: "#991B1B", fontWeight: 700, marginBottom: "4px" }}>
                    Perbaikan Diperlukan
                  </div>
                  <div style={{ fontSize: "12px", color: "#B91C1C", lineHeight: "1.4" }}>
                    Admin menandai berkas ini perlu diperbaiki. Silakan unggah berkas yang baru.
                  </div>
                </div>
              </div>
            )}

            {/* Notifikasi berkas terverifikasi / form terkunci, atau area upload */}
            {isVerified ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" />
                <span style={{ fontSize: "13px", color: "#166534", fontWeight: 600 }}>
                  Berkas ini sudah divalidasi dan disetujui. Tidak perlu diunggah ulang.
                </span>
              </div>
            ) : readOnly ? (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <Info size={18} color="#64748B" />
                <span style={{ fontSize: "13px", color: "#475569", fontWeight: 600 }}>
                  Pendaftaran sudah dikirim, berkas tidak dapat diubah.
                </span>
              </div>
            ) : (
              <>
                <h4 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1rem" }}>
                  Pilih file atau Tarik ke sini
                </h4>
                <div
                  style={{
                    padding: "2rem 1rem",
                    border: isDragging ? "2px dashed #c0182a" : "2px dashed #cbd5e1",
                    borderRadius: "10px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: isDragging ? "#fff1f2" : "#f8fafc",
                    transition: "0.2s",
                    maxWidth: "600px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDragging) e.currentTarget.style.borderColor = "#c0182a";
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragging) e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onClick={() => onUpload(activeDoc.id)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud
                    size={36}
                    color={isDragging ? "#c0182a" : "#94a3b8"}
                    style={{ margin: "0 auto 8px", display: "block", transition: "0.2s" }}
                  />
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "10px" }}>
                    <span style={{ color: "#3182ce" }}>Pilih File</span> atau Tarik dan Lepaskan di sini
                  </p>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "3px 6px",
                        background: "#E2E8F0",
                        borderRadius: "4px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      PDF/JPG/PNG
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "3px 6px",
                        background: "#E2E8F0",
                        borderRadius: "4px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Max 3MB
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Kartu file terpilih / error */}
            {(hasFile || activeDoc.error) && (
              <div style={{ marginTop: "1.5rem", maxWidth: "600px" }}>
                <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem" }}>
                  {isVerified
                    ? "File yang Disetujui"
                    : isRejected
                      ? "File Sebelumnya (Perlu Revisi)"
                      : "File Terpilih"}
                </h4>

                {!activeDoc.error && hasFile ? (
                  <div
                    className="file-card"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      overflow: "hidden",
                      gap: "1rem",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div
                        className="file-card-icon"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "8px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#F8FAFC",
                        }}
                      >
                        <FileText size={20} color="#64748B" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="file-name"
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#1E293B",
                            marginBottom: "2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {activeDoc.fileName || activeDoc.name}
                        </div>
                        <div className="file-meta" style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          {activeDoc.fileSize || "File tersimpan"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="action-buttons-wrap"
                      style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}
                    >
                      {canPreview && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreview({ ...activeDoc, fileUrl: activeDoc.fileUrl || activeDoc.downloadUrl })
                          }
                          style={{
                            padding: "5px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#DBEAFE")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                        >
                          Lihat Preview
                        </button>
                      )}

                      {isVerified ? (
                        <div
                          className="status-badge"
                          style={{
                            padding: "5px 10px",
                            fontSize: "11px",
                            background: "#DCFCE7",
                            color: "#15803D",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "1px solid #BBF7D0",
                          }}
                        >
                          Valid
                        </div>
                      ) : activeDoc.status === "completed" ? (
                        <div
                          className="status-badge"
                          style={{
                            padding: "5px 10px",
                            fontSize: "11px",
                            background: "#F0FDF4",
                            color: "#15803D",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "1px solid #BBF7D0",
                          }}
                        >
                          Tersimpan
                        </div>
                      ) : (
                        <div
                          className="status-badge"
                          style={{
                            padding: "5px 10px",
                            fontSize: "11px",
                            background: "#F1F5F9",
                            color: "#475569",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          Siap Upload
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeDoc.error ? (
                  <div
                    className="file-card"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      overflow: "hidden",
                      gap: "1rem",
                      border: "1px solid #FECACA",
                      borderRadius: "10px",
                      background: "#FEF2F2",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div
                        className="file-card-icon"
                        style={{
                          background: "transparent",
                          color: "#DC2626",
                          border: "2px solid #DC2626",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AlertTriangle size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="file-name"
                          style={{ color: "#B91C1C", fontWeight: 800, fontSize: "0.85rem", marginBottom: "2px" }}
                        >
                          Error: Upload Dibatalkan
                        </div>
                        <div className="file-meta" style={{ color: "#DC2626", fontSize: "0.75rem" }}>
                          {activeDoc.error}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Input link paper (jalur jurnal / proceeding) */}
            {showLinkInput && (
              <div className="sidang-input-group" style={{ marginTop: "1.5rem", maxWidth: "600px" }}>
                <label>Link Paper (Opsional jika sudah terbit)</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <LinkIcon size={16} color="#94A3B8" style={{ position: "absolute", left: "12px" }} />
                  <input
                    type="text"
                    className="sidang-input-field"
                    placeholder="Masukan Link Paper Anda"
                    style={{ paddingLeft: "36px" }}
                    value={linkPaperValue || ""}
                    onChange={(e) => onUpdateLink(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}

            {/* Tombol simpan dokumen */}
            {showUploadArea && activeDoc.status !== "completed" && (
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "1.5rem" }}
                onClick={() => onSave(activeDoc.id)}
                disabled={isUploading}
              >
                {isUploading ? "Mengunggah..." : "Simpan Dokumen"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal preview template */}
      <FilePreviewModal
        blobUrl={templateModal.blobUrl}
        blob={templateModal.blob}
        title={templateModal.title}
        mimeType={templateModal.mimeType}
        onClose={handleCloseTemplateModal}
        onDownload={isPreviewReady ? handleDownloadTemplate : null}
        isDownloading={templateState.isDownloading}
      />
    </div>
  );
};

const buildSidangFileName = (doc, file, nim) => {
  const extension = file.name.split(".").pop();
  let sectionName = "Evidence";
  if (doc.section === SECTIONS.WAJIB) sectionName = "KelengkapanDokSidang";
  else if (doc.section === SECTIONS.TEST_BAHASA_SUDAH || doc.section === SECTIONS.TEST_BAHASA_BELUM) sectionName = "EvidenceTestBahasa";
  else if (doc.section === SECTIONS.JURNAL) sectionName = "EvidenceJurnal";
  else if (doc.section === SECTIONS.PROCEEDING) sectionName = "EvidenceProceeding";
  return `${nim}_${sectionName}_${doc.slug}.${extension}`;
};

/* ------------------------------------------------------------------ */
/* Step 2 Sidang                                                       */
/* ------------------------------------------------------------------ */
export default function Step2({
  registrationId,
  isTemplatesLoading = false,
  readOnly = false,
  setFormAlert, // opsional: kalau tidak dikirim, fallback ke alert() bawaan browser
  studentInfo,
}) {
  const { state, dispatch } = useSidangContext();
  const { data, documents, activeDocIds } = state;
  const fileInputRef = useRef(null);
  const uploadTargetIdRef = useRef(null);
  const fileMapRef = useRef({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // State alert lokal di dalam panel kanan
  const [panelAlert, setPanelAlert] = useState(null); // { section, type, msg }
  const alertTimerRef = useRef(null);

  const showPanelAlert = (section, type, msg) => {
    clearTimeout(alertTimerRef.current);
    setPanelAlert({ section, type, msg });
    if (type === "success") {
      alertTimerRef.current = setTimeout(() => setPanelAlert(null), 4000);
    }
  };

  useEffect(() => () => clearTimeout(alertTimerRef.current), []);

  const getSectionDocs = (section) => documents.filter((d) => d.section === section);

  const updateField = (field, value) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const notify = (type, title, msg) => {
    if (typeof setFormAlert === "function") {
      setFormAlert({ type, title, msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (type !== "success") {
      alert(msg);
    }
  };

  const processFile = (file, targetId) => {
    if (!file || !targetId) return;
    if (typeof setFormAlert === "function") setFormAlert(null);
    setPanelAlert(null);

    if (file.size > 3 * 1024 * 1024) {
      dispatch({ type: "SET_DOCUMENT_ERROR", docId: targetId, error: `${file.name} melebihi batas 3MB.` });
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      dispatch({
        type: "SET_DOCUMENT_ERROR",
        docId: targetId,
        error: "Format file harus PDF, JPG, JPEG, atau PNG.",
      });
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    fileMapRef.current[targetId] = file;

    dispatch({
      type: "UPLOAD_DOCUMENT",
      docId: targetId,
      file,
      fileUrl,
      fileName: file.name,
      fileSize,
    });
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0], uploadTargetIdRef.current);
    e.target.value = "";
    uploadTargetIdRef.current = null;
  };

  const handleDropFile = (targetId, file) => {
    if (readOnly) return;
    dispatch({ type: "CLEAR_DOCUMENT_STATUS", docId: targetId });
    processFile(file, targetId);
  };

  const handleManualUpload = (targetId) => {
    if (readOnly) return;
    dispatch({ type: "CLEAR_DOCUMENT_STATUS", docId: targetId });
    uploadTargetIdRef.current = targetId;
    fileInputRef.current.click();
  };

  const handleSetActive = (section, docId) => {
    dispatch({ type: "SET_ACTIVE_DOC", section, value: docId });
  };

  const handleSaveDoc = async (docId) => {
    if (typeof setFormAlert === "function") setFormAlert(null);
    const doc = documents.find((d) => d.id === docId);
    const file = fileMapRef.current[docId];

    if (!doc?.fileUrl || !file) {
      showPanelAlert(doc?.section, "warning", "Silahkan pilih file terlebih dahulu sebelum menyimpan.");
      return;
    }

    if (!registrationId) {
      showPanelAlert(doc.section, "error", "Data pendaftaran sidang belum tersedia.");
      return;
    }

    if (!doc.slug) {
      showPanelAlert(doc.section, "error", "Slug dokumen belum tersedia.");
      return;
    }

    const nim = studentInfo?.nim;
    if (!nim || nim === "-") {
      showPanelAlert(doc.section, "error", "NIM belum tersedia. Silakan refresh halaman.");
      return;
    }
    const formattedFileName = buildSidangFileName(doc, file, nim);
    const renamedFile = new File([file], formattedFileName, { type: file.type });

    try {
      setIsUploading(true);
      await uploadSidangRegistrationFile(registrationId, {
        file: renamedFile,
        slug: doc.slug,
        name: formattedFileName,
      });
      const nowIso = new Date().toISOString();
      const docName = doc.name || doc.fileName || file.name;
      dispatch({ type: "COMPLETE_DOCUMENT", docId, docName, uploadedAt: nowIso });
      showPanelAlert(doc.section, "success", `File "${doc.fileName || file.name}" berhasil diunggah.`);

      // Otomatis pindah ke berkas berikutnya dalam section yang sama
      const sectionDocs = documents.filter((d) => d.section === doc.section);
      const currentIndex = sectionDocs.findIndex((d) => d.id === docId);
      if (currentIndex !== -1 && currentIndex < sectionDocs.length - 1) {
        handleSetActive(doc.section, sectionDocs[currentIndex + 1].id);
      }
    } catch (error) {
      console.error("Gagal upload dokumen:", error);
      showPanelAlert(doc.section, "error", "Gagal mengunggah dokumen. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const commonPanelProps = {
    onUpload: handleManualUpload,
    onDropFile: handleDropFile,
    onSave: handleSaveDoc,
    onPreview: (doc) => setPreviewDoc(doc),
    isUploading,
    isLoading: isTemplatesLoading,
    readOnly,
    panelAlert,
  };

  return (
    <div className="step-content">
      <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {!readOnly && (
        <div className="info-banner" style={{ marginBottom: "2rem" }}>
          <div className="banner-icon-container">
            <Info color="#d69e2e" size={24} />
          </div>
          <div className="banner-content">
            <h4>Pemberitahuan Unggah Dokumen</h4>
            <p>
              Mahasiswa dapat mengunggah dokumen <strong> secara bertahap.</strong> Pastikan untuk mengeklik tombol “Simpan Dokumen” pada setiap dokumen yang diunggah agar dokumen tersimpan dengan baik.
            </p>
          </div>
        </div>
      )}

      {/* Section 1: Test Bahasa */}
      <section className="form-section" style={{ marginBottom: "2.5rem" }}>
        <div className="sidang-section-head">
          <h3>Dokumen Test Bahasa Mahasiswa</h3>
        </div>

        <div className="sidang-input-group" style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B", margin: "0 0 12px" }}>
            Apakah Test Bahasa Sudah Memenuhi Persyaratan{" "}
            <span style={{ color: "#C0182A", fontWeight: 700 }}>Minimum 450</span>?
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
            {["Sudah", "Belum"].map((opt) => {
              const isSelected = data.testBahasaPersyaratan === opt;
              return (
                <div
                  key={opt}
                  onClick={() => !readOnly && updateField("testBahasaPersyaratan", opt)}
                  style={{
                    flex: "1 1 180px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    border: `1.5px solid ${isSelected ? "#C0182A" : "#E2E8F0"}`,
                    borderRadius: "8px",
                    cursor: readOnly ? "not-allowed" : "pointer",
                    background: isSelected ? "#FFF5F5" : "#F8FAFC",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: isSelected ? "#C0182A" : "#1E293B",
                    opacity: readOnly ? 0.75 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `1.5px solid ${isSelected ? "#C0182A" : "#CBD5E1"}`,
                      background: isSelected ? "#C0182A" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                    )}
                  </div>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: "12px", color: "#C0182A", fontStyle: "italic" }}>
            *opsi belum hanya untuk mahasiswa yang jadwal retake diluar periode sidang dengan melampirkan jadwal
            retake test bahasa
          </span>
        </div>

        {data.testBahasaPersyaratan === "Sudah" && (
          <DocUploadPanel
            {...commonPanelProps}
            sectionTitle="Dokumen Persyaratan Test Bahasa"
            documents={getSectionDocs(SECTIONS.TEST_BAHASA_SUDAH)}
            activeDocId={activeDocIds[SECTIONS.TEST_BAHASA_SUDAH]}
            onSetActive={(id) => handleSetActive(SECTIONS.TEST_BAHASA_SUDAH, id)}
            showLinkInput={false}
            showTemplateBox={false}
          />
        )}

        {data.testBahasaPersyaratan === "Belum" && (
          <DocUploadPanel
            {...commonPanelProps}
            sectionTitle="Dokumen Persyaratan Test Bahasa (Belum Memenuhi)"
            documents={getSectionDocs(SECTIONS.TEST_BAHASA_BELUM)}
            activeDocId={activeDocIds[SECTIONS.TEST_BAHASA_BELUM]}
            onSetActive={(id) => handleSetActive(SECTIONS.TEST_BAHASA_BELUM, id)}
            showLinkInput={false}
          />
        )}
      </section>

      {/* Section 2: Evidence jalur Non Sidang */}
      {data.sidangScheme === "Non Sidang" && data.jalurNonSidang && data.jalurNonSidang.length > 0 && (
        <section className="form-section" style={{ marginBottom: "2.5rem" }}>
          <div className="sidang-section-head">
            <h3>Syarat Berkas Evidence untuk Jalur Sidang Non Reguler</h3>
          </div>

          {data.jalurNonSidang.map((jalurName) => {
            const sectionId = PATH_MAP[jalurName];
            if (!sectionId) return null;

            return (
              <DocUploadPanel
                {...commonPanelProps}
                key={sectionId}
                sectionTitle={jalurName}
                documents={getSectionDocs(sectionId)}
                activeDocId={activeDocIds[sectionId]}
                onSetActive={(id) => handleSetActive(sectionId, id)}
                onUpdateLink={(val) =>
                  updateField(`linkPaper${sectionId === SECTIONS.JURNAL ? "Jurnal" : "Proceeding"}`, val)
                }
                linkPaperValue={
                  sectionId === SECTIONS.JURNAL ? data.linkPaperJurnal : data.linkPaperProceeding
                }
                showLinkInput={sectionId === SECTIONS.JURNAL || sectionId === SECTIONS.PROCEEDING}
              />
            );
          })}
        </section>
      )}

      {/* Section 3: Berkas wajib sidang */}
      <section className="form-section">
        <DocUploadPanel
          {...commonPanelProps}
          sectionTitle="Berkas Wajib Sidang"
          documents={getSectionDocs(SECTIONS.WAJIB)}
          activeDocId={activeDocIds[SECTIONS.WAJIB]}
          onSetActive={(id) => handleSetActive(SECTIONS.WAJIB, id)}
          showLinkInput={false}
        />
      </section>
   </div>
  );
}