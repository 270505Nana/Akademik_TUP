import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Check, CheckCircle2, AlertTriangle, Clock, Menu, Loader, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../components/mahasiswa/sidang/sidang.css";
import { useSidangContext, SidangFormProvider } from "../../context/SidangFormContext";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import Step1 from "../../components/mahasiswa/sidang/Step1Sidang";
import Step2 from "../../components/mahasiswa/sidang/Step2Sidang";
import CustomAlert from "../../components/common/CustomAlert";
import SidebarMahasiswa from "../../components/sidebar/SidebarMahasiswa";

import {
  getLecturers,
  getAllLecturers,
  getSidangRegistrationByStudentId,
  getSktaResponseUploadByStudentId,
  saveSidangRegistration,
  submitSidangRegistration,
  getTemplatesByCategory,
} from "../../service/api";
import {
  SECTIONS,
  NON_SIDANG_SLUGS,
  DYNAMIC_SECTION_CATEGORY_MAP,
} from "../../requirement/sidangDocument";
import { getLatestCompletedDocName } from "../../utils/documentHelper";

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

const Stepper = ({ step }) => {
  const items = [
    { no: 1, label: "Data Diri Mahasiswa" },
    { no: 2, label: "Persyaratan Berkas" },
  ];
  return (
    <div className="sidang-stepper">
      {items.map((it, i) => {
        const isActive = step === it.no;
        const isDone = step > it.no;
        return (
          <React.Fragment key={it.no}>
            <div className={`sidang-step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <span className="sidang-step-circle">
                {isDone ? <Check size={12} strokeWidth={3} /> : it.no}
              </span>
              <span className="sidang-step-label">{it.label}</span>
            </div>
            {i < items.length - 1 && (
              <div className={`sidang-step-line ${isDone ? "done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function PendaftaranSidangContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useSidangContext();
  const { user, profile } = useAuth();
  const { student } = useStudent();
  const { step, data, documents } = state;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skta, setSkta] = useState(false);
  const [isSktaChecking, setIsSktaChecking] = useState(true);
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isDirty = Boolean(state.isDirty);
  const [draftSavedBanner, setDraftSavedBanner] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [isLecturersLoading, setIsLecturersLoading] = useState(true);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [registrationId, setRegistrationId] = useState(null);
  const [registrationMeta, setRegistrationMeta] = useState(null);
  const [sidangAdminResponse, setSidangAdminResponse] = useState(null);
  const [formAlert, setFormAlert] = useState(null);

  const serverUploadsRef = useRef([]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;
  const isStep1Locked = Boolean(registrationMeta?.submittedAt);
  const isRevisionActive = !!(
    sidangAdminResponse?.isEdit &&   // ada timestamp batas revisi dari admin
    sidangAdminResponse?.message     // ada pesan catatan dari admin
  );
  const revisionDueDateText = sidangAdminResponse?.isEdit
    ? new Date(sidangAdminResponse.isEdit).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

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
      localStorage.removeItem("sidang_form_draft");
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

  const handleSaveDraft = async () => {
    setFormAlert(null);
    if (!mahasiswaId) {
      setFormAlert({ type: "error", title: "Gagal Menyimpan", msg: "Data mahasiswa tidak ditemukan. Silakan refresh halaman." });
      return;
    }

    try {
      setIsSavingDraft(true);
      const result = await saveSidangRegistration(buildSavePayload());
      const savedId = result?.data?.id ?? result?.id ?? null;
      if (savedId && !registrationId) {
        setRegistrationId(savedId);
        dispatch({ type: "SET_REGISTRATION_ID", id: savedId });
      }
      localStorage.removeItem("sidang_form_draft");

      const latestName = getLatestCompletedDocName(documents, state.lastUploadedDocName);

      setDraftSavedBanner({ lastDocName: latestName });
      setFormAlert(null);
      dispatch({ type: "SET_IS_DIRTY", value: false });
      dispatch({ type: "SET_STEP", value: 1 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const serverErrors = e.response?.data?.errors;
      const msg = Array.isArray(serverErrors) && serverErrors.length > 0
        ? serverErrors.map((err) => err.message).join(", ")
        : (e.response?.data?.message || "Gagal menyimpan draft pendaftaran sidang. Silakan coba lagi.");
      setFormAlert({ type: "error", title: "Gagal Menyimpan", msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSavingDraft(false);
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
      setFormAlert({ type: "error", msg: "ID pendaftaran tidak ditemukan. Silakan kembali ke Step 1 dan klik 'Lanjutkan' terlebih dahulu." });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitSidangRegistration({ id: registrationId, ...buildSavePayload() });
      localStorage.removeItem("sidang_form_draft");
      setDraftSavedBanner(null);
      dispatch({ type: "SET_IS_DIRTY", value: false });
      dispatch({ type: "SET_STEP", value: 1 });
      setFormAlert({
        type: "success",
        msg: "Pendaftaran sidang berhasil dikirim dan sedang menunggu proses verifikasi oleh tim akademik.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      await initRegistration(mahasiswaId);
    } catch (error) {
      const serverErrors = error.response?.data?.errors;
      const msg = Array.isArray(serverErrors) && serverErrors.length > 0
        ? serverErrors.map((err) => err.message).join(", ")
        : (error.response?.data?.message || "Gagal submit pendaftaran sidang. Silakan coba lagi.");
      setFormAlert({ type: "error", title: "Gagal Submit", msg });
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
    try {
      const response = await getSidangRegistrationByStudentId(id);
      const existing = response?.data ?? response;

      // Cek apakah draft di localStorage valid dan memang milik mahasiswa yang sedang login
      const localDraftRaw = localStorage.getItem("sidang_form_draft");
      let validLocalDraft = null;
      if (localDraftRaw) {
        try {
          const parsed = JSON.parse(localDraftRaw);
          const draftMhsId = parsed?.data?.mahasiswaId || parsed?.mahasiswaId;
          if (draftMhsId && String(draftMhsId) === String(id)) {
            validLocalDraft = parsed;
          } else {
            localStorage.removeItem("sidang_form_draft");
          }
        } catch (err) {
          localStorage.removeItem("sidang_form_draft");
        }
      }

      if (!existing) {
        const created = await saveSidangRegistration({ mahasiswaId: id });
        const newRecord = created?.data ?? created ?? null;
        const newId = newRecord?.id ?? null;
        if (newId) {
          setRegistrationId(newId);
          dispatch({ type: "SET_REGISTRATION_ID", id: newId });
        }

        if (validLocalDraft) {
          dispatch({ type: "RESTORE_DRAFT", payload: validLocalDraft });
          if (newId) {
            dispatch({ type: "SET_REGISTRATION_ID", id: newId });
          }
        } else if (newRecord) {
          applyRegistrationToForm(newRecord);
        }

        setRegistrationMeta(newRecord);
        return;
      }

      setRegistrationId(existing.id);
      dispatch({ type: "SET_REGISTRATION_ID", id: existing.id });
      setRegistrationMeta(existing);
      setSidangAdminResponse(existing);

      const isSubmittedOrRevision = Boolean(
        existing.submittedAt || (existing.isEdit && existing.message)
      );

      const isStep1SavedInApi = Boolean(
        existing.program ||
        existing.skemaSidang ||
        existing.judulTugasAkhirIndonesia ||
        existing.sks ||
        existing.ipk
      );

      if (isSubmittedOrRevision) {
        // Bila sudah submit atau revisi aktif (isEdit), data API dipakai penuh dan localStorage dibersihkan
        localStorage.removeItem("sidang_form_draft");
        applyRegistrationToForm(existing);
      } else if (isStep1SavedInApi) {
        // Jika data API menunjukkan Step 1 sudah pernah disimpan ke server, utamakan data API
        localStorage.removeItem("sidang_form_draft");
        applyRegistrationToForm(existing);
      } else if (validLocalDraft) {
        // Bila draft murni dan Step 1 belum tersimpan di server tapi ada draft lokal milik mahasiswa ini
        dispatch({ type: "RESTORE_DRAFT", payload: validLocalDraft });
        dispatch({ type: "SET_REGISTRATION_ID", id: existing.id });
      } else {
        applyRegistrationToForm(existing);
      }

      const serverUploads = Array.isArray(existing.sidangRegistrationUploads)
        ? existing.sidangRegistrationUploads
        : [];
      serverUploadsRef.current = serverUploads;
      if (serverUploads.length > 0) {
        dispatch({ type: "RESTORE_SERVER_DOCUMENTS", uploads: serverUploads });
      }
    } catch (e) {
      setFormAlert({ type: "warning", msg: "Gagal memuat data pendaftaran tersimpan. Form dimulai dari awal." });
    } finally {
      setIsRegistrationLoading(false);
      dispatch({ type: "SET_IS_DIRTY", value: false });
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
    getAllLecturers({ sortBy: "name" })
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

  const isStep2Complete = () => validateStep2(data, documents) === null;

  const renderStatusBanner = () => {
    if (!registrationId) return null;

    if (registrationMeta?.sidangPeriodId) {
      return (
        <div className="info-banner" style={{ marginBottom: "24px", background: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <div className="banner-icon-container" style={{ background: "#DCFCE7" }}>
            <CheckCircle2 color="#16A34A" size={24} />
          </div>
          <div className="banner-content">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h4 style={{ color: "#166534", margin: 0, fontSize: "16px", fontWeight: 800 }}>Pendaftaran Sidang Disetujui</h4>
              <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px" }}>DISETUJUI</span>
            </div>
            <p style={{ color: "#15803D", margin: 0, fontSize: "13px" }}>Selamat! Pendaftaran sidang telah diverifikasi dan disetujui oleh admin akademik.</p>
          </div>
        </div>
      );
    }

    if (isRevisionActive) {
      return (
      <div className="info-banner" style={{ marginBottom: "24px", background: "#FFFBEB", borderColor: "#FDE68A", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 320px", minWidth: 0 }}>
          <div className="banner-icon-container" style={{ background: "#FEF3C7", flexShrink: 0 }}>
            <AlertTriangle color="#D97706" size={24} />
          </div>
          <div className="banner-content">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h4 style={{ color: "#92400E", margin: 0, fontSize: "16px", fontWeight: 800 }}>Dokumen Pendaftaran Perlu Diperbaiki</h4>
              <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px" }}>PERLU PERBAIKAN</span>
            </div>
            <p style={{ color: "#B45309", margin: 0, marginBottom: "12px", fontSize: "13px" }}>
              Tim akademik memberikan catatan: <strong>"{sidangAdminResponse?.message}"</strong>. Silakan lakukan perbaikan pada data atau dokumen yang diminta, kemudian kirim ulang pengajuan sebelum batas waktu berikut.
            </p>
            {revisionDueDateText && (
              <div style={{ background: "#fff", padding: "10px 16px", borderRadius: "8px", border: "1px solid #FDE68A", display: "inline-block" }}>
                <div style={{ fontSize: "12px", color: "#92400E" }}>
                  <strong>Batas Waktu Perbaikan:</strong> {revisionDueDateText}
                </div>
              </div>
            )}
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
              alignSelf: "flex-end",

            }}
          >
            <Mail size={15} />
            <span>Contact Person : Helpdesk Layanan Sidang-Yudisium TUP</span>
          </a>
        </div>
      );
    }

    if (registrationMeta?.submittedAt) {
      return (
        <div className="info-banner" style={{ marginBottom: "24px", background: "#EFF6FF", borderColor: "#BFDBFE", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1 1 320px", minWidth: 0 }}>
            <div className="banner-icon-container" style={{ background: "#DBEAFE", flexShrink: 0 }}>
              <Clock color="#2563EB" size={24} />
            </div>
            <div className="banner-content">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h4 style={{ color: "#1E3A8A", margin: 0, fontSize: "16px", fontWeight: 800 }}>Pendaftaran Sedang Diproses</h4>
                <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px" }}>MENUNGGU VERIFIKASI</span>
              </div>
              <p style={{ color: "#1D4ED8", margin: 0, fontSize: "13px" }}>Pendaftaran sidang telah berhasil dikirim dan sedang menunggu proses verifikasi oleh admin akademik. Mohon pantau halaman ini secara berkala.</p>
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
      );
    }

    return null;
  };

  return (
    <div className={`flex min-h-screen ${sidebarCollapsed ? 'sidebar-hidden' : ''}`} style={{ background: "#F4F6FB" }}>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="sidang-main" className="flex-1 relative">
        <header className="sidang-topbar">
          <button className="sidang-topbar-toggle" onClick={handleToggleSidebar} aria-label="Toggle Menu">
            <Menu size={20} color="#fff" />
          </button>
          <div className="sidang-topbar-brand">Registrasi Sidang</div>
        </header>

        <div className="page-wrapper sidang-wrapper">
          {!isSktaChecking && !isRegistrationLoading && skta && <Stepper step={step} />}
          <div
            className={`simta-container ${isSktaChecking || isRegistrationLoading || !skta ? "sidang-loading-wrap" : ""
              }`}
          >
            {isSktaChecking || isRegistrationLoading ? (
              <div className="skta-warning sidang-loading-card">
                <Loader
                  size={40}
                  color="#C0182A"
                  style={{ animation: "spin 1s linear infinite", marginBottom: "20px" }}
                />
                <h2 className="skta-warning-title" style={{ fontSize: "22px", fontWeight: 800, color: "#1E293B", margin: "0 0 10px" }}>
                  Memuat Data Pendaftaran
                </h2>
                <p className="skta-warning-text" style={{ fontSize: "15px", color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                  Sistem sedang memeriksa status SKTA dan data pendaftaran sidang.
                </p>
              </div>
            ) : skta ? (
              <>
                {formAlert && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <CustomAlert type={formAlert.type} title={formAlert.title} message={formAlert.msg} />
                  </div>
                )}

                <main>

                  {renderStatusBanner()}
                  {step === 1 ? (
                    <Step1
                      studentInfo={studentInfo}
                      lecturers={lecturers}
                      loadingLecturers={isLecturersLoading}
                      readOnly={isStep1Locked && !isRevisionActive}
                      draftBanner={draftSavedBanner}
                      onCloseDraftBanner={() => setDraftSavedBanner(null)}
                      isRevisionActive={isRevisionActive}

                    />
                  ) : (
                    <Step2
                      registrationId={registrationId}
                      isTemplatesLoading={isTemplatesLoading}
                      readOnly={isStep1Locked && !isRevisionActive}
                      studentInfo={studentInfo}
                    />
                  )}
                </main>

                <footer className="footer-nav">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button className="btn-pagination" onClick={() => setStep(1)} disabled={step === 1}><ChevronLeft size={16} color="#334155" strokeWidth={2.5} /></button>
                    <div className={`page-num ${step === 1 ? "active" : ""}`} onClick={() => setStep(1)}>1</div>
                    <div className={`page-num ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>2</div>
                    <button className="btn-pagination" onClick={() => setStep(2)} disabled={step === 2}><ChevronRight size={16} strokeWidth={2.5} /></button>
                  </div>

                  {step === 1 ? (
                    isStep1Locked && !isRevisionActive ? (
                      <button className="btn-primary" onClick={() => setStep(2)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        Lanjut ke Dokumen <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={handleSaveStep1} disabled={isSavingStep1}>
                        {isSavingStep1 ? "Menyimpan..." : "Lanjutkan"}
                      </button>
                    )
                  ) : (
                    (!isStep1Locked || isRevisionActive) && (
                      isStep2Complete() ? (
                        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || !registrationId}>
                          {isSubmitting ? "Mengirim..." : "Submit Pendaftaran"}
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={handleSaveDraft}
                          disabled={isSavingDraft || !registrationId || !isDirty}
                          style={{
                            background: "#F59E0B",
                            color: "#fff",
                            border: "none",
                            opacity: (isSavingDraft || !registrationId || !isDirty) ? 0.5 : 1,
                            cursor: (isSavingDraft || !registrationId || !isDirty) ? "not-allowed" : "pointer",
                          }}
                        >
                          {isSavingDraft ? "Menyimpan..." : "Simpan Draft"}
                        </button>
                      )
                    )
                  )}
                </footer>
              </>
            ) : (
              <div className="skta-warning sidang-warning-card">
                <div className="sidang-icon-circle-warning">
                  <AlertTriangle size={28} color="#D97706" />
                </div>
                <h2 className="skta-warning-title" style={{ fontSize: "18px", fontWeight: 800, color: "#92400E", margin: "0 0 8px" }}>
                  Pendaftaran Sidang Belum Tersedia
                </h2>
                <p className="skta-warning-text" style={{ fontSize: "14px", color: "#B45309", margin: "0 0 24px", lineHeight: 1.6, maxWidth: "460px" }}>
                  SKTA belum diterbitkan. Silakan menunggu hingga SKTA diterbitkan sebelum melakukan pendaftaran sidang.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate("/mahasiswa/dashboard")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 24px",
                    fontSize: "13px",
                    fontWeight: 700,
                    borderRadius: "8px",
                    background: "#C0182A",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Dashboard</span>
                </button>
              </div>
            )}
          </div>
        </div>
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