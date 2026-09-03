import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Menu, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [formAlert, setFormAlert] = useState(null);

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
    getLecturers().then(res => setLecturers(res || [])).catch(console.error);
    
    const initData = async () => {
      try {
        const templates = await getYudisiumTemplates();
        dispatch({ type: "SET_DYNAMIC_DOCUMENTS", payload: templates });

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
    judulTugasAkhirIndonesia: data.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: data.judulTugasAkhirInggris,
    isDraft: true,
    tglSidang: new Date().toISOString(),
    skemaSidang: data.skemaSidang,
    pengajuanCumlaude: data.pengajuanCumlaude,
    skemaCumlaude: data.pengajuanCumlaude !== "Non Cumlaude" ? (Array.isArray(data.skemaCumlaude) ? data.skemaCumlaude.join(", ") : data.skemaCumlaude) : "",
    evidenCumlaude: data.pengajuanCumlaude !== "Non Cumlaude" ? data.evidenCumlaude : null,
    berminatWirausaha: data.minatWirausaha === "Ya",
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
        isDraft: false
      });

      setFormAlert({ 
        type: "success", 
        title: "Pendaftaran Berhasil!", 
        msg: "Pendaftaran kamu berhasil dikirim. Tim akademik akan memverifikasi berkas yang telah kamu lampirkan." 
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        window.location.reload(); 
      }, 2500);
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
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <CheckCircle2 color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} size={20} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, color: '#166534', fontWeight: 800, fontSize: '15px' }}>Pendaftaran Yudisium Disetujui</h4>
              <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>DISETUJUI</span>
            </div>
            <p style={{ margin: 0, color: '#15803D', fontSize: '13px', lineHeight: '1.5' }}>Selamat! Pendaftaran yudisium kamu telah diverifikasi dan disetujui oleh admin akademik.</p>
          </div>
        </div>
      );
    }

    if (data.isEdit) {
      return (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, color: '#92400E', fontWeight: 800, fontSize: '15px' }}>Pendaftaran Memerlukan Perbaikan Dokumen</h4>
              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>PERLU PERBAIKAN</span>
            </div>
            <p style={{ margin: 0, color: '#B45309', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' }}>
              Tim akademik memberikan catatan: <strong>"{data.message}"</strong>. Silakan perbaiki pengajuan kamu melalui formulir di bawah ini dan kirim ulang.
            </p>
            <div style={{ background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #FDE68A', display: 'inline-block' }}>
              <div style={{ fontSize: '12px', color: '#92400E' }}><strong>Batas Waktu Perbaikan:</strong> {new Date(data.isEdit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      );
    }

    if (!data.isDraft) {
      return (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Clock color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} size={20} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, color: '#1E3A8A', fontWeight: 800, fontSize: '15px' }}>Pendaftaran Sedang Diproses</h4>
              <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>MENUNGGU VERIFIKASI</span>
            </div>
            <p style={{ margin: 0, color: '#1D4ED8', fontSize: '13px', lineHeight: '1.5' }}>Pendaftaran yudisium kamu telah berhasil dikirim dan sedang menunggu proses verifikasi oleh tim akademik. Mohon pantau halaman ini secara berkala.</p>
          </div>
        </div>
      );
    }
    
    return null;
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
              {renderStatusBanner()}
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
                isLocked ? (
                  <button className="btn-primary" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Lanjut ke Dokumen <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleSaveStep1} disabled={isSavingStep1}>
                    {isSavingStep1 ? "Menyimpan..." : "Simpan & Lanjutkan"}
                  </button>
                )
              ) : (
                !isLocked && (
                  isStep2Complete() ? (
                    <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || !registrationId}>
                      {isSubmitting ? "Mengirim..." : "Submit Pendaftaran"}
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleSaveDraft} style={{ background: '#F59E0B', color: '#fff', border: 'none' }}>
                      Simpan Draft
                    </button>
                  )
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