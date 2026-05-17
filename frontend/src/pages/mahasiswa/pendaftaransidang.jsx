import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../components/mahasiswa/sidang/sidang.css";
import logoSimta from "../../assets/logo-simta.png";
import logoTelkom from "../../assets/logo-telkom.png";
import {
  useSidangContext,
  SidangFormProvider,
} from "../../context/SidangFormContext";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";
import Step1 from "../../components/mahasiswa/sidang/Step1Sidang";
import Step2 from "../../components/mahasiswa/sidang/Step2Sidang";
import {
  getLecturers,
  getSidangRegistrationByStudentId,
  getSktaResponseUploadByStudentId,
  saveSidangRegistration,
  submitSidangRegistration,
} from "../../service/api";

function PendaftaranSidangContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useSidangContext();
  const { user, profile } = useAuth();
  const { student } = useStudent();
  const { step, data } = state;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [skta, setSkta] = useState(false);
  const [isSktaChecking, setIsSktaChecking] = useState(true);
  const [isRegistrationLoading, setIsRegistrationLoading] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [registrationId, setRegistrationId] = useState(null);

  const studentId = profile?.id || student?.studentId || user?.id;

  const studentInfo = {
    nama: student?.namaLengkap || profile?.name || user?.username || "-",
    nim: student?.nim || profile?.nim || "-",
    prodi:
      student?.studyProgramNama ||
      profile?.studyProgram?.name ||
      profile?.studyProgramName ||
      "-",
    phone: user?.phone || profile?.phone || user?.no_telp || "-",
    dosenWaliKode:
      student?.dosenWaliKode || profile?.dosenWali?.lecturerCode || "-",
    dosenWaliNama: student?.dosenWaliNama || profile?.dosenWali?.name || "-",
    dosenWaliNip: student?.dosenWaliNip || profile?.dosenWali?.nip || "-",
  };

  // Auto-fill from Auth state, buat auto generate
  /*
  useEffect(() => {
    if (user) {
      dispatch({
        type: 'SET_INITIAL_DATA',
        payload: {
          nama: user.nama || user.username || '',
          nim: user.nim || '',
          prodi: user.prodi || '',
          doswal: user.doswal || '',
          nipDoswal: user.nipDoswal || '',
          pembimbing1: user.pembimbing1 || '',
          pembimbing2: user.pembimbing2 || '',
          kelompokKeilmuan: user.kelompokKeilmuan || null
        }
      });
    }
  }, [user, dispatch]);
  */

  const setStep = (val) => {
    dispatch({ type: "SET_STEP", value: val });
  };

  const handleSubmit = async () => {
    // Basic validasi buat yg masih kocong sm yg step 1blm
    /*
    const incompleteDocs = documents.filter(d => d.status !== 'completed');
    if (incompleteDocs.length > 0) {
      alert(`Harap lengkapi semua dokumen! (${incompleteDocs.length} dokumen tersisa)`);
      setStep(2);
      return;
    }

    if (!data.skema || !data.periodeSidang) {
      alert('Harap lengkapi Skema dan Periode Sidang di Step 1!');
      setStep(1);
      return;
    }
    */

    try {
      setIsSubmitting(true);
      const payload = buildSavePayload();
      await submitSidangRegistration(payload);

      localStorage.removeItem("sidang_form_draft");

      alert("Berhasil Daftar Sidang");
      navigate("/mahasiswa/dashboard");
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Gagal submit pendaftaran sidang.");
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
        programType: registration.programType || "",
        sidangScheme: registration.sidangScheme || "",
        jalurNonSidang: registration.jalurNonSidang || [],
        sks: registration.sks ?? "",
        ipk: registration.ipk ?? "",
        tak: registration.tak ?? "",
        sktaExpDate: normalizeDateInput(registration.sktaExpDate),
        thesisTitleId: registration.thesisTitleId || "",
        thesisTitleEn: registration.thesisTitleEn || "",
        dosenPembimbing1Id: registration.dosenPembimbing1Id || "",
        dosenPembimbing2Id: registration.dosenPembimbing2Id || "",
      },
    });
  };

  const extractRegistrationId = (registration) => {
    if (!registration) return null;
    if (registration.id) return registration.id;
    if (registration.data?.id) return registration.data.id;
    return null;
  };

  const initRegistration = async (id) => {
    setIsRegistrationLoading(true);
    try {
      const existing = await getSidangRegistrationByStudentId(id);
      if (!existing) {
        const created = await saveSidangRegistration({ studentId: id });
        setRegistrationId(extractRegistrationId(created));
        applyRegistrationToForm(created);
        return;
      }
      setRegistrationId(extractRegistrationId(existing));
      applyRegistrationToForm(existing);
    } catch (e) {
      console.error("Gagal memuat data pendaftaran sidang:", e);
    } finally {
      setIsRegistrationLoading(false);
    }
  };

  const extractUploads = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  };

  async function checkSkta() {
    if (!studentId) {
      setIsSktaChecking(false);
      return;
    }
    try {
      const response = await getSktaResponseUploadByStudentId(studentId);
      const uploads = extractUploads(response);
      const hasSkta = uploads.length > 0;
      setSkta(hasSkta);
      if (hasSkta) {
        await initRegistration(studentId);
      }
    } catch (e) {
      if (e.response?.status === 404) {
        return;
      }
      // setErr(true);
      console.error("Error fetching data:", e);
    } finally {
      setIsSktaChecking(false);
    }
  }

  useEffect(() => {
    setIsSktaChecking(true);
    checkSkta();
  }, [studentId]);

  useEffect(() => {
    let isMounted = true;
    getLecturers()
      .then((data) => {
        if (isMounted) setLecturers(data || []);
      })
      .catch((e) => console.error("Gagal memuat daftar dosen:", e));
    return () => {
      isMounted = false;
    };
  }, []);

  const buildSavePayload = () => ({
    programType: data.programType,
    sidangScheme: data.sidangScheme,
    jalurNonSidang: Array.isArray(data.jalurNonSidang)
      ? data.jalurNonSidang
      : [],
    sks: data.sks ? Number(data.sks) : 0,
    ipk: data.ipk ? Number(data.ipk) : 0,
    tak: data.tak ? Number(data.tak) : 0,
    sktaExpDate: data.sktaExpDate || null,
    thesisTitleId: data.thesisTitleId,
    thesisTitleEn: data.thesisTitleEn,
    studentId,
    dosenPembimbing1Id: data.dosenPembimbing1Id
      ? Number(data.dosenPembimbing1Id)
      : null,
    dosenPembimbing2Id: data.dosenPembimbing2Id
      ? Number(data.dosenPembimbing2Id)
      : null,
  });

  const handleSaveStep1 = async () => {
    try {
      if (!studentId) {
        alert("Data mahasiswa belum tersedia. Silakan coba lagi.");
        return;
      }
      setIsSavingStep1(true);
      await saveSidangRegistration(buildSavePayload());
      setStep(2);
    } catch (e) {
      console.error("Gagal menyimpan pendaftaran sidang:", e);
      alert("Gagal menyimpan data pendaftaran sidang.");
    } finally {
      setIsSavingStep1(false);
    }
  };

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
          <img
            src={logoSimta}
            alt="SIMTA Logo"
            className="simta-brand-logo"
            referrerPolicy="no-referrer"
          />
          <div className="logo-divider"></div>
          <img
            src={logoTelkom}
            alt="Telkom Logo"
            className="telkom-brand-logo"
            referrerPolicy="no-referrer"
          />
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
            <main>
              {step === 1 ? (
                <Step1 studentInfo={studentInfo} lecturers={lecturers} />
              ) : (
                <Step2 registrationId={registrationId} />
              )}
            </main>

            <footer className="footer-nav">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <button
                  className="btn-pagination"
                  onClick={() => setStep(1)}
                  disabled={step === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <div
                  className={`page-num ${step === 1 ? "active" : ""}`}
                  onClick={() => setStep(1)}
                >
                  1
                </div>
                <div
                  className={`page-num ${step === 2 ? "active" : ""}`}
                  onClick={() => setStep(2)}
                >
                  2
                </div>
                <button
                  className="btn-pagination"
                  onClick={() => setStep(2)}
                  disabled={step === 2}
                >
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
            <h2 className="skta-warning-title">
              Pendaftaran Sidang Belum Tersedia
            </h2>
            <p className="skta-warning-text">
              SKTA kamu belum diterbitkan. Silakan tunggu hingga SKTA terbit
              sebelum mendaftar sidang.
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
