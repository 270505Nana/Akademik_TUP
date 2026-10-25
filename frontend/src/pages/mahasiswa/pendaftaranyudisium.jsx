import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Menu, AlertTriangle, CheckCircle2, Clock, Mail, Loader, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../components/mahasiswa/yudisium/yudisium.css";

import { useYudisiumContext, YudisiumFormProvider } from "../../context/YudisiumFormContext";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import Step1Yudisium from "../../components/mahasiswa/yudisium/Step1Yudisium";
import Step2Yudisium from "../../components/mahasiswa/yudisium/Step2Yudisium";
import CustomAlert from "../../components/common/CustomAlert";
import SidebarMahasiswa from "../../components/sidebar/SidebarMahasiswa";
import { SECTIONS } from "../../components/mahasiswa/yudisium/yudisiumDocument";

import {
  getLecturers,
  getAllLecturers,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  getActiveYudisiumPeriod,
  getYudisiumTemplates,
  getMyYudisiumRegistrations,
  getSidangRegistrationByStudentId,
} from "../../service/api";
import { getLatestCompletedDocName } from "../../utils/documentHelper";

const STEP1_REQUIRED = [
  { key: "program", label: "Program" },
  { key: "tak", label: "TAK" },
  { key: "judulTugasAkhirIndonesia", label: "Judul Tugas Akhir (Indonesia)" },
  { key: "judulTugasAkhirInggris", label: "Judul Tugas Akhir (Inggris)" },
  { key: "skemaSidang", label: "Skema Sidang" },
  { key: "tglSidang", label: "Tanggal Sidang" },
  { key: "dosenPembimbing1Id", label: "Dosen Pembimbing 1" }
];

const YUDISIUM_SKEMA_OPTIONS = ["Sidang Reguler", "Non Sidang"];

const applySidangScheduleFields = (sidangRegistration, dispatch) => {
  if (!sidangRegistration) return;

  if (sidangRegistration.tglSidang) {
    const tglIso = new Date(sidangRegistration.tglSidang).toISOString();
    dispatch({ type: "UPDATE_FIELD", field: "tglSidang", value: tglIso });
  }

  const skema = sidangRegistration.skemaSidang;
  if (skema && YUDISIUM_SKEMA_OPTIONS.includes(skema)) {
    dispatch({ type: "UPDATE_FIELD", field: "skemaSidang", value: skema });
  }
};

