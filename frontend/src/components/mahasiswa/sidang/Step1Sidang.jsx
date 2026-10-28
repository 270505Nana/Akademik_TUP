import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  GraduationCap,
  Info,
  Mail,
  Phone,
  User,
  Loader,
  AlertCircle,
  BookOpen,
  Hash,
  CheckCircle2,
  Calendar,
  X,
} from "lucide-react";
import { useSidangContext } from "../../../context/SidangFormContext";
import CustomAlert from "../../common/CustomAlert";

const TAK_MINIMUM = {
  Reguler: 60,
  "Alih Jenjang": 25,
  Diploma: 45,
};

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

const getResearchGroupName = (lect) =>
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

const formatDateID = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const StaticValue = ({ children }) => (
  <div className="sidang-static-field">{children ?? "-"}</div>
);

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

const LecturerDropdown = ({ lecturers = [], value, onChange, placeholder, excludeId, loading = false }) => {
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

  const displayText = loading
    ? "Memuat data dosen..."
    : selected
      ? formatLecturerShort(selected)
      : placeholder || "Pilih Dosen";

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={loading}
        onClick={() => !loading && setOpen((o) => !o)}
        className="sidang-input-field"
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.75 : 1,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: selected && !loading ? "#1E293B" : "#71717A",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "15px",
          }}
        >
          {loading && <Loader size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />}
          {displayText}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: "#94A3B8",
            transform: open ? "rotate(180deg)" : "none",
            transition: "0.2s",
          }}
        />
      </button>

      {open && !loading && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            maxHeight: "260px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau kode dosen..."
              style={{
                width: "100%",
                padding: "6px 10px",
                border: "1px solid #CBD5E1",
                borderRadius: 6,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                background: "#fff",
              }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: 13, color: "#94A3B8", textAlign: "center", fontStyle: "italic" }}>
                Dosen tidak ditemukan
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
                      background: isSelected ? "#FEF2F2" : "transparent",
                      color: isSelected ? "#C0182A" : "#334155",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F1F5F9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
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

