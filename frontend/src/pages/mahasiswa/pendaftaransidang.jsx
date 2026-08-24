import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../components/mahasiswa/sidang/sidang.css";
import logoSimta from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";
import {useSidangContext,SidangFormProvider,} from "../../context/SidangFormContext";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import Step1 from "../../components/mahasiswa/sidang/Step1Sidang";
import Step2 from "../../components/mahasiswa/sidang/Step2Sidang";
import CustomAlert from "../../components/common/CustomAlert";
import {getLecturers,getSidangRegistrationByStudentId,getSktaResponseUploadByStudentId,saveSidangRegistration,submitSidangRegistration,} from "../../service/api";
import {STATUS_SIDANG,SIDANG_STATUS_CONFIG,} from "../../components/admin/sidang/Sidangstatushelper";

const STEP1_REQUIRED = [
  { key: "programType",        label: "Program (Reguler / Alih Jenjang)" },
  { key: "sks",                label: "Jumlah Total SKS Lulus" },
  { key: "ipk",                label: "Nilai IPK Sebelum Sidang" },
  { key: "tak",                label: "TAK" },
  { key: "sktaExpDate",        label: "Tanggal Batas Akhir SKTA" },
  { key: "dosenPembimbing1Id", label: "Dosen Pembimbing 1" },
  { key: "dosenPembimbing2Id", label: "Dosen Pembimbing 2" },
  { key: "sidangScheme",       label: "Skema Sidang" },
  { key: "thesisTitleId",      label: "Judul Tugas Akhir (Bahasa Indonesia)" },
  { key: "thesisTitleEn",      label: "Judul Tugas Akhir (Bahasa Inggris)" },
];

const TAK_MINIMUM = { Reguler: 60, "Alih Jenjang": 25, Diploma: 45 };

import {
  REQUIRED_SLUGS,
  NON_SIDANG_SLUGS,
} from "../../requirement/sidangDocument";

function validateStep1(data) {
  for (const field of STEP1_REQUIRED) {
    const value = data[field.key];
    if (value === "" || value === null || value === undefined) {
      return `Kolom "${field.label}" wajib diisi.`;
    }
  }

  if (
    data.sidangScheme === "Non Sidang" &&
    (!data.jalurNonSidang || data.jalurNonSidang.length === 0)
  ) {
    return "Jalur Non Sidang wajib dipilih minimal satu opsi.";
  }

  const takMin = TAK_MINIMUM[data.programType] ?? TAK_MINIMUM.Reguler;
  if (Number(data.tak) < takMin) {
    return `TAK belum memenuhi minimum (${takMin} poin untuk program ${data.programType}).`;
  }

  if (
    data.dosenPembimbing1Id &&
    data.dosenPembimbing2Id &&
    String(data.dosenPembimbing1Id) === String(data.dosenPembimbing2Id)
  ) {
    return "Dosen Pembimbing 1 dan Dosen Pembimbing 2 tidak boleh sama.";
  }

  return null;
}

function validateStep2(data, documents) {
  if (!data.testBahasaPersyaratan) {
    return "Jawaban persyaratan Test Bahasa wajib dipilih.";
  }

  // Validasi berdasarkan slug
  const completedSlugs = documents
    .filter((d) => d.status === "completed")
    .map((d) => d.slug);

  // Cek REQUIRED_SLUGS wajib
  const missingSlugs = REQUIRED_SLUGS.filter(
    (slug) => !completedSlugs.includes(slug),
  );

  if (missingSlugs.length > 0) {
    const missingNames = documents
      .filter((d) => missingSlugs.includes(d.slug) && d.status !== "completed")
      .map((d) => d.name);

    const displayList =
      missingNames.length > 0
        ? missingNames.join(", ")
        : `${missingSlugs.length} dokumen wajib`;

    return `Dokumen berikut belum diunggah dan disimpan: ${displayList}.`;
  }

  // Cek slug Non Sidang jika skema Non Sidang
  if (data.sidangScheme === "Non Sidang" && data.jalurNonSidang?.length > 0) {
    for (const jalur of data.jalurNonSidang) {
      const jalurSlugs = NON_SIDANG_SLUGS[jalur] ?? [];
      const missingJalurSlugs = jalurSlugs.filter(
        (s) => !completedSlugs.includes(s),
      );
      if (missingJalurSlugs.length > 0) {
        return `Dokumen jalur "${jalur}" belum lengkap (${missingJalurSlugs.length} dokumen belum diunggah).`;
      }
    }
  }

  return null;
}

function PendaftaranSidangContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useSidangContext();
  const { user, profile } = useAuth();
  const { student } = useStudent();
  const { step, data, documents } = state;

  const [isSubmitting,          setIsSubmitting]          = useState(false);
  const [skta,                  setSkta]                  = useState(false);
  const [isSktaChecking,        setIsSktaChecking]        = useState(true);
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false);
  const [isSavingStep1,         setIsSavingStep1]         = useState(false);
  const [lecturers,             setLecturers]             = useState([]);
  const [registrationId,        setRegistrationId]        = useState(null);
  const [registrationMeta,      setRegistrationMeta]      = useState(null);
  const [sidangAdminResponse,   setSidangAdminResponse]   = useState(null);
  const [formAlert,             setFormAlert]             = useState(null);

  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;

  const isStep1Locked = Boolean(registrationMeta?.submittedAt);

  const isRevisionActive = Boolean(
    sidangAdminResponse?.isEdit !== null &&
    sidangAdminResponse?.isEdit !== undefined &&
    sidangAdminResponse?.message
  );

  const revisionDueDateText = sidangAdminResponse?.isEdit
    ? new Date(sidangAdminResponse.isEdit).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const revisiCfg = SIDANG_STATUS_CONFIG[STATUS_SIDANG.PERLU_REVISI];

  const studentInfo = {
    nama:          student?.namaLengkap || profile?.name || user?.username || "-",
    nim:           student?.nim         || profile?.nim  || "-",
    prodi:         student?.studyProgramNama || profile?.studyProgram?.name || "-",
    phone:         user?.phone || profile?.phone || user?.no_telp || "-",
    dosenWaliKode: student?.dosenWaliKode || profile?.dosenWali?.lecturerCode || "-",
    dosenWaliNama: student?.dosenWaliNama || profile?.dosenWali?.name || "-",
    dosenWaliNip:  student?.dosenWaliNip  || profile?.dosenWali?.nip  || "-",
  };

  const setStep = (val) => {
    setFormAlert(null);
    dispatch({ type: "SET_STEP", value: val });
  };

  const buildSavePayload = () => ({
    ...(registrationId ? { id: registrationId } : {}), 
    programType:        data.programType,
    sidangScheme:       data.sidangScheme,
    jalurNonSidang:     Array.isArray(data.jalurNonSidang) ? data.jalurNonSidang : [],
    sks:                data.sks ? Number(data.sks) : 0,
    ipk:                data.ipk ? Number(data.ipk) : 0,
    tak:                data.tak ? Number(data.tak) : 0,
    sktaExpDate:        data.sktaExpDate || null,
    thesisTitleId:      data.thesisTitleId,
    thesisTitleEn:      data.thesisTitleEn,
    mahasiswaId,
    dosenPembimbing1Id: data.dosenPembimbing1Id || null,
    dosenPembimbing2Id: data.dosenPembimbing2Id || null,
  });

  const handleSaveStep1 = async () => {
    setFormAlert(null);

    const error = validateStep1(data);
    if (error) {
      setFormAlert({ type: "error", msg: error });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!mahasiswaId) {
      setFormAlert({
        type: "error",
        msg: "Data mahasiswa tidak ditemukan. Silakan refresh halaman.",
      });
      return;
    }

    try {
      setIsSavingStep1(true);
      const result = await saveSidangRegistration(buildSavePayload());

      const savedId = result?.data?.id ?? null;
      if (savedId && !registrationId) {
        setRegistrationId(savedId);
      }

      setStep(2);
    } catch (e) {
      console.error("Gagal menyimpan pendaftaran sidang:", e);
      const msg =
        e.response?.data?.message ||
        "Gagal menyimpan data pendaftaran sidang. Silakan coba lagi.";
      setFormAlert({ type: "error", msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSavingStep1(false);
    }
  };

  const handleSubmit = async () => {
    setFormAlert(null);

    const error = validateStep2(data, documents);
    if (error) {
      setFormAlert({ type: "error", msg: error });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!registrationId) {
      setFormAlert({
        type: "error",
        msg: "ID pendaftaran tidak ditemukan. Silakan kembali ke Step 1 dan klik 'Simpan & Lanjutkan' terlebih dahulu.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitSidangRegistration({
        id: registrationId,       
        ...buildSavePayload(),    
      });

      localStorage.removeItem("sidang_form_draft");
      navigate("/mahasiswa/dashboard");
    } catch (error) {
      console.error("Submit failed:", error);
      console.error("Response dari BE:", error.response?.data);

      const msg =
        error.response?.data?.message ||
        "Gagal submit pendaftaran sidang. Silakan coba lagi.";
      setFormAlert({ type: "error", msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeDateInput = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().split("T")[0];
  };

  // Map BE response field names (Prisma) → form state keys (untuk buildSavePayload/request body)
  const applyRegistrationToForm = (registration) => {
    if (!registration) return;
    dispatch({
      type: "SET_INITIAL_DATA",
      payload: {
        // BE response: program → form state key: programType
        programType:        registration.program            || "",
        // BE response: skemaSidang → form state key: sidangScheme
        sidangScheme:       registration.skemaSidang        || "",

        jalurNonSidang:     Array.isArray(registration.jalurNonSidang)
                              ? registration.jalurNonSidang
                              : [],
        sks:                registration.sks               ?? "",
        ipk:                registration.ipk               ?? "",
        tak:                registration.tak               ?? "",
        sktaExpDate:        normalizeDateInput(registration.sktaExpDate),
        // BE response: judulTugasAkhirIndonesia → form state key: thesisTitleId
        thesisTitleId:      registration.judulTugasAkhirIndonesia || "",
        // BE response: judulTugasAkhirInggris → form state key: thesisTitleEn
        thesisTitleEn:      registration.judulTugasAkhirInggris   || "",
        dosenPembimbing1Id: registration.dosenPembimbing1Id
                              ? String(registration.dosenPembimbing1Id)
                              : "",
        dosenPembimbing2Id: registration.dosenPembimbing2Id
                              ? String(registration.dosenPembimbing2Id)
                              : "",
      },
    });
  };

  const initRegistration = async (id) => {
    setIsRegistrationLoading(true);
    try {
      // Response: { data: { id, isDraft, programType, ... } }
      const response = await getSidangRegistrationByStudentId(id);
      const existing = response?.data ?? response;

      if (!existing) {
        const created = await saveSidangRegistration({ mahasiswaId: id });
        const newId = created?.data?.id ?? null;
        setRegistrationId(newId);
        applyRegistrationToForm(created?.data ?? created);
        setRegistrationMeta(created?.data ?? created ?? null);
        return;
      }

      setRegistrationId(existing.id);
      applyRegistrationToForm(existing);
      setRegistrationMeta(existing);
      if (Array.isArray(existing.sidangRegistrationUploads) && existing.sidangRegistrationUploads.length > 0) {
        dispatch({ type: "RESTORE_SERVER_DOCUMENTS", uploads: existing.sidangRegistrationUploads });
      }

      setSidangAdminResponse(existing);
    } catch (e) {
      console.error("Gagal memuat data pendaftaran sidang:", e);
      setFormAlert({
        type: "warning",
        msg: "Gagal memuat data pendaftaran tersimpan. Form dimulai dari awal.",
      });
    } finally {
      setIsRegistrationLoading(false);
    }
  };

  async function checkSkta() {
    if (!mahasiswaId) {
      console.log("[DEBUG checkSkta] mahasiswaId tidak ditemukan");
      setIsSktaChecking(false);
      return;
    }
    console.log("[DEBUG checkSkta] Melakukan fetch untuk mahasiswaId:", mahasiswaId);
    try {
      const response = await getSktaResponseUploadByStudentId(mahasiswaId);
      console.log("[DEBUG checkSkta] Respon API:", response);
      const hasSkta = Array.isArray(response)
        ? response.length > 0
        : (!!response?.sktaDownloadUrl || !!response?.sktaUploadPath);
      console.log("[DEBUG checkSkta] hasSkta:", hasSkta);
      setSkta(hasSkta);
      if (hasSkta) await initRegistration(mahasiswaId);
    } catch (e) {
      if (e.response?.status === 404) {
        console.log("[DEBUG checkSkta] API mengembalikan 404");
        return;
      }
      console.error("Error fetching SKTA:", e);
    } finally {
      setIsSktaChecking(false);
    }
  }

  useEffect(() => { setIsSktaChecking(true); checkSkta(); }, [mahasiswaId]);

  useEffect(() => {
    let isMounted = true;
    getLecturers()
      .then((data) => { if (isMounted) setLecturers(data || []); })
      .catch((e) => console.error("Gagal memuat daftar dosen:", e));
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="page-wrapper">
      <div className="top-header-nav">
        <button
          className="btn-back-square"
          onClick={() => navigate("/mahasiswa/dashboard")}
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <div className="header-logos">
          <img src={logoSimta} alt="SIMTA Logo" className="simta-brand-logo" referrerPolicy="no-referrer" />
          <div className="logo-divider"></div>
          <img src={logoTelkom} alt="Telkom Logo" className="telkom-brand-logo" referrerPolicy="no-referrer" />
        </div>
      </div>

      <div className="simta-container">
        {isSktaChecking || isRegistrationLoading ? (
          <div className="skta-warning">
            <h2 className="skta-warning-title">Memuat Data Pendaftaran</h2>
            <p className="skta-warning-text">
              Sistem sedang memeriksa status SKTA dan data pendaftaran sidang.
            </p>
          </div>
        ) : skta ? (
          <>
            {isRevisionActive && (
              <div style={{ padding: "16px 24px 0", marginBottom: 16 }}>
                <div style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: revisiCfg.badgeBg,
                  border: `1.5px solid ${revisiCfg.borderColor}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 9999,
                      background: "#fff", color: revisiCfg.badgeColor,
                      border: `1.5px solid ${revisiCfg.borderColor}`,
                    }}>
                      {revisiCfg.label}
                    </span>
                    {revisionDueDateText && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: revisiCfg.badgeColor }}>
                        Batas waktu perbaikan: {revisionDueDateText}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: revisiCfg.badgeColor, lineHeight: 1.6 }}>
                    <strong>Catatan dari Admin:</strong> {sidangAdminResponse.message}
                  </p>
                </div>
              </div>
            )}

            {formAlert && (
              <div style={{ padding: "16px 24px 0" }}>
                <CustomAlert type={formAlert.type} message={formAlert.msg} />
              </div>
            )}

            <main>
              {step === 1 ? (
                <Step1
                  studentInfo={studentInfo}
                  lecturers={lecturers}
                  readOnly={isStep1Locked}
                  schemeLocked={isRevisionActive}
                />
              ) : (
                <Step2 registrationId={registrationId} />
              )}
            </main>

            <footer className="footer-nav">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button className="btn-pagination" onClick={() => setStep(1)} disabled={step === 1}>
                  <ChevronLeft size={16} />
                </button>
                <div className={`page-num ${step === 1 ? "active" : ""}`} onClick={() => setStep(1)}>1</div>
                <div className={`page-num ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>2</div>
                <button className="btn-pagination" onClick={() => setStep(2)} disabled={step === 2}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {step === 1 ? (
                <button
                  className="btn-primary"
                  onClick={handleSaveStep1}
                  disabled={isSavingStep1}
                >
                  {isSavingStep1 ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !registrationId}
                >
                  {isSubmitting ? "Mengirim..." : "Submit Pendaftaran"}
                </button>
              )}
            </footer>
          </>
        ) : (
          <div className="skta-warning">
            <h2 className="skta-warning-title">Pendaftaran Sidang Belum Tersedia</h2>
            <p className="skta-warning-text">
              SKTA kamu belum diterbitkan. Silakan tunggu hingga SKTA terbit sebelum mendaftar sidang.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PendaftaranSidang() {
  return (
    <SidangFormProvider>
      <PendaftaranSidangContent />
    </SidangFormProvider>
  );
}