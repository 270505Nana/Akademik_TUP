import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, GraduationCap, Info, Phone, User } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useYudisiumContext } from "../../../context/YudisiumFormContext";

const kelompokKeilmuan = [
  { id: "kk1", researchGroupId: 1, label: "ELECTRONICS AND TELECOMMUNICATIONS SCIENCE" },
  { id: "kk2", researchGroupId: 2, label: "INDUSTRIAL SYSTEMS ENGINEERING" },
  { id: "kk3", researchGroupId: 3, label: "MEDIA, DESIGN AND CREATIVE INNOVATION" },
  { id: "kk4", researchGroupId: 4, label: "APPLIED ARTIFICIAL INTELLIGENCE" },
  { id: "kk5", researchGroupId: 5, label: "CYBER SECURITY, IOT, AND CLOUD SYSTEM" },
  { id: "kk6", researchGroupId: 6, label: "DATA SCIENCE AND OPTIMIZATION" },
  { id: "kk7", researchGroupId: 7, label: "BIOENGINEERING, FOOD TECHNOLOGY AND ADVANCE MATERIAL" },
  { id: "kk8", researchGroupId: 8, label: "SOFTWARE ENGINEERING AND MULTIMEDIA" },
];

const getKelompokLabel = (researchGroupId) => {
  if (!researchGroupId) return null;
  return kelompokKeilmuan.find((kk) => kk.researchGroupId === researchGroupId)?.label || null;
};

const getResearchGroupName = (lect) =>
  getKelompokLabel(lect?.researchGroupId) ||
  lect?.researchGroup?.name ||
  (typeof lect?.researchGroup === "string" ? lect.researchGroup : null) ||
  lect?.researchGroupName ||
  lect?.kelompokKeilmuan ||
  lect?.group?.name ||
  "-";

const formatLecturer = (lect) => {
  if (!lect) return "-";
  const kode = lect.kodeDosen || lect.lecturerCode || lect.kode || "-";
  const nama = lect.user?.name || lect.name || lect.nama || "-";
  return `${kode} - ${nama} (${getResearchGroupName(lect)})`;
};

const formatLecturerShort = (lect) => {
  if (!lect) return "-";
  const kode = lect.kodeDosen || lect.lecturerCode || lect.kode || "-";
  const nama = lect.user?.name || lect.name || lect.nama || "-";
  return `${kode} - ${nama}`;
};

const StaticValue = ({ children }) => (
  <div className="static-field">{children ?? "-"}</div>
);