export default function Step1({
  studentInfo = {},
  lecturers = [],
  loadingLecturers = false,
  readOnly = false,
  draftBanner = null,
  onCloseDraftBanner,
  isRevisionActive = false,
}) {
  const { state, dispatch } = useSidangContext();
  const { data } = state;
  const [takAlert, setTakAlert] = useState(null);

  const updateField = (field, value) => {
    if (readOnly) return;
    dispatch({ type: "UPDATE_FIELD", field, value });
  };

  const programs = ["Reguler", "Alih Jenjang"];
  const skemas = [
    "Sidang Reguler",
    "Non Sidang",
    "Capstone",
    "Sidang Khusus Prodi",
  ];
  const jalurNonSidangOptions = [
    "Publikasi Jurnal",
    "Proceeding International",
    "HKI",
  ];

  const toggleJalurNonSidang = (option) => {
    if (readOnly) return;
    const current = data.jalurNonSidang || [];
    const next = current.includes(option)
      ? current.filter((i) => i !== option)
      : [...current, option];
    updateField("jalurNonSidang", next);
  };

  const pembimbing1 = lecturers.find(
    (lect) => String(lect.id) === String(data.dosenPembimbing1Id),
  );
  const pembimbing2 = lecturers.find(
    (lect) => String(lect.id) === String(data.dosenPembimbing2Id),
  );
  const pembimbing1Group = getResearchGroupName(pembimbing1);

  const handleTakChange = (value) => {
    if (readOnly) return;
    updateField("tak", value);
    setTakAlert(null);

    if (value === "" || value === null) return;

    const numVal = Number(value);
    if (Number.isNaN(numVal)) return;

    const min = TAK_MINIMUM[data.programType] ?? TAK_MINIMUM.Reguler;

    if (numVal < min) {
      setTakAlert(
        `Maaf TAK Belum Memenuhi Minimum poin untuk program ${data.programType || "Reguler"}`,
      );
    }
  };

  const handleProgramTypeChange = (p) => {
    if (readOnly) return;
    updateField("programType", p);
    if (data.tak !== "") {
      const numVal = Number(data.tak);
      const min = TAK_MINIMUM[p] ?? TAK_MINIMUM.Reguler;
      if (!Number.isNaN(numVal) && numVal < min) {
        setTakAlert(
          `Maaf TAK Belum Memenuhi Minimum poin untuk program ${p}, silahkan input ulang`,
        );
      } else {
        setTakAlert(null);
      }
    }
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
                Pastikan data diri kamu di bawah ini sudah sesuai sebelum melanjutkan pendaftaran sidang.
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

        <div className="sidang-info-grid">
          <InfoCard label="Nama Lengkap" icon={User} value={studentInfo.nama || "-"} />
          <InfoCard label="NIM (Nomor Induk Mahasiswa)" icon={Hash} value={studentInfo.nim || "-"} />
          <InfoCard label="Program Studi" icon={GraduationCap} value={studentInfo.prodi || "-"} />
          <InfoCard label="No. Handphone" icon={Phone} value={studentInfo.phone || "-"} />
          <InfoCard
            label="Dosen Wali"
            icon={User}
            value={`${studentInfo.dosenWaliKode || "-"} - ${studentInfo.dosenWaliNama || "-"}`}
          />
          <InfoCard label="NIP Dosen Wali" icon={User} value={studentInfo.dosenWaliNip || "-"} />
        </div>
      </section>

      {/* Section 2: Data Akademik & Program */}
      <section className="form-section" style={{ marginBottom: "2.5rem" }}>
        <div className="sidang-section-head">
          <h3>Data Akademik &amp; Program</h3>
        </div>

        <div className="sidang-form-grid">
          {/* Program Selector */}
          <div className="sidang-input-group" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <label style={{ margin: 0 }}>Program <span style={{ color: "red" }}>*</span></label>
              <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                Alih jenjang hanya untuk yang ekstensi D3 ke S1 TT
              </span>
            </div>
            {readOnly ? (
              <StaticValue>{data.programType || "-"}</StaticValue>
            ) : (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {programs.map((p) => {
                  const isActive = data.programType === p;
                  return (
                    <div
                      key={p}
                      onClick={() => handleProgramTypeChange(p)}
                      style={{
                        flex: "1 1 180px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 16px",
                        border: `1.5px solid ${isActive ? "#C0182A" : "#E2E8F0"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: isActive ? "#FFF5F5" : "#F4F4F5",
                        fontWeight: 600,
                        fontSize: "14px",
                        color: isActive ? "#C0182A" : "#1E293B",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: `1.5px solid ${isActive ? "#C0182A" : "#CBD5E1"}`,
                          background: isActive ? "#C0182A" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isActive && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                      <span>{p}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SKS Lulus */}
          <div className="sidang-input-group">
            <label>Jumlah Total SKS Lulus <span style={{ color: "red" }}>*</span></label>
            {readOnly ? (
              <StaticValue>{data.sks || "-"}</StaticValue>
            ) : (
              <input
                type="number"
                className="sidang-input-field"
                placeholder="0"
                value={data.sks}
                onChange={(e) => updateField("sks", e.target.value)}
              />
            )}
          </div>

          {/* Nilai IPK Sebelum Sidang */}
          <div className="sidang-input-group">
            <label>Nilai IPK Sebelum Sidang <span style={{ color: "red" }}>*</span></label>
            {readOnly ? (
              <StaticValue>{data.ipk || "-"}</StaticValue>
            ) : (
              <input
                type="number"
                step="0.01"
                className="sidang-input-field"
                placeholder="0.00"
                value={data.ipk}
                onChange={(e) => updateField("ipk", e.target.value)}
              />
            )}
          </div>

          {/* TAK dengan Validasi */}
          <div className="sidang-input-group">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <label style={{ margin: 0 }}>TAK <span style={{ color: "red" }}>*</span></label>
              {!readOnly && (
                <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
                  Poin minimum untuk TAK Mahasiswa Reguler: 60, Alih Jenjang: 25, Diploma: 45
                </span>
              )}
            </div>
            {readOnly ? (
              <StaticValue>{data.tak || "-"}</StaticValue>
            ) : (
              <input
                type="number"
                className="sidang-input-field"
                style={takAlert ? { borderColor: "#ef4444" } : undefined}
                placeholder="0"
                value={data.tak}
                onChange={(e) => handleTakChange(e.target.value)}
              />
            )}
            {takAlert && !readOnly && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", fontWeight: 500 }}>
                ⚠️ {takAlert}
              </p>
            )}
          </div>

          {/* Tanggal Batas Akhir SKTA */}
          <div className="sidang-input-group">
            <label>Tanggal Batas Akhir SKTA <span style={{ color: "red" }}>*</span></label>
            {readOnly ? (
              <StaticValue>{formatDateID(data.sktaExpDate)}</StaticValue>
            ) : (
              <input
                type="date"
                className="sidang-input-field"
                value={data.sktaExpDate}
                onChange={(e) => updateField("sktaExpDate", e.target.value)}
              />
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Informasi Tugas Akhir & Pembimbing */}
      <section className="form-section">
        <div className="sidang-section-head">
          <h3>Informasi Tugas Akhir &amp; Pembimbing</h3>
        </div>

        <div className="sidang-form-grid">
          {/* Dosen Pembimbing 1 */}
          <div className="sidang-input-group">
            <label>Dosen Pembimbing 1 <span style={{ color: "red" }}>*</span></label>
            {readOnly ? (
              <StaticValue>{formatLecturer(pembimbing1)}</StaticValue>
            ) : (
              <LecturerDropdown
                lecturers={lecturers}
                value={data.dosenPembimbing1Id}
                onChange={(id) => updateField("dosenPembimbing1Id", id)}
                placeholder="Pilih Dosen Pembimbing 1"
                excludeId={data.dosenPembimbing2Id}
                loading={loadingLecturers}
              />
            )}
          </div>

          {/* Dosen Pembimbing 2 */}
          <div className="sidang-input-group">
            <label>Dosen Pembimbing 2 </label>
            {readOnly ? (
              <StaticValue>{formatLecturer(pembimbing2)}</StaticValue>
            ) : (
              <LecturerDropdown
                lecturers={lecturers}
                value={data.dosenPembimbing2Id}
                onChange={(id) => updateField("dosenPembimbing2Id", id)}
                placeholder="Pilih Dosen Pembimbing 2"
                excludeId={data.dosenPembimbing1Id}
                loading={loadingLecturers}
              />
            )}
          </div>
        </div>

        {/* Kelompok Keilmuan — otomatis mengikuti KK Dosen Pembimbing 1 */}
        <div className="sidang-input-group" style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <label style={{ margin: 0 }}>Kelompok Keilmuan </label>
            <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
              Otomatis diambil dari KK Dosen Pembimbing 1
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
            {kelompokKeilmuan.map((item) => {
              const isSelected =
                pembimbing1Group !== "-" &&
                pembimbing1Group.trim().toUpperCase() === item.label.trim().toUpperCase();
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${isSelected ? "#C0182A" : "#E2E8F0"}`,
                    background: isSelected ? "#FEF2F2" : "#F8FAFC",
                    cursor: "default",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      border: `2px solid ${isSelected ? "#C0182A" : "#CBD5E1"}`,
                      background: isSelected ? "#C0182A" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#B91C1C" : "#64748B",
                      lineHeight: 1.4,
                      userSelect: "none",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          {!pembimbing1 && (
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 8, fontStyle: "italic" }}>
              Pilih Dosen Pembimbing 1 terlebih dahulu untuk menentukan kelompok keilmuan.
            </p>
          )}
        </div>

        {/* Skema Sidang */}
        <div className="sidang-input-group" style={{ marginTop: "1.75rem" }}>
          <label>Skema Sidang <span style={{ color: "red" }}>*</span></label>
          {readOnly ? (
            <StaticValue>{data.sidangScheme || "-"}</StaticValue>
          ) : (
            <select
              className="sidang-input-field"
              style={!data.sidangScheme ? { color: "#71717A" } : undefined}
              value={data.sidangScheme}
              onChange={(e) => {
                const val = e.target.value;
                updateField("sidangScheme", val);
                if (val !== "Non Sidang") {
                  updateField("jalurNonSidang", []);
                }
              }}
            >
              <option value="" style={{ color: "#71717A" }}>-- Pilih Skema Sidang --</option>
              {skemas.map((s) => (
                <option key={s} value={s} style={{ color: "#1E293B" }}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Jalur Non Sidang jika skema Non Sidang dipilih */}
        {data.sidangScheme === "Non Sidang" && (
          <div
            className="sidang-input-group"
            style={{
              marginTop: "1.75rem",
              padding: "1.25rem",
              background: "#F8FAFC",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            <label style={{ color: "#C0182A" }}>Jalur Non Sidang *</label>
            <span style={{ fontSize: "11.5px", color: "#64748B" }}>
              Pilih opsi publikasi yang sesuai
            </span>

            {readOnly ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                {(data.jalurNonSidang || []).length > 0 ? (
                  data.jalurNonSidang.map((option) => (
                    <span
                      key={option}
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 9999,
                        background: "#F0FDF4",
                        border: "1.5px solid #BBF7D0",
                        color: "#166534",
                      }}
                    >
                      {option}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "#94A3B8", fontStyle: "italic" }}>
                    Tidak ada jalur non sidang dipilih.
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "0.75rem",
                }}
              >
                {jalurNonSidangOptions.map((option) => {
                  const isChecked = data.jalurNonSidang?.includes(option);
                  return (
                    <div
                      key={option}
                      onClick={() => toggleJalurNonSidang(option)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        border: `1.5px solid ${isChecked ? "#C0182A" : "#CBD5E1"}`,
                        background: isChecked ? "#FFF5F5" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: `1.5px solid ${isChecked ? "#C0182A" : "#CBD5E1"}`,
                          background: isChecked ? "#C0182A" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check color="white" size={12} strokeWidth={3} />}
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? "#C0182A" : "#1E293B",
                        }}
                      >
                        {option}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Judul Tugas Akhir Bahasa Indonesia */}
        <div className="sidang-input-group" style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <label style={{ margin: 0 }}>Judul Tugas Akhir (Bahasa Indonesia) <span style={{ color: "red" }}>*</span></label>
            {!readOnly && (
              <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
                Pastikan judul sesuai dengan yang tertera di SK TA terakhir.
              </span>
            )}
          </div>
          {readOnly ? (
            <StaticValue>{data.thesisTitleId || "-"}</StaticValue>
          ) : (
            <textarea
              className="sidang-textarea-field"
              rows={2}
              placeholder="Masukan Judul Tugas Akhir (Bahasa Indonesia)"
              value={data.thesisTitleId}
              onChange={(e) => updateField("thesisTitleId", e.target.value)}
            />
          )}
        </div>

        {/* Judul Tugas Akhir Bahasa Inggris */}
        <div className="sidang-input-group" style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <label style={{ margin: 0 }}>Judul Tugas Akhir (Bahasa Inggris) <span style={{ color: "red" }}>*</span></label>
            {!readOnly && (
              <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
                Pastikan judul sesuai dengan yang tertera di SK TA terakhir.
              </span>
            )}
          </div>
          {readOnly ? (
            <StaticValue>{data.thesisTitleEn || "-"}</StaticValue>
          ) : (
            <textarea
              className="sidang-textarea-field"
              rows={2}
              placeholder="Masukan Judul Tugas Akhir (Bahasa Inggris)"
              value={data.thesisTitleEn}
              onChange={(e) => updateField("thesisTitleEn", e.target.value)}
            />
          )}
        </div>
      </section>
    </div>
  );
}