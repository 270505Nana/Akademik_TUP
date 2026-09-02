import React, { useEffect } from "react";
import { X, Download, FileText } from "lucide-react";
export default function FilePreviewModal({
  blobUrl,
  title,
  onClose,
  onDownload,
  isDownloading = false,
}) {
  useEffect(() => {
    if (!blobUrl) return;
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [blobUrl, onClose]);

  useEffect(() => {
    if (blobUrl) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [blobUrl]);

  if (!blobUrl) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          width: "min(860px, 95vw)",
          height: "min(90vh, 840px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={18} color="#C0182A" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9rem",
                color: "#1a202c",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
              Preview dokumen
            </div>
          </div>
          <button
            onClick={onClose}
            title="Tutup"
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              background: "#F8FAFC",
              cursor: "pointer",
              color: "#374151",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F8FAFC")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — iframe preview */}
        <div style={{ flex: 1, overflow: "hidden", background: "#F8FAFC" }}>
          <iframe
            src={blobUrl}
            title={title}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            borderTop: "1px solid #E2E8F0",
            flexShrink: 0,
          }}
        >
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="download-btn"
              style={{
                padding: "0.5rem 1.25rem",
                fontSize: "0.85rem",
                opacity: isDownloading ? 0.7 : 1,
              }}
            >
              <Download size={15} />
              <span>{isDownloading ? "Mengunduh..." : "Unduh"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
