import React, { useState, useRef, useEffect } from "react";
import { User, Hash, BookOpen, Phone, Info, Mail, Search, ChevronDown, CheckCircle2, X, Calendar, FileText } from "lucide-react";
import { useYudisiumContext } from "../../../context/YudisiumFormContext";

const SearchableSelect = ({ value, onChange, options, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayValue = selectedOption ? selectedOption.label : "";

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  if (disabled) {
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        <User size={16} color="#9CA3AF" style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
        <div
          className="form-input is-disabled"
          style={{
            display: "flex",
            alignItems: "center",
            background: "#F3F4F6",
            color: "#6B7280",
            border: "1.5px solid #E5E7EB",
            borderRadius: "6px",
            padding: "8px 12px 8px 36px",
            minHeight: "40px",
            fontSize: "12.5px",
            cursor: "not-allowed",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayValue || placeholder}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="form-input"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: isOpen ? "#fff" : "#F4F4F5",
          padding: "10px 14px",
          minHeight: "42px",
          border: isOpen ? "1px solid #C0182A" : isHovered ? "1px solid #C0182A" : "1px solid #E4E4E7",
          borderRadius: "8px",
          boxShadow: isOpen ? "0 0 0 3px rgba(192, 24, 42, 0.08)" : "none",
          transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
          boxSizing: "border-box"
        }}
      >
        <span style={{ color: displayValue ? "#1E293B" : "#71717A", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayValue || placeholder}
        </span>
        <ChevronDown size={16} color="#71717A" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0, marginLeft: "8px" }} />
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid #E4E4E7", borderRadius: "8px",
          marginTop: "4px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          maxHeight: "260px", display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{ padding: "10px", borderBottom: "1px solid #E4E4E7", display: "flex", alignItems: "center", gap: "8px", background: "#F4F4F5" }}>
            <Search size={16} color="#71717A" />
            <input
              type="text"
              placeholder="Ketik nama atau kode dosen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: "0.95rem", background: "transparent", color: "#1E293B" }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  style={{
                    padding: "10px 14px", cursor: "pointer", fontSize: "0.9rem",
                    color: "#1E293B", background: String(value) === String(opt.value) ? "#FEF2F2" : "transparent",
                    fontWeight: String(value) === String(opt.value) ? "600" : "400",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => { if (String(value) !== String(opt.value)) e.currentTarget.style.background = "#F1F5F9"; }}
                  onMouseLeave={(e) => { if (String(value) !== String(opt.value)) e.currentTarget.style.background = "transparent"; }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div style={{ padding: "16px 14px", fontSize: "0.9rem", color: "#71717A", textAlign: "center", fontStyle: "italic" }}>
                Dosen tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const formatSidangDateDisplay = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const InfoCard = ({ label, value, icon: Icon }) => (
  <div
    style={{
      background: "#F3F4F6",
      border: "1px solid #E5E7EB",
      borderRadius: "10px",
      padding: "14px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      cursor: "not-allowed",
    }}
  >
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: "#FEF2F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={18} color="#C0182A" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#6B7280",
          lineHeight: "1.4",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default function Step1Yudisium({
  studentInfo,
  lecturers,
  readOnly,
  draftBanner = null,
  onCloseDraftBanner,
  isRevisionActive = false,

}) {
  const { state, dispatch } = useYudisiumContext();
  const { data } = state;

  const dosenOptions = lecturers.map(d => ({
    value: d.id,
    label: `${d.kodeDosen} - ${d.name || d.nama}`
  }));

  const handleChange = (field, value) => {
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const handleSkemaCumlaudeChange = (val) => {
    let current = [...(data.skemaCumlaude || [])];
    if (current.includes(val)) {
      current = current.filter(item => item !== val);
    } else {
      current.push(val);
    }
    handleChange("skemaCumlaude", current);
  };

  return (
    <div className="step-content">
      {/* Banner draft berhasil tersimpan */}
      {!readOnly && draftBanner && (
        <div
          className="info-banner"
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: "1 1 320px",
              minWidth: 0,
            }}
          >
            <div
              className="banner-icon-container"
              style={{
                width: "40px",
                height: "40px",
                background: "#DCFCE7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircle2 color="#16A34A" size={20} />
            </div>
            <div className="banner-content">
              <h4 style={{ margin: "0 0 4px", color: "#166534", fontWeight: 800, fontSize: "15px" }}>
                Draft Berhasil Tersimpan
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#15803D", lineHeight: 1.5 }}>
                {draftBanner.lastDocName ? (
                  <>
                    Dokumen terakhir yang diupload adalah <strong>{draftBanner.lastDocName}</strong>. Silakan lanjutkan pendaftaran Anda.
                  </>
                ) : (
                  "Belum ada dokumen yang diupload. Silakan lanjutkan pendaftaran Anda."
                )}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <a
              className="contact-person-badge"
              href="https://wa.me/6285117001281"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#C0182A",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Mail size={15} />
              <span>Contact Person : Helpdesk Layanan Sidang-Yudisium TUP</span>
            </a>
            {onCloseDraftBanner && (
              <button
                type="button"
                onClick={onCloseDraftBanner}
                aria-label="Tutup banner draft"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#166534",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(22, 101, 52, 0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Banner informasi panduan dan helpdesk */}
      {!readOnly && !draftBanner && !isRevisionActive && (
        <div
          className="info-banner"
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: "1 1 320px",
              minWidth: 0,
            }}
          >
            <div
              className="banner-icon-container"
              style={{
                width: "40px",
                height: "40px",
                background: "#FEF3C7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Info color="#D97706" size={20} />
            </div>
            <div className="banner-content">
              <h4 style={{ margin: "0 0 4px", color: "#92400E", fontWeight: 800, fontSize: "15px" }}>
                Informasi Mahasiswa
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#B45309", lineHeight: 1.5 }}>
                Pastikan data diri kamu di bawah ini sudah sesuai sebelum melanjutkan pendaftaran yudisium.
              </p>
            </div>
          </div>

          <a
            className="contact-person-badge"
            href="https://wa.me/6285117001281"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#C0182A",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <Mail size={15} />
            <span>Contact Person : Helpdesk Layanan Sidang-Yudisium TUP</span>
          </a>
        </div>
      )}

      {/* Section 1: Data Identitas Mahasiswa */}
      <section className="form-section" style={{ marginBottom: "2.5rem" }}>
        <div className="sidang-section-head">
          <h3>Data Mahasiswa</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <InfoCard label="Nama Lengkap" icon={User} value={studentInfo.nama} />
          <InfoCard label="NIM" icon={Hash} value={studentInfo.nim} />
          <InfoCard label="Program Studi" icon={BookOpen} value={studentInfo.prodi} />
          <InfoCard label="No. Telepon" icon={Phone} value={studentInfo.phone} />
        </div>
      </section>

      {/* Section 2: Informasi Tugas Akhir & Pembimbing */}
      <section className="form-section" style={{ marginBottom: "2.5rem" }}>
        <div className="sidang-section-head">
          <h3>Informasi Tugas Akhir &amp; Pembimbing</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <label className="form-label" style={{ margin: 0 }}>Program <span style={{ color: "red" }}>*</span></label>
              <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                Alih jenjang hanya untuk yang ekstensi D3 ke S1 TT
              </span>
            </div>
            <select className="form-select" value={data.program} onChange={(e) => handleChange("program", e.target.value)}>
              <option value="">-- Pilih Program --</option>
              <option value="Reguler">Reguler</option>
              <option value="Alih Jenjang">Alih Jenjang</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <label className="form-label" style={{ margin: 0 }}>Score TAK terbaru <span style={{ color: "red" }}>*</span></label>
              <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                Poin minimum untuk TAK Mahasiswa Reguler: 60, Alih Jenjang: 25
              </span>
            </div>
            <input
              type="number"
              min="0"
              className="form-input"
              style={{
                borderColor: (data.program === "Reguler" && data.tak !== "" && Number(data.tak) < 60) ||
                  (data.program === "Alih Jenjang" && data.tak !== "" && Number(data.tak) < 25)
                  ? "#ef4444" : ""
              }}
              placeholder="Contoh: 60"
              value={data.tak}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || Number(val) >= 0) handleChange("tak", val);
              }}
            />
            {data.program === "Reguler" && data.tak !== "" && Number(data.tak) < 60 && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", fontWeight: "500" }}>
                ⚠️ Nilai TAK untuk program Reguler minimal 60.
              </p>
            )}
            {data.program === "Alih Jenjang" && data.tak !== "" && Number(data.tak) < 25 && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", fontWeight: "500" }}>
                ⚠️ Nilai TAK untuk program Alih Jenjang minimal 25.
              </p>
            )}
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <label className="form-label" style={{ margin: 0 }}>Judul Tugas Akhir (Bahasa Indonesia) <span style={{ color: "red" }}>*</span></label>
              <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                Apabila terdapat perubahan/perbedaan judul Tugas Akhir dengan yang tertera pada igracias silahkan mengajukan perubahan judul Tugas Akhir
              </span>
            </div>
            <textarea className="form-input" rows={2} placeholder="Masukkan judul dalam bahasa Indonesia" value={data.judulTugasAkhirIndonesia} onChange={(e) => handleChange("judulTugasAkhirIndonesia", e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <label className="form-label" style={{ margin: 0 }}>Judul Tugas Akhir (Bahasa Inggris) <span style={{ color: "red" }}>*</span></label>
              <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                Apabila terdapat perubahan/perbedaan judul Tugas Akhir dengan yang tertera pada igracias silahkan mengajukan perubahan judul Tugas Akhir
              </span>
            </div>
            <textarea className="form-input" rows={2} placeholder="Masukkan judul dalam bahasa Inggris" value={data.judulTugasAkhirInggris} onChange={(e) => handleChange("judulTugasAkhirInggris", e.target.value)} />
          </div>

          <div className="form-group">
            <InfoCard label="Skema Sidang" icon={FileText} value={data.skemaSidang || "-"} />
          </div>

          <div className="form-group">
            <InfoCard label="Tanggal Sidang" icon={Calendar} value={formatSidangDateDisplay(data.tglSidang)} />
          </div>

          <div className="form-group">
            <label className="form-label">Dosen Pembimbing 1 <span style={{ color: "red" }}>*</span></label>
            <SearchableSelect
              options={dosenOptions}
              value={data.dosenPembimbing1Id}
              onChange={(val) => handleChange("dosenPembimbing1Id", val)}
              placeholder="-- Pilih Dosen Pembimbing 1 --"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dosen Pembimbing 2</label>
            <SearchableSelect
              options={dosenOptions}
              value={data.dosenPembimbing2Id}
              onChange={(val) => handleChange("dosenPembimbing2Id", val)}
              placeholder="-- Pilih Dosen Pembimbing 2 (Opsional) --"
            />
          </div>

          {/* CUMLAUDE */}
          <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
            <label className="form-label">
              Pengajuan Cumlaude / Summa Cumlaude
            </label>
            <select
              className="form-select"
              value={data.pengajuanCumlaude}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("pengajuanCumlaude", val);

                if (val === "Pengajuan Summacumlaude") {
                  handleChange("skemaCumlaude", ["Publikasi Jurnal"]);
                }
              }}
            >
              <option value="Non Cumlaude">Tidak Mengajukan</option>
              <option value="Pengajuan Cumlaude">Ya, Mengajukan Cumlaude</option>
              <option value="Pengajuan Summacumlaude">Ya, Mengajukan Summa Cumlaude</option>
            </select>
          </div>

          {data.pengajuanCumlaude !== "Non Cumlaude" && (
            <>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Skema <span style={{ color: "red" }}>*</span></label>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "8px" }}>
                  {["Publikasi Jurnal", "Prestasi Lomba", "HKI/Paten", "Pameran"].map((opsi) => {
                    const isSumma = data.pengajuanCumlaude === "Pengajuan Summacumlaude";
                    const isJurnal = opsi === "Publikasi Jurnal";
                    const forceDisable = isSumma;

                    return (
                      <label
                        key={opsi}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12.5px",
                          cursor: forceDisable ? "not-allowed" : "pointer"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(data.skemaCumlaude || []).includes(opsi)}
                          disabled={forceDisable}
                          onChange={() => handleSkemaCumlaudeChange(opsi)}
                          style={{
                            width: "16px",
                            height: "16px",
                            accentColor: "#C0182A",
                            cursor: forceDisable ? "not-allowed" : "pointer"
                          }}
                        />
                        <span style={{ color: forceDisable ? "#94a3b8" : "inherit", fontWeight: (isSumma && isJurnal) ? "600" : "400" }}>
                          {opsi} {(isSumma && isJurnal) && "(Wajib)"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">
                  Detail Publikasi / Prestasi (Sertifikat/Jurnal) <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  placeholder="Sebutkan detail publikasi atau prestasi kamu di sini... (Pisahkan dengan Enter)"
                  value={data.evidenCumlaude}
                  onChange={(e) => handleChange("evidenCumlaude", e.target.value)}
                  rows={4}
                  style={{
                    resize: "vertical",
                    minHeight: "80px",
                    lineHeight: "1.5"
                  }}
                />
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                  Catatan: Jika ada lebih dari satu, pisahkan dengan baris baru (Enter).
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}