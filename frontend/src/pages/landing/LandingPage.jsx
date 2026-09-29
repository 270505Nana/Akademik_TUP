import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  BookOpen, FilePlus2, Gavel, GraduationCap, Mic2, MapPin,
  MessageCircle, Users,
} from "lucide-react";
import CountdownBanner from "../../components/landing/CountdownBanner";
import DocumentCard from "../../components/landing/DocumentCard";
import heroImage from "../../assets/Telu.webp";
import { getLucideIcon } from "../../utils/iconMapper";
import '../../components/landing/landing.css';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

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
  const [dokumenPreview, setDokumenPreview] = useState([]);

  useEffect(() => {
    let isMounted = true;

    publicApi
      .get("/api/pusat-informasi/preview")
      .then((response) => {
        if (isMounted) {
          setPeriodeSidang(response.data?.periodeSidang ?? null);
          setPeriodeYudisium(response.data?.periodeYudisium ?? null);
          setDokumenPreview(response.data?.dokumenPanduanTugasAkhir ?? []);
        }
      })
      .catch((error) => {
        console.error("Gagal memuat data preview periode:", error);
        if (isMounted) {
          setPeriodeSidang(null);
          setPeriodeYudisium(null);
          setDokumenPreview([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  //semua dokumen preview dari semua kategori digabung dulu. Yang kategorinya mengandung "yudisium" masuk ke section Yudisium, sisanya masuk ke section Pusat Informasi Tugas Akhir.
  const allPreviewDocs = (dokumenPreview || []).flatMap((g) => g.data ?? []);
  const isYudisiumDoc = (doc) =>
    (doc.category || "").toLowerCase().includes("yudisium");

  const yudisiumDocs = allPreviewDocs.filter(isYudisiumDoc);
  const taDocs = allPreviewDocs.filter((doc) => !isYudisiumDoc(doc));

  return (
    <div className="landing-page">
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <a href="#beranda" className="lp-logo">SIMTA</a>
          <nav className="lp-nav" aria-label="Navigasi utama">
            <a href="#pusat-informasi">PUSAT INFORMASI</a>
            <a href="#bantuan">BANTUAN</a>
            <Link to="/login" className="lp-btn lp-btn-outline">Login SSO</Link>
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
              <a href="#pusat-informasi" className="lp-btn lp-btn-outline">Panduan PDF</a>
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
              {taDocs.length > 0 ? (
                taDocs.map((doc, index) => (
                  <DocumentCard
                    key={doc.id || index}
                    title={doc.name}
                    description={doc.description}
                    link={doc.url}
                    linkLabel="📄 Lihat Dokumen"
                    icon={getLucideIcon(doc.icon, 20)}
                    accent={index % 2 === 0 ? "red" : "gold"}
                  />
                ))
              ) : (
                <p style={{ color: "#6B7280", fontSize: "14px", fontStyle: "italic", gridColumn: "1 / -1", margin: "16px 0" }}>
                  Belum ada dokumen tersedia
                </p>
              )}
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
              {yudisiumDocs.length > 0 ? (
                yudisiumDocs.map((doc, index) => (
                  <DocumentCard
                    key={doc.id || index}
                    title={doc.name}
                    description={doc.description}
                    link={doc.url}
                    linkLabel="📄 Lihat Dokumen"
                    icon={getLucideIcon(doc.icon, 20)}
                    accent={index % 2 === 0 ? "red" : "gold"}
                  />
                ))
              ) : (
                <p style={{ color: "#6B7280", fontSize: "14px", fontStyle: "italic", gridColumn: "1 / -1", margin: "16px 0" }}>
                  Belum ada dokumen tersedia
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer" id="bantuan">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-col lp-footer-brand-col">
              <p className="lp-footer-brand">SIMTA</p>
              <p className="lp-footer-tagline">
                Sistem Informasi Manajemen Tugas Akhir Telkom University Purwokerto.
                Membantu mahasiswa mengakses layanan administrasi Tugas Akhir secara terpadu.
              </p>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Tautan Layanan</h4>
              <nav className="lp-footer-links" aria-label="Tautan layanan">
                <a href="https://telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">Website Telkom University</a>
                <a href="https://igracias.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">i-Gracias</a>
                <a href="https://openlibrary.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">Perpustakaan</a>
                <a href="https://baa.telkomuniversity.ac.id" target="_blank" rel="noopener noreferrer">Layanan Akademik</a>
              </nav>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">Bantuan Tugas Akhir</h4>
              <a
                href="https://wa.me/6285117001281"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-footer-contact"
              >
                <span className="lp-footer-contact-icon">
                  <MessageCircle size={16} />
                </span>
                <span className="lp-footer-contact-text">
                  <strong>WhatsApp Admin</strong>
                  <span className="lp-footer-contact-sub">0851-1700-1281</span>
                </span>
              </a>

              <a href="#" className="lp-footer-contact">
                <span className="lp-footer-contact-icon">
                  <Users size={16} />
                </span>
                <span className="lp-footer-contact-text">
                  <strong>Saluran Informasi TA</strong>
                  <span className="lp-footer-contact-sub">Jadwal &amp; pengumuman Tugas Akhir</span>
                </span>
              </a>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">© 2026 Telkom University Purwokerto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;