const LecturerDropdown = ({ lecturers, value, onChange, placeholder, excludeId }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = lecturers.find((l) => String(l.id) === String(value));

  const filtered = lecturers.filter((l) => {
    if (excludeId && String(l.id) === String(excludeId)) return false;
    if (!query) return true;
    const label = `${l.kodeDosen || l.lecturerCode || l.kode || ""} ${l.user?.name || l.name || l.nama || ""}`.toLowerCase();
    return label.includes(query.toLowerCase());
  });

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field"
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <span style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: selected ? "inherit" : "#94A3B8",
        }}>
          {selected ? formatLecturerShort(selected) : (placeholder || "Pilih Dosen")}
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, color: "#94A3B8" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            boxShadow: "0 12px 28px rgba(15,23,42,0.14)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 8, borderBottom: "1px solid #F1F5F9" }}>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama / kode dosen..."
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
                Dosen tidak ditemukan.
              </div>
            ) : (
              filtered.map((lect) => {
                const isSelected = String(lect.id) === String(value);
                return (
                  <div
                    key={lect.id}
                    onClick={() => {
                      onChange(String(lect.id));
                      setOpen(false);
                      setQuery("");
                    }}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? "#FEF2F2" : "#fff",
                      color: isSelected ? "#C0182A" : "#1E293B",
                      borderBottom: "1px solid #F8FAFC",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#fff";
                    }}
                  >
                    {formatLecturerShort(lect)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const quillModules = {
  toolbar: [
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

export default function Step1Yudisium({ studentInfo = {}, lecturers = [], readOnly = false }) {
  const { state, dispatch } = useYudisiumContext();
  const { data } = state;

  const programs = ["Reguler", "Alih Jenjang"];
  const skemas = ["Sidang Reguler", "Non Sidang", "Capstone", "Sidang Khusus Prodi"];
  const cumlaudeOptions = ["Non Cumlaude", "Pengajuan Cumlaude", "Summa Cumlaude"];
  const skemaCumlaudeList = ["Publikasi Jurnal", "Pameran", "Lomba", "HKI"];

  const updateField = (field, value) => {
    if (readOnly) return;
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const handleCumlaudeChange = (val) => {
    if (readOnly) return;
    updateField("pengajuanCumlaude", val);
    
    // Auto-select and lock if Summa Cumlaude
    if (val === "Summa Cumlaude") {
      updateField("skemaCumlaude", ["Publikasi Jurnal"]);
    } else if (val === "Non Cumlaude") {
      updateField("skemaCumlaude", []);
      updateField("evidenCumlaude", "");
    }
  };

  const toggleSkemaCumlaude = (option) => {
    if (readOnly || data.pengajuanCumlaude === "Summa Cumlaude") return;
    const current = data.skemaCumlaude || [];
    const next = current.includes(option)
      ? current.filter((i) => i !== option)
      : [...current, option];
    updateField("skemaCumlaude", next);
  };

  const pembimbing1 = lecturers.find((l) => String(l.id) === String(data.dosenPembimbing1Id));
  const pembimbing2 = lecturers.find((l) => String(l.id) === String(data.dosenPembimbing2Id));

  return (
    <div className="step-content">
      <div className="info-banner">
        <div className="banner-icon-container">
          <Info color="#d69e2e" size={24} />
        </div>
        <div className="banner-content">
          <h4>Pendaftaran Yudisium Telkom University Purwokerto</h4>
          <p>Lengkapi data pendaftaran Yudisium dengan benar dan teliti sesuai dengan data akademik terakhir.</p>
        </div>
      </div>

      <div className="step-title-container">
        <div className="step-label">Step 1</div>
        <h2 className="step-main-title">
          Formulir Data Akademik Yudisium
        </h2>
      </div>

      <section className="form-section">
        <h3 className="section-head">Identitas & Program Studi</h3>
        <div className="form-grid">
          <div className="input-group">
            <label>Nama</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <div className="static-field">{studentInfo.nama || "-"}</div>
            </div>
          </div>
          
          <div className="input-group">
            <label>NIM</label>
            <div className="input-with-icon">
              <div className="static-field">{studentInfo.nim || "-"}</div>
            </div>
          </div>

          <div className="input-group">
            <label>Program Studi</label>
            <div className="input-with-icon">
              <GraduationCap className="input-icon" size={18} />
              <div className="static-field">{studentInfo.prodi || "-"}</div>
            </div>
          </div>

          <div className="input-group">
            <label>No. HP</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={18} />
              <div className="static-field">{studentInfo.phone || "-"}</div>
            </div>
          </div>

          <div className="input-group">
            <label>Program</label>
            {readOnly ? (
              <StaticValue>{data.program || "-"}</StaticValue>
            ) : (
              <div className="program-selector">
                {programs.map((p) => (
                  <div key={p} className={`program-card ${data.program === p ? "active" : ""}`} onClick={() => updateField("program", p)}>
                    <div className="checkbox-visual">
                      {data.program === p && <span className="checkbox-dot" />}
                    </div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Score TAK Terbaru</label>
            {readOnly ? (
              <StaticValue>{data.tak || "-"}</StaticValue>
            ) : (
              <div className="input-with-icon">
                <input type="number" className="input-field" placeholder="0" value={data.tak} onChange={(e) => updateField("tak", e.target.value)} />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Tanggal Sidang</label>
            <div className="input-with-icon">
              <div className="static-field">{data.sidangDate}</div>
            </div>
            <span className="helper-text">Tanggal sidang otomatis di-generate oleh sistem.</span>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-head">Informasi Tugas Akhir & Skema</h3>
        <div className="form-grid">
           <div className="input-group">
            <label>Kode Dosen Wali</label>
            <div className="input-with-icon">
              <div className="static-field">{data.dosenWaliId}</div>
            </div>
          </div>

          <div className="input-group">
            <label>Dosen Pembimbing 1</label>
            {readOnly ? (
              <StaticValue>{formatLecturer(pembimbing1)}</StaticValue>
            ) : (
              <LecturerDropdown 
                lecturers={lecturers} 
                value={data.dosenPembimbing1Id} 
                onChange={(id) => updateField("dosenPembimbing1Id", id)} 
                excludeId={data.dosenPembimbing2Id} 
                placeholder="Pilih Dosen Pembimbing 1"
              />
            )}
          </div>

          <div className="input-group"></div>

          <div className="input-group">
            <label>Dosen Pembimbing 2</label>
            {readOnly ? (
              <StaticValue>{formatLecturer(pembimbing2)}</StaticValue>
            ) : (
              <LecturerDropdown 
                lecturers={lecturers} 
                value={data.dosenPembimbing2Id} 
                onChange={(id) => updateField("dosenPembimbing2Id", id)} 
                excludeId={data.dosenPembimbing1Id} 
                placeholder="Pilih Dosen Pembimbing 2"
              />
            )}
          </div>
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Skema Sidang</label>
          {readOnly ? (
            <StaticValue>{data.skemaSidang || "-"}</StaticValue>
          ) : (
            <div className="input-with-icon">
              <select className="input-field" value={data.skemaSidang} onChange={(e) => updateField("skemaSidang", e.target.value)}>
                <option value="">Pilih Skema Sidang</option>
                {skemas.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Judul Tugas Akhir (Bahasa Indonesia) *</label>
          {readOnly ? (
            <StaticValue>{data.judulTugasAkhirIndonesia || "-"}</StaticValue>
          ) : (
            <textarea className="textarea-field" value={data.judulTugasAkhirIndonesia} onChange={(e) => updateField("judulTugasAkhirIndonesia", e.target.value)} placeholder="Masukkan Judul Tugas Akhir (Bahasa Indonesia)"></textarea>
          )}
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Judul Tugas Akhir (Bahasa Inggris) *</label>
          {readOnly ? (
            <StaticValue>{data.judulTugasAkhirInggris || "-"}</StaticValue>
          ) : (
            <textarea className="textarea-field" value={data.judulTugasAkhirInggris} onChange={(e) => updateField("judulTugasAkhirInggris", e.target.value)} placeholder="Masukkan Judul Tugas Akhir (Bahasa Inggris)"></textarea>
          )}
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-head">Pengajuan Predikat & Kewirausahaan</h3>
        
        <div className="input-group">
          <label>Pengajuan Cumlaude</label>
          {readOnly ? (
             <StaticValue>{data.pengajuanCumlaude || "-"}</StaticValue>
          ) : (
            <div className="input-with-icon">
              <select className="input-field" value={data.pengajuanCumlaude} onChange={(e) => handleCumlaudeChange(e.target.value)}>
                {cumlaudeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        {(data.pengajuanCumlaude === "Pengajuan Cumlaude" || data.pengajuanCumlaude === "Summa Cumlaude") && (
           <div className="input-group" style={{ marginTop: "1rem", padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid var(--border-grey)" }}>
             <label style={{ color: "var(--primary-red)" }}>Skema Cumlaude *</label>
             <span className="helper-text">Pilih opsi skema yang sesuai</span>
             <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                {skemaCumlaudeList.map((option) => (
                  <div 
                    key={option} 
                    className={`program-card ${data.skemaCumlaude?.includes(option) ? "active" : ""} ${data.pengajuanCumlaude === "Summa Cumlaude" && option !== "Publikasi Jurnal" ? "disabled" : ""}`} 
                    onClick={() => toggleSkemaCumlaude(option)} 
                    style={{ padding: "0.5rem 1rem", opacity: data.pengajuanCumlaude === "Summa Cumlaude" && option !== "Publikasi Jurnal" ? 0.5 : 1, cursor: data.pengajuanCumlaude === "Summa Cumlaude" && option !== "Publikasi Jurnal" ? "not-allowed" : "pointer" }}
                  >
                    <div className="checkbox-visual">
                      {data.skemaCumlaude?.includes(option) && <Check color="white" size={14} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: "0.85rem" }}>{option}</span>
                  </div>
                ))}
              </div>

              <div className="input-group" style={{ marginTop: "2rem" }}>
                <label>Detail Publikasi / Prestasi (Gunakan Numbering)</label>
                {readOnly ? (
                  <div className="static-field" dangerouslySetInnerHTML={{ __html: data.evidenCumlaude }} />
                ) : (
                  <div style={{ background: "white", borderRadius: "8px" }}>
                    <ReactQuill theme="snow" value={data.evidenCumlaude} onChange={(val) => updateField("evidenCumlaude", val)} modules={quillModules} placeholder="Contoh: 1. Juara 1 Pagelaran Mahasiswa Nasional..." />
                  </div>
                )}
              </div>
           </div>
        )}

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Apakah berminat dan memenuhi kriteria menjadi Mahasiswa Berprestasi Bidang Kewirausahaan?</label>
          {readOnly ? (
            <StaticValue>{data.minatWirausaha || "-"}</StaticValue>
          ) : (
            <div className="input-with-icon">
              <select className="input-field" value={data.minatWirausaha} onChange={(e) => updateField("minatWirausaha", e.target.value)}>
                <option value="">-- Pilih --</option>
                <option value="Ya">Ya, Saya Berminat</option>
                <option value="Tidak">Tidak</option>
              </select>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}