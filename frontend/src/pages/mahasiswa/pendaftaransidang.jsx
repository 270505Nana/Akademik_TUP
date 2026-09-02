import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../components/mahasiswa/sidang/sidang.css";
import logoSimta from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";
import { useSidangContext, SidangFormProvider } from "../../context/SidangFormContext";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import Step1 from "../../components/mahasiswa/sidang/Step1Sidang";
import Step2 from "../../components/mahasiswa/sidang/Step2Sidang";
import CustomAlert from "../../components/common/CustomAlert";

import {
  getLecturers,
  getSidangRegistrationByStudentId,
  getSktaResponseUploadByStudentId,
  saveSidangRegistration,
  submitSidangRegistration,
  getTemplatesByCategory,
} from "../../service/api";
import { STATUS_SIDANG, SIDANG_STATUS_CONFIG } from "../../components/admin/sidang/Sidangstatushelper";
import {
  SECTIONS,
  NON_SIDANG_SLUGS,
  DYNAMIC_SECTION_CATEGORY_MAP,
} from "../../requirement/sidangDocument";

const STEP1_REQUIRED = [
  { key: "programType", label: "Program (Reguler / Alih Jenjang)" },
  { key: "sks", label: "Jumlah Total SKS Lulus" },
  { key: "ipk", label: "Nilai IPK Sebelum Sidang" },
  { key: "tak", label: "TAK" },
  { key: "sktaExpDate", label: "Tanggal Batas Akhir SKTA" },
  { key: "dosenPembimbing1Id", label: "Dosen Pembimbing 1" },
  { key: "dosenPembimbing2Id", label: "Dosen Pembimbing 2" },
  { key: "sidangScheme", label: "Skema Sidang" },
  { key: "thesisTitleId", label: "Judul Tugas Akhir (Bahasa Indonesia)" },
  { key: "thesisTitleEn", label: "Judul Tugas Akhir (Bahasa Inggris)" },
];

const TAK_MINIMUM = { Reguler: 60, "Alih Jenjang": 25, Diploma: 45 };

function validateStep1(data) {
  for (const field of STEP1_REQUIRED) {
    const value = data[field.key];
    if (value === "" || value === null || value === undefined) {
      return `Kolom "${field.label}" wajib diisi.`;
    }
  }

  if (data.sidangScheme === "Non Sidang" && (!data.jalurNonSidang || data.jalurNonSidang.length === 0)) {
    return "Jalur Non Sidang wajib dipilih minimal satu opsi.";
  }

  const takMin = TAK_MINIMUM[data.programType] ?? TAK_MINIMUM.Reguler;
  if (Number(data.tak) < takMin) {
    return `TAK belum memenuhi minimum (${takMin} poin untuk program ${data.programType}).`;
  }

  if (data.dosenPembimbing1Id && data.dosenPembimbing2Id && String(data.dosenPembimbing1Id) === String(data.dosenPembimbing2Id)) {
    return "Dosen Pembimbing 1 dan Dosen Pembimbing 2 tidak boleh sama.";
  }

  return null;
}

/*
 * VALIDASI STEP 2:
 * 1. Pilihan radio Test Bahasa ("Sudah" / "Belum") wajib diisi.
 * 2. Berkas Test Bahasa sesuai opsi yang dipilih wajib diunggah dan disimpan (secara dinamis dari state documents).
 * 3. Berkas Wajib Sidang wajib diunggah dan disimpan.
 * 4. Berkas Jalur Non-Sidang (NON_SIDANG_SLUGS) wajib diunggah jika skema Non-Sidang dipilih.
 */
