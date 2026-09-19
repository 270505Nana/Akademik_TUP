import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Award, BookOpen, ClipboardCheck, FilePlus2, Gavel, GraduationCap, Mic2, MapPin,
} from "lucide-react";
import CountdownBanner from "../../components/landing/CountdownBanner";
import DocumentCard from "../../components/landing/DocumentCard";
import heroImage from "../../assets/Telu.webp";
import '../../components/landing/landing.css';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

const TA_DOCUMENTS = [
  {
    id: 1,
    title: "Panduan Tugas Akhir",
    description:
      "Panduan komprehensif penulisan, format dokumen, hingga prosedur pendaftaran sidang.",
    link: "#",
    accent: "red",
    linkLabel: "📄 Lihat Panduan (PDF)",
    icon: <BookOpen size={20} />,
  },
  {
    id: 2,
    title: "Aturan Luaran TA",
    description:
      "Ketentuan Cumlaude dan Summa Cumlaude serta panduan penggunaan Artificial Intelligence (AI) dalam Tugas Akhir.",
    link: "#",
    accent: "gold",
    linkLabel: "📄 Lihat Panduan (PDF)",
    icon: <Gavel size={20} />,
  },
];

const YUDISIUM_DOCUMENTS = [
  {
    id: 3,
    title: "Panduan Pendaftaran Yudisium",
    description:
      "Langkah-langkah pendaftaran yudisium online, pengumpulan berkas fisik, dan persetujuan dari kaprodi.",
    link: "#",
    accent: "red",
    linkLabel: "📄 Lihat Dokumen (PDF)",
    icon: <ClipboardCheck size={20} />,
  },
  {
    id: 4,
    title: "Syarat Berkas Yudisium & Syarat Kelulusan (Cumlaude & Summa Cumlaude)",
    description:
      "Kriteria kelulusan dengan predikat Cumlaude dan Summa Cumlaude, termasuk ketentuan IPK, masa studi, serta nilai akademik.",
    link: "#",
    accent: "gold",
    linkLabel: "📄 Lihat Dokumen (PDF)",
    icon: <Award size={20} />,
  },
];

const TA_STAGES = [
  { step: 1, label: "Pengajuan Judul", icon: <FilePlus2 size={22} />, tone: "red" },
  { step: 2, label: "Pengerjaan", icon: <BookOpen size={22} />, tone: "gold" },
  { step: 3, label: "Seminar Hasil", icon: <Mic2 size={22} />, tone: "red" },
  { step: 4, label: "Sidang Akhir", icon: <Gavel size={22} />, tone: "gold" },
  { step: 5, label: "Yudisium", icon: <GraduationCap size={22} />, tone: "red" },
];

const formatPeriodSubtitle = (periode) => {
  if (!periode) return "";
  const nameLower = (periode.name || "").toLowerCase();
  const semester = nameLower.includes("genap")
    ? "Genap"
    : nameLower.includes("ganjil")
      ? "Ganjil"
      : "Umum";
  const periodVal = periode.period || "";

  if (semester !== "Umum" && periodVal) {
    return `Semester ${semester} ${periodVal}`;
  }
  if (semester !== "Umum") {
    return `Semester ${semester}`;
  }
  return periode.name || (periodVal ? `Tahun Ajaran ${periodVal}` : "");
};

