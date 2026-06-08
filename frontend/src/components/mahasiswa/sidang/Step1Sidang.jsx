import { useState } from "react";
import { Check, GraduationCap, Info, Mail, Phone, User } from "lucide-react";
import { useSidangContext } from "../../../context/SidangFormContext";
import CustomAlert from "../../common/CustomAlert";

const TAK_MINIMUM = {
  Reguler: 60,
  "Alih Jenjang": 25,
  Diploma: 45,
};

export default function Step1({ studentInfo = {}, lecturers = [] }) {
  const { state, dispatch } = useSidangContext();
  const { data } = state;
  const [takAlert, setTakAlert] = useState(null);

  const updateField = (field, value) => {
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
    const current = data.jalurNonSidang || [];
    const next = current.includes(option)
      ? current.filter((i) => i !== option)
      : [...current, option];
    updateField("jalurNonSidang", next);
  };

  const pembimbing1 = lecturers.find(
    (lect) => String(lect.id) === String(data.dosenPembimbing1Id),
  );
  const pembimbing1Group =
    pembimbing1?.researchGroup?.name || pembimbing1?.researchGroupName || "-";

  //   TAK dengan validasi minimum 
  const handleTakChange = (value) => {
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
          </div>

          <div className="input-group">
            <label>Jumlah Total SKS Lulus</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={data.sks}
                onChange={(e) => updateField("sks", e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Nilai IPK Sebelum Sidang</label>
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
          </div>

          {/*  TAK  validasi minimum  */}
          <div className="input-group">
            <label>TAK</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={data.tak}
                onChange={(e) => handleTakChange(e.target.value)}
              />
            </div>
            <span className="helper-text">
              Poin minimum untuk TAK Mahasiswa Reguler : 60, Alih Jenjang : 25,
              Diploma : 45
            </span>
            {takAlert && (
              <div style={{ marginTop: "8px" }}>
                <CustomAlert type="warning" message={takAlert} />
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Tanggal Batas Akhir SKTA</label>
            <div className="input-with-icon">
              <input
                type="date"
                className="input-field"
                value={data.sktaExpDate}
                onChange={(e) => updateField("sktaExpDate", e.target.value)}
              />
            </div>
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
          </div>
          <div className="input-group">
            <label>Dosen Pembimbing 1</label>
            <div className="input-with-icon">
              <select
                className="input-field"
                value={data.dosenPembimbing1Id}
                onChange={(e) =>
                  updateField("dosenPembimbing1Id", e.target.value)
                }
              >
                <option value="">Pilih Dosen Pembimbing 1</option>
                {lecturers.map((lect) => (
                  <option key={lect.id} value={lect.id}>
                    {lect.lecturerCode || lect.kode || "-"} -{" "}
                    {lect.name || lect.nama} ({lect.researchGroup?.name || "-"})
                  </option>
                ))}
              </select>
            </div>
            <span className="helper-text">
              Kelompok keilmuan: {pembimbing1Group}
            </span>
          </div>
          <div className="input-group">
            <label>Nama Dosen Wali</label>
            <div className="input-with-icon">
              <div className="static-field">
                {studentInfo.dosenWaliNama || "-"}
              </div>
            </div>
          </div>
          <div className="input-group">
            <label>Dosen Pembimbing 2</label>
            <div className="input-with-icon">
              <select
                className="input-field"
                value={data.dosenPembimbing2Id}
                onChange={(e) =>
                  updateField("dosenPembimbing2Id", e.target.value)
                }
              >
                <option value="">Pilih Dosen Pembimbing 2</option>
                {lecturers.map((lect) => (
                  <option key={lect.id} value={lect.id}>
                    {lect.lecturerCode || lect.kode || "-"} -{" "}
                    {lect.name || lect.nama} ({lect.researchGroup?.name || "-"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>NIP Dosen Wali</label>
            <div className="input-with-icon">
              <div className="static-field">
                {studentInfo.dosenWaliNip || "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Skema Sidang</label>
          <div className="input-with-icon">
            <select
              className="input-field"
              value={data.sidangScheme}
              onChange={(e) => updateField("sidangScheme", e.target.value)}
            >
              <option value="">Pilih Skema Sidang</option>
              {skemas.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
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
          </div>
        )}

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Judul Tugas Akhir (Bahasa Indonesia) *</label>
          <textarea
            className="textarea-field"
            placeholder="Masukan Judul Tugas Akhir (Bahasa Indonesia)"
            value={data.thesisTitleId}
            onChange={(e) => updateField("thesisTitleId", e.target.value)}
          ></textarea>
        </div>

        <div className="input-group" style={{ marginTop: "2rem" }}>
          <label>Judul Tugas Akhir (Bahasa Inggris) *</label>
          <textarea
            className="textarea-field"
            placeholder="Masukan Judul Tugas Akhir (Bahasa Inggris)"
            value={data.thesisTitleEn}
            onChange={(e) => updateField("thesisTitleEn", e.target.value)}
          ></textarea>
          <span className="helper-text">
            Pastikan judul sesuai dengan yang tertera di SK TA terakhir.
          </span>
        </div>
      </section>
    </div>
  );
}