function validateStep2(data, documents) {
  if (!data.testBahasaPersyaratan) {
    return "Jawaban persyaratan Test Bahasa wajib dipilih.";
  }

  const completedSlugs = documents.filter((d) => d.status === "completed").map((d) => d.slug);

  // Percabangan validasi dokumen Test Bahasa secara dinamis sesuai opsi "Sudah" / "Belum"
  const activeSection = data.testBahasaPersyaratan === "Sudah"
    ? SECTIONS.TEST_BAHASA_SUDAH
    : data.testBahasaPersyaratan === "Belum"
      ? SECTIONS.TEST_BAHASA_BELUM
      : null;
  const testBahasaSlugs = activeSection
    ? documents.filter((d) => d.section === activeSection).map((d) => d.slug)
    : [];

  const missingTestBahasaSlugs = testBahasaSlugs.filter((slug) => !completedSlugs.includes(slug));
  if (missingTestBahasaSlugs.length > 0) {
    const missingNames = documents
      .filter((d) => missingTestBahasaSlugs.includes(d.slug) && d.status !== "completed")
      .map((d) => d.name);
    const displayList = missingNames.length > 0 ? missingNames.join(", ") : `${missingTestBahasaSlugs.length} dokumen`;
    return `Dokumen Test Bahasa belum lengkap diunggah: ${displayList}.`;
  }

  // Validasi Berkas Wajib Sidang (secara dinamis dari daftar dokumen SECTIONS.WAJIB di state)
  const wajibDocs = documents.filter((d) => d.section === SECTIONS.WAJIB);
  const missingWajibDocs = wajibDocs.filter((d) => d.status !== "completed");
  if (missingWajibDocs.length > 0) {
    const missingNames = missingWajibDocs.map((d) => d.name).join(", ");
    return `Dokumen berikut belum diunggah dan disimpan: ${missingNames}.`;
  }

  // Validasi Berkas Jalur Non-Sidang (jika skema Non-Sidang dipilih)
  if (data.sidangScheme === "Non Sidang" && data.jalurNonSidang?.length > 0) {
    for (const jalur of data.jalurNonSidang) {
      const jalurSlugs = NON_SIDANG_SLUGS[jalur] ?? [];
      const missingJalurSlugs = jalurSlugs.filter((s) => !completedSlugs.includes(s));
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skta, setSkta] = useState(false);
  const [isSktaChecking, setIsSktaChecking] = useState(true);
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [isLecturersLoading, setIsLecturersLoading] = useState(true);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [registrationId, setRegistrationId] = useState(null);
  const [registrationMeta, setRegistrationMeta] = useState(null);
  const [sidangAdminResponse, setSidangAdminResponse] = useState(null);
  const [formAlert, setFormAlert] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState("idle"); 

  const isHydrating = useRef(true);
  const lastSavedPayload = useRef(null);
  const latestRequestId = useRef(0);
  const serverUploadsRef = useRef([]);

  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;
  const isStep1Locked = Boolean(registrationMeta?.submittedAt);
  const isRevisionActive = Boolean(sidangAdminResponse?.isEdit !== null && sidangAdminResponse?.isEdit !== undefined && sidangAdminResponse?.message);
  const revisionDueDateText = sidangAdminResponse?.isEdit
    ? new Date(sidangAdminResponse.isEdit).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const revisiCfg = SIDANG_STATUS_CONFIG[STATUS_SIDANG.PERLU_REVISI];

  const studentInfo = {
    nama: student?.namaLengkap || profile?.name || user?.username || "-",
    nim: student?.nim || profile?.nim || "-",
    prodi: student?.studyProgramNama || profile?.studyProgram?.name || "-",
    phone: user?.phone || profile?.phone || user?.no_telp || "-",
    dosenWaliKode: student?.dosenWaliKode || profile?.dosenWali?.lecturerCode || "-",
    dosenWaliNama: student?.dosenWaliNama || profile?.dosenWali?.name || "-",
    dosenWaliNip: student?.dosenWaliNip || profile?.dosenWali?.nip || "-",
  };

  const setStep = (val) => {
    setFormAlert(null);
    dispatch({ type: "SET_STEP", value: val });
  };

  const buildSavePayload = () => ({
    ...(registrationId ? { id: registrationId } : {}),
    programType: data.programType,
    sidangScheme: data.sidangScheme,
    jalurNonSidang:
      data.sidangScheme === "Non Sidang" && Array.isArray(data.jalurNonSidang)
        ? data.jalurNonSidang
        : [],
    lulusTesBahasa:
      data.testBahasaPersyaratan === "Sudah"
        ? true
        : data.testBahasaPersyaratan === "Belum"
          ? false
          : null,
    testBahasaPersyaratan: data.testBahasaPersyaratan || null,
    sks: data.sks ? Number(data.sks) : 0,
    ipk: data.ipk ? Number(data.ipk) : 0,
    tak: data.tak ? Number(data.tak) : 0,
    sktaExpDate: data.sktaExpDate || null,
    thesisTitleId: data.thesisTitleId ? data.thesisTitleId.trim() : "",
    thesisTitleEn: data.thesisTitleEn ? data.thesisTitleEn.trim() : "",
    mahasiswaId: String(mahasiswaId),
    dosenPembimbing1Id: data.dosenPembimbing1Id ? String(data.dosenPembimbing1Id) : null,
    dosenPembimbing2Id: data.dosenPembimbing2Id ? String(data.dosenPembimbing2Id) : null,
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
      setFormAlert({ type: "error", msg: "Data mahasiswa tidak ditemukan. Silakan refresh halaman." });
      return;
    }

    try {
      setIsSavingStep1(true);
      const result = await saveSidangRegistration(buildSavePayload());
      const savedId = result?.data?.id ?? result?.id ?? null;
      if (savedId && !registrationId) {
        setRegistrationId(savedId);
        dispatch({ type: "SET_REGISTRATION_ID", id: savedId });
      }
      setStep(2);
    } catch (e) {
      const serverErrors = e.response?.data?.errors;
      const msg = Array.isArray(serverErrors) && serverErrors.length > 0
        ? serverErrors.map((err) => err.message).join(", ")
        : (e.response?.data?.message || "Gagal menyimpan data pendaftaran sidang. Silakan coba lagi.");
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
      setFormAlert({ type: "error", msg: "ID pendaftaran tidak ditemukan. Silakan kembali ke Step 1 dan klik 'Simpan & Lanjutkan' terlebih dahulu." });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitSidangRegistration({ id: registrationId, ...buildSavePayload() });
      localStorage.removeItem("sidang_form_draft");
      navigate("/mahasiswa/dashboard");
    } catch (error) {
      const serverErrors = error.response?.data?.errors;
      const msg = Array.isArray(serverErrors) && serverErrors.length > 0
        ? serverErrors.map((err) => err.message).join(", ")
        : (error.response?.data?.message || "Gagal submit pendaftaran sidang. Silakan coba lagi.");
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

  const applyRegistrationToForm = (registration) => {
    if (!registration) return;
    dispatch({
      type: "SET_INITIAL_DATA",
      payload: {
        id: registration.id || null,
        mahasiswaId: registration.mahasiswaId || null,
        programType: registration.program || "",
        sidangScheme: registration.skemaSidang || "",
        jalurNonSidang: Array.isArray(registration.jalurNonSidang) ? registration.jalurNonSidang : [],
        testBahasaPersyaratan:
          registration.lulusTesBahasa === true
            ? "Sudah"
            : registration.lulusTesBahasa === false
              ? "Belum"
              : null,
        sks: registration.sks ?? "",
        ipk: registration.ipk ?? "",
        tak: registration.tak ?? "",
        sktaExpDate: normalizeDateInput(registration.sktaExpDate),
        thesisTitleId: registration.judulTugasAkhirIndonesia || "",
        thesisTitleEn: registration.judulTugasAkhirInggris || "",
        dosenPembimbing1Id: registration.dosenPembimbing1Id ? String(registration.dosenPembimbing1Id) : "",
        dosenPembimbing2Id: registration.dosenPembimbing2Id ? String(registration.dosenPembimbing2Id) : "",
      },
    });
  };

  const initRegistration = async (id) => {
    setIsRegistrationLoading(true);
    isHydrating.current = true;
    try {
      const response = await getSidangRegistrationByStudentId(id);
      const existing = response?.data ?? response;

      if (!existing) {
        const created = await saveSidangRegistration({ mahasiswaId: id });
        const newId = created?.data?.id ?? created?.id ?? null;
        if (newId) {
          setRegistrationId(newId);
          dispatch({ type: "SET_REGISTRATION_ID", id: newId });
        }
        applyRegistrationToForm(created?.data ?? created);
        setRegistrationMeta(created?.data ?? created ?? null);
        return;
      }

      setRegistrationId(existing.id);
      dispatch({ type: "SET_REGISTRATION_ID", id: existing.id });
      applyRegistrationToForm(existing);
      setRegistrationMeta(existing);

      const serverUploads = Array.isArray(existing.sidangRegistrationUploads)
        ? existing.sidangRegistrationUploads
        : [];
      serverUploadsRef.current = serverUploads;
      if (serverUploads.length > 0) {
        dispatch({ type: "RESTORE_SERVER_DOCUMENTS", uploads: serverUploads });
      }

      setSidangAdminResponse(existing);
    } catch (e) {
      setFormAlert({ type: "warning", msg: "Gagal memuat data pendaftaran tersimpan. Form dimulai dari awal." });
    } finally {
      setIsRegistrationLoading(false);
    }
  };

  async function checkSkta() {
    if (!mahasiswaId) {
      setIsSktaChecking(false);
      return;
    }
    try {
      const response = await getSktaResponseUploadByStudentId(mahasiswaId);
      const hasSkta = Array.isArray(response) ? response.length > 0 : (!!response?.sktaDownloadUrl || !!response?.sktaUploadPath);
      setSkta(hasSkta);
      if (hasSkta) await initRegistration(mahasiswaId);
    } catch (e) {
      if (e.response?.status === 404) return;
      console.error("Error fetching SKTA:", e);
    } finally {
      setIsSktaChecking(false);
    }
  }

  useEffect(() => { setIsSktaChecking(true); checkSkta(); }, [mahasiswaId]);

  // Fetch seluruh dosen terurut A-Z sekali saat mount
  useEffect(() => {
    let isMounted = true;
    setIsLecturersLoading(true);
    getLecturers({ limit: "all", sortBy: "a-z" })
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : (data?.data || []);
          setLecturers(list);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat data dosen:", err);
      })
      .finally(() => {
        if (isMounted) setIsLecturersLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsTemplatesLoading(true);

    const dynamicEntries = Object.entries(DYNAMIC_SECTION_CATEGORY_MAP);
    if (dynamicEntries.length === 0) {
      setIsTemplatesLoading(false);
      return;
    }

    Promise.all(
      dynamicEntries.map(([section, category]) =>
        getTemplatesByCategory(category)
          .then((templates) => ({ section, templates }))
          .catch((err) => {
            console.error(`Gagal memuat template untuk section "${section}" (kategori: "${category}"):`, err);
            return { section, templates: [] };
          })
      )
    )
      .then((results) => {
        if (!isMounted) return;

        let hasUpdated = false;
        results.forEach(({ section, templates }) => {
          if (Array.isArray(templates) && templates.length > 0) {
            dispatch({
              type: "SET_SECTION_TEMPLATES",
              payload: {
                section,
                templates,
              },
            });
            hasUpdated = true;
          }
        });

        if (hasUpdated && serverUploadsRef.current.length > 0) {
          dispatch({
            type: "RESTORE_SERVER_DOCUMENTS",
            uploads: serverUploadsRef.current,
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsTemplatesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (isStep1Locked || !mahasiswaId) return;

    if (isHydrating.current) {
      isHydrating.current = false;
      const initialPayload = {
        ...(registrationId ? { id: registrationId } : {}),
        mahasiswaId: String(mahasiswaId),
        programType: data.programType || undefined,
        sidangScheme: data.sidangScheme || undefined,
        jalurNonSidang:
          data.sidangScheme === "Non Sidang" && Array.isArray(data.jalurNonSidang)
            ? data.jalurNonSidang
            : [],
        lulusTesBahasa:
          data.testBahasaPersyaratan === "Sudah"
            ? true
            : data.testBahasaPersyaratan === "Belum"
              ? false
              : undefined,
        testBahasaPersyaratan: data.testBahasaPersyaratan || undefined,
        sks: data.sks !== "" && data.sks !== null && data.sks !== undefined ? Number(data.sks) : undefined,
        ipk: data.ipk !== "" && data.ipk !== null && data.ipk !== undefined ? Number(data.ipk) : undefined,
        tak: data.tak !== "" && data.tak !== null && data.tak !== undefined ? Number(data.tak) : undefined,
        sktaExpDate: data.sktaExpDate || undefined,
        thesisTitleId: data.thesisTitleId || undefined,
        thesisTitleEn: data.thesisTitleEn || undefined,
        dosenPembimbing1Id: data.dosenPembimbing1Id ? String(data.dosenPembimbing1Id) : undefined,
        dosenPembimbing2Id: data.dosenPembimbing2Id ? String(data.dosenPembimbing2Id) : undefined,
      };
      lastSavedPayload.current = JSON.stringify(initialPayload);
      return;
    }

    const hasData = Boolean(
      data.programType ||
      data.sidangScheme ||
      (data.sidangScheme === "Non Sidang" && Array.isArray(data.jalurNonSidang) && data.jalurNonSidang.length > 0) ||
      data.testBahasaPersyaratan ||
      (data.sks !== "" && data.sks !== null && data.sks !== undefined) ||
      (data.ipk !== "" && data.ipk !== null && data.ipk !== undefined) ||
      (data.tak !== "" && data.tak !== null && data.tak !== undefined) ||
      data.sktaExpDate ||
      data.thesisTitleId ||
      data.thesisTitleEn ||
      data.dosenPembimbing1Id ||
      data.dosenPembimbing2Id
    );

    if (!hasData) return;

    const payload = {
      ...(registrationId ? { id: registrationId } : {}),
      mahasiswaId: String(mahasiswaId),
      programType: data.programType || undefined,
      sidangScheme: data.sidangScheme || undefined,
      jalurNonSidang:
        data.sidangScheme === "Non Sidang" && Array.isArray(data.jalurNonSidang)
          ? data.jalurNonSidang
          : [],
      lulusTesBahasa:
        data.testBahasaPersyaratan === "Sudah"
          ? true
          : data.testBahasaPersyaratan === "Belum"
            ? false
            : undefined,
      testBahasaPersyaratan: data.testBahasaPersyaratan || undefined,
      sks: data.sks !== "" && data.sks !== null && data.sks !== undefined ? Number(data.sks) : undefined,
      ipk: data.ipk !== "" && data.ipk !== null && data.ipk !== undefined ? Number(data.ipk) : undefined,
      tak: data.tak !== "" && data.tak !== null && data.tak !== undefined ? Number(data.tak) : undefined,
      sktaExpDate: data.sktaExpDate || undefined,
      thesisTitleId: data.thesisTitleId ? data.thesisTitleId.trim() : undefined,
      thesisTitleEn: data.thesisTitleEn ? data.thesisTitleEn.trim() : undefined,
      dosenPembimbing1Id: data.dosenPembimbing1Id ? String(data.dosenPembimbing1Id) : undefined,
      dosenPembimbing2Id: data.dosenPembimbing2Id ? String(data.dosenPembimbing2Id) : undefined,
    };

    const payloadString = JSON.stringify(payload);
    if (lastSavedPayload.current === payloadString) return;

    const timer = setTimeout(async () => {
      const currentReqId = ++latestRequestId.current;
      setAutosaveStatus("saving");
      try {
        const result = await saveSidangRegistration(payload);
        if (currentReqId !== latestRequestId.current) return;
        const savedId = result?.data?.id ?? result?.id ?? null;
        if (savedId && !registrationId) {
          setRegistrationId(savedId);
          dispatch({ type: "SET_REGISTRATION_ID", id: savedId });
        }
        lastSavedPayload.current = payloadString;
        setAutosaveStatus("saved");
      } catch (err) {
        if (currentReqId !== latestRequestId.current) return;
        console.error("Autosave draft sidang gagal:", err);
        setAutosaveStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    data.programType,
    data.sidangScheme,
    data.jalurNonSidang,
    data.testBahasaPersyaratan,
    data.sks,
    data.ipk,
    data.tak,
    data.sktaExpDate,
    data.thesisTitleId,
    data.thesisTitleEn,
    data.dosenPembimbing1Id,
    data.dosenPembimbing2Id,
    mahasiswaId,
    registrationId,
    isStep1Locked,
  ]);

  return (
    <div className="page-wrapper">
      <div className="top-header-nav">
        <button className="btn-back-square" onClick={() => navigate("/mahasiswa/dashboard")}>
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
            <p className="skta-warning-text">Sistem sedang memeriksa status SKTA dan data pendaftaran sidang.</p>
          </div>
        ) : skta ? (
          <>
            {isRevisionActive && (
              <div style={{ padding: "16px 24px 0", marginBottom: 16 }}>
                <div style={{
                  padding: "16px 20px", borderRadius: 12, background: revisiCfg.badgeBg,
                  border: `1.5px solid ${revisiCfg.borderColor}`, display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 9999, background: "#fff", color: revisiCfg.badgeColor, border: `1.5px solid ${revisiCfg.borderColor}` }}>
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
                  loadingLecturers={isLecturersLoading}
                  autosaveStatus={autosaveStatus}
                  readOnly={isStep1Locked && !isRevisionActive}
                  schemeLocked={isRevisionActive}
                />
              ) : (
                <Step2
                  registrationId={registrationId}
                  isTemplatesLoading={isTemplatesLoading}
                  readOnly={isStep1Locked && !isRevisionActive}
                />
              )}
            </main>

            <footer className="footer-nav">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button className="btn-pagination" onClick={() => setStep(1)} disabled={step === 1}><ChevronLeft size={16} /></button>
                <div className={`page-num ${step === 1 ? "active" : ""}`} onClick={() => setStep(1)}>1</div>
                <div className={`page-num ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>2</div>
                <button className="btn-pagination" onClick={() => setStep(2)} disabled={step === 2}><ChevronRight size={16} /></button>
              </div>

              {step === 1 ? (
                <button className="btn-primary" onClick={handleSaveStep1} disabled={isSavingStep1}>
                  {isSavingStep1 ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </button>
              ) : (
                <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || !registrationId}>
                  {isSubmitting ? "Mengirim..." : "Submit Pendaftaran"}
                </button>
              )}
            </footer>
          </>
        ) : (
          <div className="skta-warning">
            <h2 className="skta-warning-title">Pendaftaran Sidang Belum Tersedia</h2>
            <p className="skta-warning-text">SKTA kamu belum diterbitkan. Silakan tunggu hingga SKTA terbit sebelum mendaftar sidang.</p>
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