const LandingPage = () => {
  const [periodeSidang, setPeriodeSidang] = useState(null);
  const [periodeYudisium, setPeriodeYudisium] = useState(null);

  useEffect(() => {
    let isMounted = true;

    publicApi
      .get("/api/pusat-informasi/preview")
      .then((response) => {
        if (isMounted) {
          setPeriodeSidang(response.data?.periodeSidang ?? null);
          setPeriodeYudisium(response.data?.periodeYudisium ?? null);
        }
      })
      .catch((error) => {
        console.error("Gagal memuat data preview periode:", error);
        if (isMounted) {
          setPeriodeSidang(null);
          setPeriodeYudisium(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="landing-page">
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <a href="#beranda" className="lp-logo">SIMTA</a>
          <nav className="lp-nav" aria-label="Navigasi utama">
            <a href="#pusat-informasi">PUSAT INFORMASI</a>
            <a href="#bantuan">BANTUAN</a>
            <Link to="/login" className="lp-btn lp-btn-primary">Login SSO</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="lp-hero" id="beranda">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <h1>
                <span className="lp-hero-brand">SIMTA</span>
                <span className="lp-hero-title">Sistem Informasi Manajemen Tugas Akhir</span>
              </h1>
              <p className="lp-hero-desc">
                Temukan berbagai informasi dan layanan Tugas Akhir dalam satu portal. SIMTA hadir untuk membantu mahasiswa Telkom University Purwokerto mengakses kebutuhan administrasi Tugas Akhir dengan lebih praktis dan terintegrasi.
              </p>
              <a href="#pusat-informasi" className="lp-btn lp-btn-primary">Panduan PDF</a>
            </div>
            <div className="lp-hero-visual">
              <div className="lp-hero-visual-frame">
                <img
                  src={heroImage}
                  alt="Gedung Telkom University Purwokerto"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="lp-hero-badge">
                  <span className="lp-hero-badge-icon">
                    <MapPin size={16} />
                  </span>
                  <span className="lp-hero-badge-text">
                    <span className="lp-hero-badge-title">Telkom University</span>
                    <span className="lp-hero-badge-sub">Purwokerto</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" id="alur">
          <div className="lp-container">
            <h2 className="lp-section-title">Alur Pengerjaan Tugas Akhir</h2>
            <p className="lp-section-sub">Tahapan resmi dari pengajuan judul hingga yudisium.</p>
            <ol className="lp-timeline">
              {TA_STAGES.map((stage) => (
                <li className="lp-timeline-item" key={stage.step}>
                  <div className={`lp-timeline-icon lp-timeline-icon--${stage.tone}`}>
                    {stage.icon}
                  </div>
                  <p className="lp-timeline-step">Tahap {stage.step}</p>
                  <p className="lp-timeline-label">{stage.label}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section" id="pusat-informasi">
          <div className="lp-container">
            <div className="lp-section-head">
              <div>
                <h2 className="lp-section-title">Pusat Informasi Tugas Akhir</h2>
                <p className="lp-section-sub">Semua hal yang berkaitan dengan proses dan administrasi Tugas Akhir.</p>
              </div>
              <Link to="/pusat-informasi" className="lp-btn lp-btn-outline">Lihat Detail →</Link>
            </div>

            <CountdownBanner
              title="Batas Akhir Sidang TA"
              subtitle={formatPeriodSubtitle(periodeSidang)}
              targetDate={periodeSidang ? periodeSidang.endDate : new Date().toISOString()}
            />

            <div className="lp-doc-grid" id="dokumen-ta">
              {TA_DOCUMENTS.map((doc) => (
                <DocumentCard key={doc.id} {...doc} />
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="yudisium">
          <div className="lp-container">
            <div className="lp-section-head">
              <div>
                <h2 className="lp-section-title">Pusat Informasi Yudisium</h2>
                <p className="lp-section-sub">Segala sesuatu yang diperlukan untuk persiapan dan kelulusan yudisium Anda.</p>
              </div>
            </div>

            <CountdownBanner
              title="Batas Pendaftaran Yudisium"
              subtitle={formatPeriodSubtitle(periodeYudisium)}
              targetDate={periodeYudisium ? periodeYudisium.endDate : new Date().toISOString()}
            />

            <div className="lp-doc-grid">
              {YUDISIUM_DOCUMENTS.map((doc) => (
                <DocumentCard key={doc.id} {...doc} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer" id="bantuan">
        <div className="lp-container lp-footer-inner">
          <div>
            <p className="lp-footer-brand">SIMTA</p>
            <p className="lp-footer-copy">© 2026 Telkom University. All rights reserved.</p>
          </div>
          <nav className="lp-footer-links" aria-label="Tautan bantuan">
            <a href="https://telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">Website Telkom University</a>
            <a href="https://igracias.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">i-Gracias</a>
            <a href="https://openlibrary.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">Perpustakaan</a>
            <a href="https://baa.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">Layanan Akademik</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;