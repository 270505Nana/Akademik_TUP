import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, GraduationCap, Info, Mail, Phone, User, Loader, AlertCircle } from "lucide-react";
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
  <div className="static-field">{children ?? "-"}</div>
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
        className="input-field"
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: loading ? "#F8FAFC" : "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.75 : 1,
        }}
      >
        <span style={{
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: selected && !loading ? "inherit" : "#94A3B8",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          {loading && <Loader size={14} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />}
          {displayText}
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, color: "#94A3B8" }} />
      </button>

      {open && !loading && (
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

export default function Step1({
  studentInfo = {},
  lecturers = [],
  loadingLecturers = false,
  autosaveStatus = "idle",
  readOnly = false,
  schemeLocked = false,
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
    if (readOnly || schemeLocked) return;
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

  const isSchemeLocked = schemeLocked;

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
        `Maaf TAK Belum Memenuhi Minimum (${min} poin untuk program ${data.programType || "Reguler"}), silahkan input ulang`,
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
          `Maaf TAK Belum Memenuhi Minimum (${min} poin untuk program ${p}), silahkan input ulang`,
        );
      } else {
        setTakAlert(null);
      }
    }
  };

  return (
    <div className="step-content">
      {readOnly && (
        <div className="info-banner" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <div className="banner-icon-container" style={{ background: "#DCFCE7" }}>
            <Check color="#16A34A" size={24} />
          </div>
          <div className="banner-content">
            <h4 style={{ color: "#166534" }}>Data Sudah Terkunci</h4>
            <p>
              Data diri & akademik di tahap ini tidak bisa diubah lagi karena
              pendaftaran sidang sudah di submit. Jika ada kesalahan
              data, silakan hubungi admin akademik.
            </p>
          </div>
        </div>
      )}

      <div className="info-banner">
        <div className="banner-icon-container">
          <Info color="#d69e2e" size={24} />
        </div>
        <div className="banner-content">
          <h4>Pendaftaran Sidang Telkom University Purwokerto</h4>
          <p>
            Sebelum melengkapi data pendaftaran sidang, silahkan pelajari dan
            pahami informasi terkait pendaftaran sidang pada tautan :{" "}
            <a href="https://tel-u.ac.id/panduansidangtup">
              https://tel-u.ac.id/panduansidangtup
            </a>
          </p>
          <p>
            <strong>Harap Baca Dengan Teliti</strong>
          </p>
        </div>
        <div
          className="contact-person-badge"
          onClick={() => window.open("https://wa.me/6285117001281", "_blank")}
        >
          <Mail size={16} />
          <span>
            Contact Person : Helpdesk Layanan Sidang-Yudisium TUP
          </span>
        </div>
      </div>

      <div className="step-title-container">
        <div className="step-label">Step 1</div>
        <h2 className="step-main-title">
          Pendaftaran Sidang Telkom University Purwokerto
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
            <span className="helper-text">
              Nama terverifikasi oleh sistem secara otomatis.
            </span>
          </div>

          <div className="input-group">
            <label>NIM (NOMOR INDUK MAHASISWA) *</label>
            <div className="input-with-icon">
              <div className="static-field">{studentInfo.nim || "-"}</div>
            </div>
            <span className="helper-text">
              NIM terverifikasi oleh sistem secara otomatis.
            </span>
          </div>

          <div className="input-group">
            <label>Program Studi</label>
            <div className="input-with-icon">
              <GraduationCap className="input-icon" size={18} />
              <div className="static-field">{studentInfo.prodi || "-"}</div>
            </div>
            <span className="helper-text">
              Program Studi terverifikasi oleh sistem secara otomatis.
            </span>
          </div>

          <div className="input-group">
            <label>No. HP</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={18} />
              <div className="static-field">{studentInfo.phone || "-"}</div>
            </div>
            <span className="helper-text">
              No. HP terverifikasi oleh sistem secara otomatis.
            </span>
          </div>

          <div className="input-group">
            <label>Program</label>
            {readOnly ? (
              <StaticValue>{data.programType || "-"}</StaticValue>
            ) : (
              <div className="program-selector">
                {programs.map((p) => (
                  <div
                    key={p}
                    className={`program-card ${data.programType === p ? "active" : ""}`}
                    onClick={() => handleProgramTypeChange(p)}
                  >
                    <div className="checkbox-visual">
                      {data.programType === p && (
                        <span className="checkbox-dot" />
                      )}
                    </div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Jumlah Total SKS Lulus</label>
            {readOnly ? (
              <StaticValue>{data.sks || "-"}</StaticValue>
            ) : (
              <div className="input-with-icon">
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={data.sks}
                  onChange={(e) => updateField("sks", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Nilai IPK Sebelum Sidang</label>
            {readOnly ? (
              <StaticValue>{data.ipk || "-"}</StaticValue>
            ) : (
              <div className="input-with-icon">
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                  value={data.ipk}
                  onChange={(e) => updateField("ipk", e.target.value)}
                />
              </div>
            )}
          </div>

          {/*  TAK  validasi minimum  */}
          <div className="input-group">
            <label>TAK</label>
            {readOnly ? (
              <StaticValue>{data.tak || "-"}</StaticValue>
            ) : (
              <div className="input-with-icon">
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={data.tak}
                  onChange={(e) => handleTakChange(e.target.value)}
                />
              </div>
            )}
            {!readOnly && (
              <span className="helper-text">
                Poin minimum untuk TAK Mahasiswa Reguler : 60, Alih Jenjang : 25,
                Diploma : 45
              </span>
            )}
            {takAlert && !readOnly && (
              <div style={{ marginTop: "8px" }}>
                <CustomAlert type="warning" message={takAlert} />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Tanggal Batas Akhir SKTA</label>
            {readOnly ? (
              <StaticValue>{formatDateID(data.sktaExpDate)}</StaticValue>
            ) : (
              <div className="input-with-icon">
                <input
                  type="date"
                  className="input-field"
                  value={data.sktaExpDate}
                  onChange={(e) => updateField("sktaExpDate", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-head">Informasi Tugas Akhir</h3>
        <div className="form-grid">
          <div className="input-group">
            <label>Kode Dosen Wali</label>
            <div className="input-with-icon">
              <div className="static-field">
                {studentInfo.dosenWaliKode || "-"}
              </div>
            </div>
            <span className="helper-text">Terverifikasi oleh sistem secara otomatis.</span>
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
                placeholder="Pilih Dosen Pembimbing 1"
                excludeId={data.dosenPembimbing2Id}
                loading={loadingLecturers}
              />
            )}
          </div>
          <div className="input-group">
            <label>Nama Dosen Wali</label>
            <div className="input-with-icon">
              <div className="static-field">
                {studentInfo.dosenWaliNama || "-"}
              </div>
            </div>
            <span className="helper-text">Terverifikasi oleh sistem secara otomatis.</span>
          </div>
          <div className="input-group">
            <label>Dosen Pembimbing 2</label>
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
          <div className="input-group">
            <label>NIP Dosen Wali</label>
            <div className="input-with-icon">
              <div className="static-field">
                {studentInfo.dosenWaliNip || "-"}
              </div>
            </div>
            <span className="helper-text">Terverifikasi oleh sistem secara otomatis.</span>
          </div>
        </div>

        {/* Kelompok Keilmuan — otomatis mengikuti KK Dosen Pembimbing 1 */}
        <div className="input-group" style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <label style={{ margin: 0 }}>Kelompok Keilmuan</label>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>
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
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 8,
                    border: `1.5px solid ${isSelected ? "#C0182A" : "#E5E7EB"}`,
                    background: isSelected ? "#FEF2F2" : "#F9FAFB",
                    cursor: "default", transition: "all 0.15s ease",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isSelected ? "#C0182A" : "#D1D5DB"}`,
                    background: isSelected ? "#C0182A" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#B91C1C" : "#6B7280",
                    lineHeight: 1.4, userSelect: "none",
                  }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          {!pembimbing1 && (
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, fontStyle: "italic" }}>
              Pilih Dosen Pembimbing 1 terlebih dahulu untuk menentukan kelompok keilmuan.
            </p>
          )}
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Skema Sidang</label>
          {isSchemeLocked ? (
            <StaticValue>{data.sidangScheme || "-"}</StaticValue>
          ) : (
            <div className="input-with-icon">
              <select
                className="input-field"
                value={data.sidangScheme}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField("sidangScheme", val);
                  if (val !== "Non Sidang") {
                    updateField("jalurNonSidang", []);
                  }
                }}
              >
                <option value="">Pilih Skema Sidang</option>
                {skemas.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {data.sidangScheme === "Non Sidang" && (
          <div
            className="input-group"
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px solid var(--border-grey)",
            }}
          >
            <label style={{ color: "var(--primary-red)" }}>
              Jalur Non Sidang *
            </label>
            <span className="helper-text">
              Pilih opsi publikasi yang sesuai
            </span>

            {isSchemeLocked ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
                {(data.jalurNonSidang || []).length > 0 ? (
                  data.jalurNonSidang.map((option) => (
                    <span
                      key={option}
                      style={{
                        fontSize: "0.8rem", fontWeight: 700, padding: "4px 12px",
                        borderRadius: 9999, background: "#F0FDF4",
                        border: "1.5px solid #BBF7D0", color: "#166534",
                      }}
                    >
                      {option}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-grey)", fontStyle: "italic" }}>
                    Tidak ada jalur non sidang dipilih.
                  </span>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                {jalurNonSidangOptions.map((option) => (
                  <div
                    key={option}
                    className={`program-card ${data.jalurNonSidang?.includes(option) ? "active" : ""}`}
                    onClick={() => toggleJalurNonSidang(option)}
                    style={{ padding: "0.5rem 1rem" }}
                  >
                    <div className="checkbox-visual">
                      {data.jalurNonSidang?.includes(option) && (
                        <Check color="white" size={14} strokeWidth={3} />
                      )}
                    </div>
                    <span style={{ fontSize: "0.85rem" }}>{option}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Judul Tugas Akhir (Bahasa Indonesia) *</label>
          {readOnly ? (
            <StaticValue>{data.thesisTitleId || "-"}</StaticValue>
          ) : (
            <>
            <textarea
              className="textarea-field"
              placeholder="Masukan Judul Tugas Akhir (Bahasa Indonesia)"
              value={data.thesisTitleId}
              onChange={(e) => updateField("thesisTitleId", e.target.value)}
            ></textarea>
            <span className="helper-text">
                Pastikan judul sesuai dengan yang tertera di SK TA terakhir.
              </span>
            </>
          )}
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Judul Tugas Akhir (Bahasa Inggris) *</label>
          {readOnly ? (
            <StaticValue>{data.thesisTitleEn || "-"}</StaticValue>
          ) : (
            <>
              <textarea
                className="textarea-field"
                placeholder="Masukan Judul Tugas Akhir (Bahasa Inggris)"
                value={data.thesisTitleEn}
                onChange={(e) => updateField("thesisTitleEn", e.target.value)}
              ></textarea>
              <span className="helper-text">
                Pastikan judul sesuai dengan yang tertera di SK TA terakhir.
              </span>
            </>
          )}
        </div>
      </section>
    </div>
  );
}