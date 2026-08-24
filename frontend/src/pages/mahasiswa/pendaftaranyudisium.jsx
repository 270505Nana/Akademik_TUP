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
import { REQUIRED_SLUGS, SECTIONS } from "../../components/mahasiswa/yudisium/YudisiumDocument";

import { 
  getLecturers, 
  saveYudisiumRegistration, 
  uploadYudisiumRegistrationFile, 
  submitYudisiumRegistration, 
  getActiveYudisiumPeriod
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

function validateStep2(data, documents) {
  const missingWajib = documents.filter(doc => REQUIRED_SLUGS.includes(doc.slug) && !doc.file);
  if (missingWajib.length > 0) {
    return `Ada ${missingWajib.length} dokumen wajib yang belum diunggah.`;
  }

  if (data.pengajuanCumlaude !== "Non Cumlaude") {
    const cumlaudeDoc = documents.find(doc => doc.section === SECTIONS.CUMLAUDE);
    if (cumlaudeDoc && !cumlaudeDoc.file) {
      return "Dokumen bukti prestasi Cumlaude wajib diunggah.";
    }
  }

  if (data.minatWirausaha === "Ya") {
    const wirausahaDoc = documents.find(doc => doc.section === SECTIONS.WIRAUSAHA);
    if (wirausahaDoc && !wirausahaDoc.file) {
      return "Formulir Pendaftaran Mahasiswa Berprestasi Bidang Inovasi & Kewirausahaan wajib diunggah.";
    }
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
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [registrationId, setRegistrationId] = useState(null);
  const [formAlert, setFormAlert] = useState(null);

  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;

  const studentInfo = {
    nama: student?.namaLengkap || profile?.name || user?.username || "-",
    nim: student?.nim || profile?.nim || "-",
    prodi: student?.studyProgramNama || profile?.studyProgram?.name || "-",
    phone: user?.phone || profile?.phone || user?.no_telp || "-",
  };

  useEffect(() => {
    getLecturers().then(res => setLecturers(res || [])).catch(console.error);
  }, []);

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
      setFormAlert({ type: "error", msg: error });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setIsSavingStep1(true);
      const payload = buildSavePayload();
      const result = await saveYudisiumRegistration(payload);
      
      const savedId = result?.id ?? result?.data?.id ?? null;
      if (savedId) setRegistrationId(savedId);
      
      setStep(2);
    } catch (e) {
      setFormAlert({ type: "error", msg: e.response?.data?.message || "Gagal menyimpan draft yudisium." });
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
      setFormAlert({ type: "error", msg: "Simpan draft di Step 1 terlebih dahulu." });
      return;
    }

    try {
      setIsSubmitting(true);

      const filesToUpload = documents.filter(doc => doc.file);
      for (const doc of filesToUpload) {
        await uploadYudisiumRegistrationFile(registrationId, {
          file: doc.file,
          slug: doc.slug,
          name: doc.name
        });
      }

      await submitYudisiumRegistration({
        ...buildSavePayload(),
        id: registrationId,
        isConfirmed: true
      });

      localStorage.removeItem("yudisium_form_draft");
      
      alert(
        "Pendaftaran Berhasil!\n\n" +
        "Apabila terdapat revisi berkas Mohon konfirmasi pembaruan ke Helpdesk Tugas Akhir (+6285117001281).\n\n" +
        "Setelah menjadi TUNC, Telkom University Purwokerto tidak menyelenggarakan ceremonial yudisium. Sidang Yudisium dilaksanakan tertutup. SKL diterbitkan 2-3 minggu setelah status di Kampus Pusat selesai diproses."
      );
      
      navigate("/mahasiswa/dashboard");
    } catch (e) {
      setFormAlert({ type: "error", msg: e.response?.data?.message || "Gagal submit pendaftaran yudisium." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F4F6FB" }}>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div id="yudisium-main" className="flex-1 relative">
        <div className="page-wrapper yudisium-wrapper">
          <div className="top-header-nav">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                className="topbar-toggle lg:hidden" 
                onClick={() => setSidebarOpen(true)} 
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
                <CustomAlert type={formAlert.type} message={formAlert.msg} />
              </div>
            )}

            <main>
              {step === 1 ? (
                <Step1Yudisium studentInfo={studentInfo} lecturers={lecturers} />
              ) : (
                <Step2Yudisium />
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
                <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || !registrationId}>
                  {isSubmitting ? "Mengunggah & Mengirim..." : "Submit Pendaftaran"}
                </button>
              )}
            </footer>
          </div>
        </div>
      </div>

      <style>{`
        #yudisium-main {
          margin-left: var(--sidebar-width, 240px);
          width: calc(100% - var(--sidebar-width, 240px));
          transition: margin-left 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        /* Menimpa global styling dari sidang.css agar tidak menabrak sidebar */
        .yudisium-wrapper {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          position: relative !important;
          min-height: 100vh !important;
        }

        @media (max-width: 991.98px) {
          #yudisium-main {
            margin-left: 0;
            width: 100%;
          }
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