function validateStep1(data) {
  for (const field of STEP1_REQUIRED) {
    if (!data[field.key]) return `Kolom "${field.label}" wajib diisi.`;
  }

  if (data.program === "Reguler" && Number(data.tak) < 60) return "Nilai TAK untuk program Reguler minimal 60.";
  if (data.program === "Alih Jenjang" && Number(data.tak) < 25) return "Nilai TAK untuk program Alih Jenjang minimal 25.";

  if (data.pengajuanCumlaude !== "Non Cumlaude" && data.skemaCumlaude.length === 0) {
    return "Skema Cumlaude wajib dipilih minimal satu opsi.";
  }
  if (data.pengajuanCumlaude !== "Non Cumlaude" && !data.evidenCumlaude.trim()) {
    return "Detail Publikasi / Prestasi wajib diisi jika mengajukan Cumlaude.";
  }
  if (data.dosenPembimbing1Id && data.dosenPembimbing2Id && String(data.dosenPembimbing1Id) === String(data.dosenPembimbing2Id)) {
    return "Dosen Pembimbing 1 dan Dosen Pembimbing 2 tidak boleh sama.";
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

function PendaftaranYudisiumContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useYudisiumContext();
  const { user, profile } = useAuth();
  const { student } = useStudent();
  const { step, data, documents } = state;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isDirty = Boolean(state.isDirty);
  const [draftSavedBanner, setDraftSavedBanner] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [formAlert, setFormAlert] = useState(null);
  const [isSidangScheduleChecking, setIsSidangScheduleChecking] = useState(true);
  const [hasSidangSchedule, setHasSidangSchedule] = useState(false);

  const registrationId = data.registrationId;
  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;

  const isLocked = !data.isDraft && !data.isEdit;

  const studentInfo = {
    nama: student?.namaLengkap || profile?.name || user?.username || "-",
    nim: student?.nim || profile?.nim || "-",
    prodi: student?.studyProgramNama || profile?.studyProgram?.name || "-",
    phone: user?.phone || profile?.phone || user?.no_telp || "-",
  };

  useEffect(() => {
    getAllLecturers({ sortBy: "name" })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setLecturers(list);
      })
      .catch((err) => console.error("Gagal memuat data dosen:", err));

    const initData = async () => {
      setIsSidangScheduleChecking(true);
      try {
        if (!mahasiswaId) {
          setHasSidangSchedule(false);
          return;
        }

        const sidangRegistration = await getSidangRegistrationByStudentId(mahasiswaId);
        const scheduled = Boolean(sidangRegistration?.tglSidang);
        setHasSidangSchedule(scheduled);

        if (!scheduled) return;

        const templates = await getYudisiumTemplates();
        dispatch({ type: "SET_DYNAMIC_DOCUMENTS", payload: templates });

        const drafts = await getMyYudisiumRegistrations(mahasiswaId);
        if (drafts && drafts.length > 0) {
          const sortedDrafts = drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          const latestDraft = sortedDrafts[0];
          if (latestDraft) {
            dispatch({ type: "RESTORE_FROM_API", payload: latestDraft });
          }
        }

        applySidangScheduleFields(sidangRegistration, dispatch);
      } catch (err) {
        console.error("Gagal inisialisasi data Yudisium:", err);
        setHasSidangSchedule(false);
      } finally {
        dispatch({ type: "SET_IS_DIRTY", value: false });
        setIsSidangScheduleChecking(false);
      }
    };

    initData();
  }, [dispatch, mahasiswaId]);

  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        const activePeriod = await getActiveYudisiumPeriod();
        if (activePeriod) {
          dispatch({ type: "UPDATE_FIELD", field: "yudisiumRegistrationPeriodId", value: activePeriod.id });
        } else {
          dispatch({ type: "UPDATE_FIELD", field: "yudisiumRegistrationPeriodId", value: "" });
        }
      } catch (error) {
        console.error("Failed to fetch yudisium periods", error);
      }
    };
    fetchPeriod();
  }, [dispatch]);

  const setStep = (val) => {
    setFormAlert(null);
    dispatch({ type: "SET_STEP", value: val });
  };

  const buildSavePayload = () => ({
    ...(registrationId ? { id: registrationId } : {}),
    program: data.program,
    tak: Number(data.tak),
    judulTugasAkhirIndonesia: data.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: data.judulTugasAkhirInggris,
    isDraft: true,
    tglSidang: data.tglSidang,
    skemaSidang: data.skemaSidang,
    pengajuanCumlaude: data.pengajuanCumlaude,
    skemaCumlaude: data.pengajuanCumlaude !== "Non Cumlaude" ? (Array.isArray(data.skemaCumlaude) ? data.skemaCumlaude.join(", ") : data.skemaCumlaude) : "",
    evidenCumlaude: data.pengajuanCumlaude !== "Non Cumlaude" ? data.evidenCumlaude : null,
    berminatWirausaha: false,
    mahasiswaId: String(mahasiswaId),
    dosenWaliId: data.dosenWaliId && data.dosenWaliId !== "-" ? data.dosenWaliId : null,
    dosenPembimbing1Id: data.dosenPembimbing1Id ? String(data.dosenPembimbing1Id) : null,
    dosenPembimbing2Id: data.dosenPembimbing2Id ? String(data.dosenPembimbing2Id) : null,
    yudisiumRegistrationPeriodId: data.yudisiumRegistrationPeriodId || null
  });

  const handleSaveStep1 = async () => {
    setFormAlert(null);
    const error = validateStep1(data);
    if (error) {
      setFormAlert({ type: "error", title: "Validasi Gagal", msg: error });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setIsSavingStep1(true);
      const result = await saveYudisiumRegistration(buildSavePayload());
      const savedId = result?.id ?? result?.data?.id ?? null;

      if (savedId) {
        dispatch({ type: "UPDATE_FIELD", field: "registrationId", value: savedId });
      }

      setStep(2);
    } catch (e) {
      setFormAlert({ type: "error", title: "Gagal Menyimpan", msg: e.response?.data?.message || "Gagal menyimpan draft yudisium." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSavingStep1(false);
    }
  };

  const isStep2Complete = () => {
    let requiredSections = [SECTIONS.WAJIB];

    if (data.pengajuanCumlaude !== "Non Cumlaude") {
      if (data.skemaCumlaude.includes("Publikasi Jurnal")) requiredSections.push(SECTIONS.JURNAL);
      if (data.skemaCumlaude.includes("Pameran")) requiredSections.push(SECTIONS.PAMERAN);
      if (data.skemaCumlaude.includes("Prestasi Lomba")) requiredSections.push(SECTIONS.LOMBA);
      if (data.skemaCumlaude.includes("HKI/Paten")) requiredSections.push(SECTIONS.HKI);
    }

    const missingDocs = documents.filter(doc => {
      const isRequiredSection = requiredSections.includes(doc.section);
      const isOptional = doc.name.toLowerCase().includes("opsional");

      return isRequiredSection && !isOptional && doc.status !== "completed";
    });

    return missingDocs.length === 0;
  };

  const handleSaveDraft = async () => {
    setFormAlert(null);
    try {
      setIsSavingDraft(true);
      const result = await saveYudisiumRegistration(buildSavePayload());
      const savedId = result?.id ?? result?.data?.id ?? null;
      if (savedId && !registrationId) {
        dispatch({ type: "UPDATE_FIELD", field: "registrationId", value: savedId });
      }

      const latestName = getLatestCompletedDocName(documents, state.lastUploadedDocName);

      setDraftSavedBanner({ lastDocName: latestName });
      setFormAlert(null);
      dispatch({ type: "SET_IS_DIRTY", value: false });
      dispatch({ type: "SET_STEP", value: 1 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const errData = e.response?.data;
      const errMsg = Array.isArray(errData?.errors)
        ? errData.errors.join(", ")
        : errData?.message || "Gagal menyimpan draft yudisium. Silakan coba lagi.";
      setFormAlert({
        type: "error",
        title: "Gagal Menyimpan",
        msg: errMsg,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    setFormAlert(null);
    if (!registrationId) {
      setFormAlert({
        type: "error",
        title: "Gagal Submit",
        msg: "ID pendaftaran tidak ditemukan. Silakan kembali ke Step 1 dan klik 'Lanjutkan' terlebih dahulu.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitYudisiumRegistration({
        ...buildSavePayload(),
        id: registrationId,
        isDraft: false
      });

      setDraftSavedBanner(null);
      dispatch({ type: "SET_IS_DIRTY", value: false });
      dispatch({ type: "SET_STEP", value: 1 });
      setFormAlert({
        type: "success",
        title: "Pendaftaran Berhasil!",
        msg: "Pendaftaran berhasil dikirim. Tim akademik akan memverifikasi berkas yang telah dilampirkan"
      });
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (mahasiswaId) {
        const drafts = await getMyYudisiumRegistrations(mahasiswaId);
        if (drafts && drafts.length > 0) {
          const sortedDrafts = drafts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          const latestDraft = sortedDrafts[0];
          if (latestDraft) {
            dispatch({ type: "RESTORE_FROM_API", payload: latestDraft });
          }
        }
      }
    } catch (e) {
      setFormAlert({ type: "error", title: "Gagal Submit", msg: e.response?.data?.message || "Gagal mengirim pendaftaran." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBanner = () => {
    if (!data.registrationId) return null;

    if (data.yudisiumPeriodId) {
      return (
        <div className="info-banner" style={{ marginBottom: '24px', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <div className="banner-icon-container" style={{ background: '#DCFCE7' }}>
            <CheckCircle2 color="#16A34A" size={24} />
          </div>
          <div className="banner-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ color: '#166534', margin: 0, fontSize: '16px', fontWeight: 800 }}>Pendaftaran Yudisium Disetujui</h4>
              <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>DISETUJUI</span>
            </div>
            <p style={{ color: '#15803D', margin: 0, fontSize: '13px' }}>Selamat! Pendaftaran yudisium telah diverifikasi dan disetujui oleh admin akademik.</p>
          </div>
        </div>
      );
    }

    if (data.isEdit) {
      return (
        <div className="info-banner" style={{ marginBottom: '24px', background: '#FFFBEB', borderColor: '#FDE68A', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px', minWidth: 0 }}>
          <div className="banner-icon-container" style={{ background: '#FEF3C7', flexShrink: 0 }}>
            <AlertTriangle color="#D97706" size={24} />
          </div>
          <div className="banner-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ color: '#92400E', margin: 0, fontSize: '16px', fontWeight: 800 }}>Dokumen Pendaftaran Perlu Diperbaiki</h4>
              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>PERLU PERBAIKAN</span>
            </div>
            <p style={{ color: '#B45309', margin: 0, marginBottom: '12px', fontSize: '13px' }}>
              Tim akademik memberikan catatan: <strong>"{data.message}"</strong>. Silakan perbaiki pengajuan melalui formulir di bawah ini, kemudian kirim ulang.
            </p>
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #FDE68A', display: 'inline-block' }}>
              <div style={{ fontSize: '12px', color: '#92400E' }}><strong>Batas Waktu Perbaikan:</strong> {new Date(data.isEdit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
          <a
            className="contact-person-badge"
            href="https://wa.me/6285117001281"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#C0182A',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              alignSelf: 'flex-end',

            }}
          >
            <Mail size={15} />
            <span>Contact Person : Helpdesk Layanan Sidang-Yudisium TUP</span>
          </a>
        </div>
      );
    }

    if (!data.isDraft) {
      return (
        <div className="info-banner" style={{ marginBottom: '24px', background: '#EFF6FF', borderColor: '#BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px', minWidth: 0 }}>
            <div className="banner-icon-container" style={{ background: '#DBEAFE', flexShrink: 0 }}>
              <Clock color="#2563EB" size={24} />
            </div>
            <div className="banner-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ color: '#1E3A8A', margin: 0, fontSize: '16px', fontWeight: 800 }}>Pendaftaran Sedang Diproses</h4>
                <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>MENUNGGU VERIFIKASI</span>
              </div>
              <p style={{ color: '#1D4ED8', margin: 0, fontSize: '13px' }}>Pendaftaran yudisium telah berhasil dikirim dan sedang menunggu proses verifikasi oleh tim akademik. Mohon pantau halaman ini secara berkala.</p>
            </div>
          </div>
          <a
            className="contact-person-badge"
            href="https://wa.me/6285117001281"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#C0182A',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
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

      <div id="yudisium-main" className="flex-1 relative">
        <header className="sidang-topbar">
          <button className="sidang-topbar-toggle" onClick={handleToggleSidebar} aria-label="Toggle Menu">
            <Menu size={20} color="#fff" />
          </button>
          <div className="sidang-topbar-brand">Registrasi Yudisium</div>
        </header>

        <div className="page-wrapper sidang-wrapper">
          {!isSidangScheduleChecking && hasSidangSchedule && <Stepper step={step} />}
          <div className={`simta-container${isSidangScheduleChecking || !hasSidangSchedule ? " sidang-loading-wrap" : ""}`}>
            {isSidangScheduleChecking ? (
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
                  Sistem sedang memeriksa jadwal sidang dan data pendaftaran yudisium.
                </p>
              </div>
            ) : !hasSidangSchedule ? (
              <div className="skta-warning sidang-warning-card">
                <div className="sidang-icon-circle-warning">
                  <AlertTriangle size={28} color="#D97706" />
                </div>
                <h2 className="skta-warning-title" style={{ fontSize: "18px", fontWeight: 800, color: "#92400E", margin: "0 0 8px" }}>
                  Pendaftaran Yudisium Belum Tersedia
                </h2>
                <p className="skta-warning-text" style={{ fontSize: "14px", color: "#B45309", margin: "0 0 24px", lineHeight: 1.6, maxWidth: "460px" }}>
                  Jadwal sidang kamu belum ditetapkan. Yudisium hanya bisa didaftarkan setelah sidang dijadwalkan.
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
            ) : (
              <>
                {formAlert && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <CustomAlert type={formAlert.type} title={formAlert.title} message={formAlert.msg} />
                  </div>
                )}

                <main>
                  {renderStatusBanner()}
                  {step === 1 ? (
                    <Step1Yudisium
                      studentInfo={studentInfo}
                      lecturers={lecturers}
                      readOnly={isLocked}
                      draftBanner={draftSavedBanner}
                      onCloseDraftBanner={() => setDraftSavedBanner(null)}
                      isRevisionActive={!!data.isEdit}
                    />
                  ) : (
                    <Step2Yudisium registrationId={registrationId} studentInfo={studentInfo} setFormAlert={setFormAlert} />
                  )}
                </main>

                <footer className="footer-nav">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button className="btn-pagination" onClick={() => setStep(1)} disabled={step === 1 || isSubmitting}>
                      <ChevronLeft size={16} color="#334155" strokeWidth={2.5} />
                    </button>
                    <div className={`page-num ${step === 1 ? "active" : ""}`} onClick={() => setStep(1)}>1</div>
                    <div className={`page-num ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>2</div>
                    <button className="btn-pagination" onClick={() => setStep(2)} disabled={step === 2 || isSubmitting}>
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  {step === 1 ? (
                    isLocked ? (
                      <button className="btn-primary" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Lanjut ke Dokumen <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={handleSaveStep1} disabled={isSavingStep1}>
                        {isSavingStep1 ? "Menyimpan..." : "Lanjutkan"}
                      </button>
                    )
                  ) : (
                    !isLocked && (
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
                            background: '#F59E0B',
                            color: '#fff',
                            border: 'none',
                            opacity: (isSavingDraft || !registrationId || !isDirty) ? 0.5 : 1,
                            cursor: (isSavingDraft || !registrationId || !isDirty) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isSavingDraft ? "Menyimpan..." : "Simpan Draft"}
                        </button>
                      )
                    )
                  )}
                </footer>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PendaftaranYudisium() {
  return (
    <YudisiumFormProvider>
      <PendaftaranYudisiumContent />
    </YudisiumFormProvider>
  );
}