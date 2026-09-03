import React, { useEffect, useState } from "react";
import { X, Download, FileText, Loader } from "lucide-react";

export default function FilePreviewModal({
  blobUrl,
  blob = null,
  title,
  mimeType,
  onClose,
  onDownload,
  isDownloading = false,
}) {
  const [docxState, setDocxState] = useState({
    html: null,
    isLoading: false,
    isError: false,
  });

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

  const normalizedMime = (mimeType || "").toLowerCase();
  const isPdf = !mimeType || normalizedMime.includes("pdf");
  const isImage = normalizedMime.startsWith("image/");
  const isDocx = Boolean(
    normalizedMime &&
    (normalizedMime.includes("wordprocessingml.document") || normalizedMime.includes("application/vnd.openxmlformats"))
  );

  useEffect(() => {
    if (!blobUrl || !isDocx) {
      setDocxState({ html: null, isLoading: false, isError: false });
      return;
    }

    let isMounted = true;
    setDocxState({ html: null, isLoading: true, isError: false });

    const convertDocx = async () => {
      try {
        let arrayBuffer;
        if (blob && typeof blob.arrayBuffer === "function") {
          arrayBuffer = await blob.arrayBuffer();
        } else {
          const res = await fetch(blobUrl);
          arrayBuffer = await res.arrayBuffer();
        }

        // Lazy-load mammoth secara dinamis hanya saat dibutuhkan untuk menghemat bundle size
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (isMounted) {
          setDocxState({
            html: result.value || "<p>Dokumen tidak memiliki konten teks.</p>",
            isLoading: false,
            isError: false,
          });
        }
      } catch (err) {
        console.error("Gagal mengonversi file .docx ke HTML:", err);
        if (isMounted) {
          setDocxState({ html: null, isLoading: false, isError: true });
        }
      }
    };

    convertDocx();

    return () => {
      isMounted = false;
    };
  }, [blobUrl, blob, isDocx]);

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

        {/* Body — preview atau fallback */}
        <div style={{ flex: 1, overflow: "hidden", background: "#F8FAFC" }}>
          {isPdf ? (
            <iframe
              src={blobUrl}
              title={title}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          ) : isImage ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
                overflow: "auto",
              }}
            >
              <img
                src={blobUrl}
                alt={title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
            </div>
          ) : isDocx && docxState.isLoading ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                color: "#64748B",
              }}
            >
              <Loader
                size={32}
                style={{
                  color: "#C0182A",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1E293B", margin: 0 }}>
                Menyiapkan Pratinjau Dokumen Word...
              </p>
              <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Mengonversi file .docx ke tampilan dokumen
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : isDocx && docxState.html && !docxState.isError ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                padding: "2rem 1.5rem",
                background: "#F1F5F9",
              }}
            >
              {/* 
                Catatan Keamanan: dangerouslySetInnerHTML digunakan di sini karena sumber berkas
                adalah template dokumen resmi dari penyimpanan internal admin universitas,
                bukan input pengguna/mahasiswa acak. Mammoth hanya menghasilkan elemen HTML semantik dasar
                (p, table, h1-h6, strong, em) dari dokumen Office Open XML tanpa script.
              */}
              <div
                className="docx-preview-content"
                style={{
                  maxWidth: "800px",
                  margin: "0 auto",
                  background: "#FFFFFF",
                  padding: "3rem 3.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                  minHeight: "100%",
                  color: "#1E293B",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  wordBreak: "break-word",
                }}
                dangerouslySetInnerHTML={{ __html: docxState.html }}
              />
              <style>{`
                .docx-preview-content table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 1.25rem 0;
                }
                .docx-preview-content th, .docx-preview-content td {
                  border: 1px solid #CBD5E1;
                  padding: 0.5rem 0.75rem;
                  text-align: left;
                }
                .docx-preview-content th {
                  background-color: #F8FAFC;
                  font-weight: 700;
                }
                .docx-preview-content p {
                  margin-bottom: 0.85rem;
                }
                .docx-preview-content h1, .docx-preview-content h2, .docx-preview-content h3 {
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                  font-weight: 700;
                  color: #0F172A;
                }
              `}</style>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <FileText size={36} color="#C0182A" />
              </div>
              <h4
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1E293B",
                  marginBottom: "0.5rem",
                  maxWidth: "500px",
                  wordBreak: "break-word",
                }}
              >
                {title}
              </h4>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#64748B",
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: "460px",
                }}
              >
                Pratinjau langsung tidak didukung untuk tipe berkas ini. Silakan unduh berkas untuk melihat isinya.
              </p>
            </div>
          )}
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
