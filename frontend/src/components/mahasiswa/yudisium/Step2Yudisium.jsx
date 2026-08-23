import React from "react";
import { Upload, X, FileText, Info } from "lucide-react";
import { useYudisiumContext } from "../../../context/YudisiumFormContext";
import { SECTIONS } from "./YudisiumDocument";

export default function Step2Yudisium() {
  const { state, dispatch } = useYudisiumContext();
  const { data, documents } = state;

  const handleFileChange = (e, docId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran file maksimal 3MB.");
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert("Format file harus PDF, JPG, JPEG, atau PNG.");
      return;
    }

    dispatch({ type: "SET_DOCUMENT_FILE", docId, file });
  };

  const handleRemoveFile = (docId) => {
    dispatch({ type: "REMOVE_DOCUMENT_FILE", docId });
  };

  // Filter dokumen yang tampil berdasarkan input Step 1
  const visibleDocuments = documents.filter((doc) => {
    if (doc.section === SECTIONS.CUMLAUDE && data.pengajuanCumlaude === "Non Cumlaude") return false;
    if (doc.section === SECTIONS.WIRAUSAHA && data.minatWirausaha !== "Ya") return false; // Filter Wirausaha
    return true;
  });

  return (
    <div className="step-content">
      <div className="info-banner" style={{ marginBottom: "2rem" }}>
        <div className="banner-icon-container">
          <Info color="#d69e2e" size={24} />
        </div>
        <div className="banner-content">
          <h4>Unggah Berkas Yudisium</h4>
          <p>Format file yang diizinkan: <strong>PDF, JPG, JPEG, PNG</strong>. Ukuran maksimal per file: <strong>3MB</strong>.</p>
        </div>
      </div>

      <div className="form-grid">
        {visibleDocuments.map((doc) => (
          <div key={doc.id} className="input-group" style={{ background: "#fff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>
              {doc.name} <span style={{ color: "red" }}>*</span>
            </label>
            
            {!doc.file ? (
              <div style={{ position: "relative", border: "2px dashed #cbd5e1", borderRadius: "8px", padding: "1.5rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                   onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c0182a"}
                   onMouseLeave={(e) => e.currentTarget.style.borderColor = "#cbd5e1"}>
                <input 
                  type="file" 
                  accept=".pdf, .jpg, .jpeg, .png" 
                  onChange={(e) => handleFileChange(e, doc.id)} 
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
                />
                <Upload size={24} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Klik atau seret file ke sini</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                  <FileText size={18} color="#c0182a" flexShrink={0} />
                  <span style={{ fontSize: "0.85rem", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.fileName}
                  </span>
                </div>
                <button type="button" onClick={() => handleRemoveFile(doc.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}>
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}