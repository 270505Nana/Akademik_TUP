import React, { useState, useRef, useEffect } from "react";
import { User, Hash, BookOpen, Phone, CheckCircle2, Search, ChevronDown } from "lucide-react";
import { useYudisiumContext } from "../../../context/YudisiumFormContext";

const SearchableSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          cursor: "pointer", 
          background: "#fff",
          padding: "10px 14px",
          minHeight: "42px"
        }}
      >
        <span style={{ color: displayValue ? "#1E293B" : "#94A3B8", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayValue || placeholder}
        </span>
        <ChevronDown size={16} color="#94A3B8" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0, marginLeft: "8px" }} />
      </div>

      {isOpen && (
        <div style={{ 
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, 
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", 
          marginTop: "4px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", 
          maxHeight: "260px", display: "flex", flexDirection: "column", overflow: "hidden" 
        }}>
          <div style={{ padding: "10px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "8px", background: "#F8FAFC" }}>
            <Search size={16} color="#94A3B8" />
            <input
              type="text"
              placeholder="Ketik nama atau kode dosen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: "13px", background: "transparent" }}
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
                    padding: "10px 14px", cursor: "pointer", fontSize: "13px", 
                    color: "#334155", background: String(value) === String(opt.value) ? "#FEF2F2" : "transparent",
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
              <div style={{ padding: "16px 14px", fontSize: "13px", color: "#94A3B8", textAlign: "center", fontStyle: "italic" }}>
                Dosen tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ label, value, icon: Icon }) => (
  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} color="#C0182A" />
    </div>
    <div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", lineHeight: "1.4" }}>
        {value}
      </div>
    </div>
  </div>
);

export default function Step1Yudisium({ studentInfo, lecturers }) {
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
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <CheckCircle2 color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} size={20} />
        <div>
          <h4 style={{ margin: 0, color: '#92400E', fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>Informasi Mahasiswa</h4>
          <p style={{ margin: 0, color: '#B45309', fontSize: '13px', lineHeight: '1.5' }}>Pastikan data diri kamu di bawah ini sudah sesuai sebelum melanjutkan pendaftaran yudisium.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
        <InfoCard label="Nama Lengkap" icon={User} value={studentInfo.nama} />
        <InfoCard label="NIM" icon={Hash} value={studentInfo.nim} />
        <InfoCard label="Program Studi" icon={BookOpen} value={studentInfo.prodi} />
        <InfoCard label="No. Telepon" icon={Phone} value={studentInfo.phone} />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Program <span style={{ color: "red" }}>*</span></label>
          <select className="form-select" value={data.program} onChange={(e) => handleChange("program", e.target.value)}>
            <option value="">-- Pilih Program --</option>
            <option value="Reguler">Reguler</option>
            <option value="Alih Jenjang">Alih Jenjang</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Total Nilai TAK <span style={{ color: "red" }}>*</span></label>
          <input 
            type="number" 
            min="0"
            className="form-input"
            style={{
              borderColor: (data.program === "Reguler" && data.tak !== "" && Number(data.tak) < 60) || 
                           (data.program === "Alih Jenjang" && data.tak !== "" && Number(data.tak) < 45) 
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
          {data.program === "Alih Jenjang" && data.tak !== "" && Number(data.tak) < 45 && (
            <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", fontWeight: "500" }}>
              ⚠️ Nilai TAK untuk program Alih Jenjang minimal 45.
            </p>
          )}
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Judul Tugas Akhir (Indonesia) <span style={{ color: "red" }}>*</span></label>
          <textarea className="form-input" rows={2} placeholder="Masukkan judul dalam bahasa Indonesia" value={data.judulTugasAkhirIndonesia} onChange={(e) => handleChange("judulTugasAkhirIndonesia", e.target.value)} />
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label">Judul Tugas Akhir (Inggris) <span style={{ color: "red" }}>*</span></label>
          <textarea className="form-input" rows={2} placeholder="Masukkan judul dalam bahasa Inggris" value={data.judulTugasAkhirInggris} onChange={(e) => handleChange("judulTugasAkhirInggris", e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Skema Sidang <span style={{ color: "red" }}>*</span></label>
          <select className="form-select" value={data.skemaSidang} onChange={(e) => handleChange("skemaSidang", e.target.value)}>
            <option value="">-- Pilih Skema --</option>
            <option value="Sidang Reguler">Sidang Reguler</option>
            <option value="Non Sidang">Non Sidang</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Apakah Anda berminat wirausaha? <span style={{ color: "red" }}>*</span></label>
          <select className="form-select" value={data.minatWirausaha} onChange={(e) => handleChange("minatWirausaha", e.target.value)}>
            <option value="">-- Pilih --</option>
            <option value="Ya">Ya, Berminat</option>
            <option value="Tidak">Tidak</option>
          </select>
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
          <label className="form-label" style={{ fontSize: "16px", color: "#0f172a" }}>
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
                        fontSize: "14px", 
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
                rows={5}
                style={{ 
                  resize: "vertical", 
                  padding: "12px 14px",
                  minHeight: "120px",
                  lineHeight: "1.5"
                }}
              />
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                Catatan: Jika ada lebih dari satu, pisahkan dengan baris baru (Enter).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}