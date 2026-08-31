import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../components/mahasiswa/sidang/sidang.css";
import logoSimta from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";
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
  saveYudisiumRegistration, 
  submitYudisiumRegistration,
  getActiveYudisiumPeriod,
  getYudisiumTemplates,
  getMyYudisiumRegistrations 
} from "../../service/api";

const STEP1_REQUIRED = [
  { key: "program", label: "Program" },
  { key: "tak", label: "TAK" },
  { key: "judulTugasAkhirIndonesia", label: "Judul Tugas Akhir (Indonesia)" },
  { key: "judulTugasAkhirInggris", label: "Judul Tugas Akhir (Inggris)" },
  { key: "skemaSidang", label: "Skema Sidang" },
  { key: "dosenPembimbing1Id", label: "Dosen Pembimbing 1" }
];

function validateStep1(data) {
  for (const field of STEP1_REQUIRED) {
    if (!data[field.key]) return `Kolom "${field.label}" wajib diisi.`;
  }
  
  if (data.program === "Reguler" && Number(data.tak) < 60) return "Nilai TAK untuk program Reguler minimal 60.";
  if (data.program === "Alih Jenjang" && Number(data.tak) < 45) return "Nilai TAK untuk program Alih Jenjang minimal 45.";
  
  if (data.pengajuanCumlaude !== "Non Cumlaude" && data.skemaCumlaude.length === 0) {
    return "Skema Cumlaude wajib dipilih minimal satu opsi.";
  }
  if (data.pengajuanCumlaude !== "Non Cumlaude" && !data.evidenCumlaude.trim()) {
    return "Detail Publikasi / Prestasi wajib diisi jika mengajukan Cumlaude.";
  }
  if (data.minatWirausaha === "") {
    return "Pertanyaan minat wirausaha wajib dijawab.";
  }
  if (data.dosenPembimbing1Id && data.dosenPembimbing2Id && String(data.dosenPembimbing1Id) === String(data.dosenPembimbing2Id)) {
    return "Dosen Pembimbing 1 dan Dosen Pembimbing 2 tidak boleh sama.";
  }
  return null;
}

function PendaftaranYudisiumContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useYudisiumContext();
  const { user, profile } = useAuth();
  const { student } = useStudent();
  const { step, data, documents } = state;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // State baru untuk hide sidebar di desktop
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [formAlert, setFormAlert] = useState(null);

  const registrationId = data.registrationId;
  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;

  const studentInfo = {
    nama: student?.namaLengkap || profile?.name || user?.username || "-",
    nim: student?.nim || profile?.nim || "-",
    prodi: student?.studyProgramNama || profile?.studyProgram?.name || "-",
    phone: user?.phone || profile?.phone || user?.no_telp || "-",
  };

  useEffect(() => {
    getLecturers().then(res => setLecturers(res || [])).catch(console.error);
    
    const initData = async () => {
      try {
        const templates = await getYudisiumTemplates();
        dispatch({ type: "SET_DYNAMIC_DOCUMENTS", payload: templates });

        if (mahasiswaId) {
          const drafts = await getMyYudisiumRegistrations(mahasiswaId);
          if (drafts && drafts.length > 0) {
            const latestDraft = drafts.find(d => d.isDraft) || drafts[0];
            if (latestDraft) {
              dispatch({ type: "RESTORE_FROM_API", payload: latestDraft });
            }
          }
        }
      } catch (err) {
        console.error("Gagal inisialisasi data Yudisium:", err);
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
    tglSidang: null,
    judulTugasAkhirIndonesia: data.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: data.judulTugasAkhirInggris,
    isConfirmed: false,
    skemaSidang: data.skemaSidang,
    pengajuanCumlaude: data.pengajuanCumlaude,
    skemaCumlaude: data.pengajuanCumlaude !== "Non Cumlaude" ? data.skemaCumlaude.join(", ") : "",
    evidenCumlaude: data.pengajuanCumlaude !== "Non Cumlaude" ? data.evidenCumlaude : null,
    berminatWirausaha: data.minatWirausaha === "Ya",
    mahasiswaId: String(mahasiswaId),
    dosenWaliId: data.dosenWaliId !== "-" ? data.dosenWaliId : null,
    dosenPembimbing1Id: data.dosenPembimbing1Id ? String(data.dosenPembimbing1Id) : null,
    dosenPembimbing2Id: data.dosenPembimbing2Id ? String(data.dosenPembimbing2Id) : null,
    yudisiumPeriodId: null, 
    yudisiumRegistrationPeriodId: data.yudisiumRegistrationPeriodId
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

    if (data.minatWirausaha === "Ya") {
      requiredSections.push(SECTIONS.WIRAUSAHA);
    }

    const missingDocs = documents.filter(doc => {
      const isRequiredSection = requiredSections.includes(doc.section);
      const isOptional = doc.name.toLowerCase().includes("opsional");
      
      return isRequiredSection && !isOptional && doc.status !== "completed";
    });

    return missingDocs.length === 0;
  };

  const handleSaveDraft = () => {
    setFormAlert({ 
      type: "success", 
      title: "Draft Tersimpan", 
      msg: "Draft berkas berhasil disimpan di sistem! Kamu bisa melanjutkan unggahan nanti." 
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate("/mahasiswa/dashboard");
    }, 2000);
  };

  const handleSubmit = async () => {
    setFormAlert(null);
    if (!registrationId) return;

    try {
      setIsSubmitting(true);
      await submitYudisiumRegistration({
        ...buildSavePayload(),
        id: registrationId,
        isConfirmed: true
      });

      setFormAlert({ 
        type: "success", 
        title: "Pendaftaran Berhasil!", 
        msg: "Apabila terdapat revisi berkas Mohon konfirmasi pembaruan ke Helpdesk. Sidang Yudisium dilaksanakan tertutup. SKL diterbitkan 2-3 minggu setelah diproses." 
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        navigate("/mahasiswa/dashboard");
      }, 3500);
    } catch (e) {
      setFormAlert({ type: "error", title: "Gagal Submit", msg: e.response?.data?.message || "Gagal mengirim pendaftaran." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${sidebarCollapsed ? 'sidebar-hidden' : ''}`} style={{ background: "#F4F6FB" }}>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div id="yudisium-main" className="flex-1 relative">
        <div className="page-wrapper yudisium-wrapper">
          <div className="top-header-nav">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              
              <button 
                className="topbar-toggle" 
                onClick={() => {
                  if (window.innerWidth < 992) {
                    setSidebarOpen(!sidebarOpen); 
                  } else {
                    setSidebarCollapsed(!sidebarCollapsed); 
                  }
                }} 
                style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <Menu size={20} />
              </button>
              
              <button className="btn-back-square" onClick={() => navigate("/mahasiswa/dashboard")}>
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Kembali</span>
              </button>
            </div>
            <div className="header-logos">
              <img src={logoSimta} alt="SIMTA" className="simta-brand-logo" />
              <div className="logo-divider"></div>
              <img src={logoTelkom} alt="Telkom" className="telkom-brand-logo" />
            </div>
          </div>

          <div className="simta-container">
            {formAlert && (
              <div style={{ padding: "16px 24px 0" }}>
                <CustomAlert type={formAlert.type} title={formAlert.title} message={formAlert.msg} />
              </div>
            )}

            <main>
              {step === 1 ? (
                <Step1Yudisium studentInfo={studentInfo} lecturers={lecturers} />
              ) : (
                <Step2Yudisium registrationId={registrationId} studentInfo={studentInfo} setFormAlert={setFormAlert} />
              )}
            </main>

            <footer className="footer-nav">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button className="btn-pagination" onClick={() => setStep(1)} disabled={step === 1 || isSubmitting}>
                  <ChevronLeft size={16} />
                </button>
                <div className={`page-num ${step === 1 ? "active" : ""}`} onClick={() => setStep(1)}>1</div>
                <div className={`page-num ${step === 2 ? "active" : ""}`} onClick={() => setStep(2)}>2</div>
                <button className="btn-pagination" onClick={() => setStep(2)} disabled={step === 2 || isSubmitting}>
                  <ChevronRight size={16} />
                </button>
              </div>

              {step === 1 ? (
                <button className="btn-primary" onClick={handleSaveStep1} disabled={isSavingStep1}>
                  {isSavingStep1 ? "Menyimpan..." : "Simpan & Lanjutkan"}
                </button>
              ) : (
                isStep2Complete() ? (
                  <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || !registrationId}>
                    {isSubmitting ? "Mengirim..." : "Submit Pendaftaran"}
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleSaveDraft} style={{ background: '#F59E0B', color: '#fff', border: 'none' }}>
                    Simpan Draft
                  </button>
                )
              )}
            </footer>
          </div>
        </div>
      </div>

      <style>{`
        #yudisium-main { 
          margin-left: var(--sidebar-width, 240px); 
          width: calc(100% - var(--sidebar-width, 240px)); 
          transition: margin-left 0.3s ease, width 0.3s ease; 
          display: flex; 
          flex-direction: column; 
        }

        .sidebar-hidden aside,
        .sidebar-hidden #sidebar,
        .sidebar-hidden .sidebar-mahasiswa {
          transform: translateX(-100%) !important;
          transition: transform 0.3s ease;
        }

        .sidebar-hidden #yudisium-main {
          margin-left: 0 !important;
          width: 100% !important;
        }
        
        .yudisium-wrapper { 
          width: 100% !important; 
          max-width: 100% !important; 
          margin: 0 !important; 
          position: relative !important; 
          min-height: 100vh !important; 
          zoom: 0.8; 
        }
        @-moz-document url-prefix() {
          .yudisium-wrapper {
             transform: scale(0.8);
             transform-origin: top left;
             width: 125% !important; 
          }
        }

        @media (max-width: 991.98px) { 
          #yudisium-main { margin-left: 0; width: 100%; } 
        }
      `}</style>
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