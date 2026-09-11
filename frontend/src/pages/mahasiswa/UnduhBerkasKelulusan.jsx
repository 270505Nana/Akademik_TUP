import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  X,
  Megaphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import CustomAlert from '../../components/common/CustomAlert';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import {
  getMySklUpload,
  getMyTranskripUpload,
  downloadSklFile,
  downloadTranskripFile,
} from '../../service/api';

import '../../components/mahasiswa/unduhskltranskrip/unduhskltrankrip.css';
import logoSimta from '../../assets/logo-simta.png';
import logoTelkom from '../../assets/logo-telkom.png';

/* ─── Helper Format Tanggal ─────────────────────────────────────────────────── */
const formatDateIndo = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/* ─── Komponen Utama Unduh Berkas Kelulusan Mahasiswa ─────────────────────── */
const UnduhBerkasKelulusan = () => {
  const navigate = useNavigate();

  /* ── Sidebar State ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ── User & Student Context ── */
  const { user, profile } = useAuth();
  const { student } = useStudent();

  const mahasiswaId = student?.mahasiswaId || profile?.id || user?.id;
  const prodiName =
    student?.studyProgramNama ||
    profile?.studyProgram?.name ||
    'Program Studi';

  /* ── State Data Berkas ── */
  const [loading, setLoading] = useState(true);
  const [sklData, setSklData] = useState(null);
  const [transkripData, setTranskripData] = useState(null);

  /* ── State Download & Preview ── */
  const [downloadingType, setDownloadingType] = useState(null);
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    title: '',
    fileName: '',
    blobUrl: null,
    uploadId: null,
    docType: null,
  });
  const activeBlobUrlRef = useRef(null);

  /* ── State Alert Toast ── */
  const [toastAlert, setToastAlert] = useState({ show: false, type: 'info', title: '', message: '' });

  const showToast = useCallback((type, title, message) => {
    setToastAlert({ show: true, type, title, message });
    setTimeout(() => setToastAlert((prev) => ({ ...prev, show: false })), 4000);
  }, []);

  /* ─── Fetch Data SKL & Transkrip Milik Mahasiswa ─────────────────────────── */
  const fetchStudentDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const [sklRes, transkripRes] = await Promise.all([
        getMySklUpload(mahasiswaId).catch(() => null),
        getMyTranskripUpload(mahasiswaId).catch(() => null),
      ]);

      setSklData(sklRes);
      setTranskripData(transkripRes);
    } catch (err) {
      console.error('Gagal mengambil berkas kelulusan:', err);
      showToast('error', 'Gagal Memuat Data', 'Tidak dapat mengambil status berkas kelulusan.');
    } finally {
      setLoading(false);
    }
  }, [mahasiswaId, showToast]);

  useEffect(() => {
    fetchStudentDocuments();
  }, [fetchStudentDocuments]);

  /* ─── Cleanup Object URL saat unmount ────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  /* ─── Handler Unduh File Langsung ────────────────────────────────────────── */
  const handleDownloadDoc = async (type, uploadId, fileName) => {
    if (!uploadId) return;
    setDownloadingType(type);
    try {
      const blob = type === 'SKL'
        ? await downloadSklFile(uploadId)
        : await downloadTranskripFile(uploadId);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `${type}_${student?.nim || 'Mahasiswa'}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('success', 'Unduhan Berhasil', `File ${type} berhasil diunduh.`);
    } catch (err) {
      console.error(`Gagal mengunduh berkas ${type}:`, err);
      showToast('error', 'Gagal Mengunduh', `Terjadi kesalahan saat mengunduh berkas ${type}.`);
    } finally {
      setDownloadingType(null);
    }
  };

  /* ─── Handler Buka Modal Pratinjau PDF ───────────────────────────────────── */
  const handleOpenPreview = async (type, uploadId, title, fileName) => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    try {
      const blob = type === 'SKL'
        ? await downloadSklFile(uploadId)
        : await downloadTranskripFile(uploadId);

      const objectUrl = URL.createObjectURL(blob);
      activeBlobUrlRef.current = objectUrl;

      setPreviewState({
        isOpen: true,
        title,
        fileName: fileName || `${type}_${student?.nim || 'Mahasiswa'}.pdf`,
        blobUrl: objectUrl,
        uploadId,
        docType: type,
      });
    } catch (err) {
      console.error(`Gagal memuat pratinjau ${type}:`, err);
      showToast('error', 'Gagal Memuat Pratinjau', 'Tidak dapat menampilkan dokumen PDF.');
    }
  };

  const handleClosePreview = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setPreviewState({
      isOpen: false,
      title: '',
      fileName: '',
      blobUrl: null,
      uploadId: null,
      docType: null,
    });
  };

  return (
    <div className={`flex min-h-screen ${sidebarCollapsed ? 'sidebar-hidden' : ''}`} style={{ background: "#F4F6FB" }}>
      {/* ── Sidebar Mahasiswa ── */}
      <SidebarMahasiswa
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div id="yudisium-main" className="flex-1 relative">
        <div className="page-wrapper yudisium-wrapper">
          {/* ── Top Header Nav (Sama dengan Registrasi Yudisium) ── */}
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
            {/* ── Kotak Informasi / Pemberitahuan Berkas Kelulusan ── */}
            <div className="ub-notice-card">
              <div className="ub-notice-icon-wrapper">
                <Megaphone size={18} color="#92400E" />
              </div>
              <div className="ub-notice-content">
                <h3 className="ub-notice-title">Pemberitahuan Berkas Kelulusan</h3>
                <p className="ub-notice-text">
                  Dokumen SKL dan Transkrip Nilai diterbitkan secara resmi oleh Bagian Unit Akademik.
                  Tombol unduh hanya akan aktif jika berkas PDF telah diunggah dan diverifikasi oleh Admin.
                </p>
              </div>
            </div>

            {/* ── Grid 2 Card Dokumen (SKL & Transkrip) ── */}
            <div className="ub-cards-grid">
              {/* ─── CARD 1: Surat Keterangan Lulus (SKL) ─── */}
              <div className="ub-doc-card">
                <div className="ub-doc-card-header">
                  <div className="ub-doc-info-left">
                    <div className="ub-doc-icon-box skl">
                      <FileText size={22} color="#C0182A" />
                    </div>
                    <div>
                      <span className="ub-doc-category-label">DOKUMEN KELULUSAN</span>
                      <h2 className="ub-doc-title">Surat Keterangan Lulus (SKL)</h2>
                    </div>
                  </div>

                  {/* Badge Status Ketersediaan */}
                  {sklData ? (
                    <span className="ub-badge ub-badge-available">
                      <CheckCircle2 size={13} /> Sudah Tersedia
                    </span>
                  ) : (
                    <span className="ub-badge ub-badge-unavailable">
                      <Clock size={13} /> Belum Tersedia
                    </span>
                  )}
                </div>

                <p className="ub-doc-description">
                  Surat resmi pengganti ijazah sementara yang menerangkan kelulusan mahasiswa pada {prodiName}.
                </p>

                {loading ? (
                  <div className="ub-loading-state">
                    <span className="ub-loading-spinner" />
                    <span>Memeriksa status dokumen…</span>
                  </div>
                ) : sklData ? (
                  /* Tampilan jika SKL SUDAH diunggah */
                  <div className="ub-doc-body-available">
                    <div className="ub-date-row">
                      <span className="ub-date-label">Tanggal Unggah</span>
                      <span className="ub-date-value">
                        {formatDateIndo(sklData.updatedAt || sklData.createdAt)}
                      </span>
                    </div>

                    <div className="ub-action-buttons-row">
                      <button
                        className="ub-btn-download"
                        disabled={downloadingType === 'SKL'}
                        onClick={() => handleDownloadDoc('SKL', sklData.id, sklData.name || `SKL_${student?.nim}.pdf`)}
                      >
                        <Download size={14} />
                        {downloadingType === 'SKL' ? 'Mengunduh…' : 'Unduh SKL (PDF)'}
                      </button>
                      <button
                        className="ub-btn-preview"
                        onClick={() => handleOpenPreview('SKL', sklData.id, 'Surat Keterangan Lulus (SKL)', sklData.name)}
                      >
                        <Eye size={14} /> Pratinjau
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Tampilan jika SKL BELUM diunggah */
                  <div className="ub-doc-body-unavailable">
                    <div className="ub-unavail-info-box">
                      <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <h4 className="ub-unavail-title">Berkas Belum Diunggah</h4>
                        <p className="ub-unavail-desc">
                          Surat keterangan lulus resmi belum diunggah oleh admin.
                          Tombol unduh akan aktif otomatis setelah berkas tersedia.
                        </p>
                      </div>
                    </div>

                    <button className="ub-btn-disabled" disabled>
                      <Lock size={14} /> Unduh SKL (Belum Tersedia)
                    </button>
                  </div>
                )}
              </div>

              {/* ─── CARD 2: Transkrip Nilai Akademik ─── */}
              <div className="ub-doc-card">
                <div className="ub-doc-card-header">
                  <div className="ub-doc-info-left">
                    <div className="ub-doc-icon-box transkrip">
                      <FileText size={22} color="#475569" />
                    </div>
                    <div>
                      <span className="ub-doc-category-label">DOKUMEN KELULUSAN</span>
                      <h2 className="ub-doc-title">Transkrip Nilai Akademik</h2>
                    </div>
                  </div>

                  {/* Badge Status Ketersediaan */}
                  {transkripData ? (
                    <span className="ub-badge ub-badge-available">
                      <CheckCircle2 size={13} /> Sudah Tersedia
                    </span>
                  ) : (
                    <span className="ub-badge ub-badge-unavailable">
                      <Clock size={13} /> Belum Tersedia
                    </span>
                  )}
                </div>

                <p className="ub-doc-description">
                  Daftar seluruh mata kuliah, total SKS, dan nilai kelulusan kumulatif terlegalisasi dari semester awal hingga akhir.
                </p>

                {loading ? (
                  <div className="ub-loading-state">
                    <span className="ub-loading-spinner" />
                    <span>Memeriksa status dokumen…</span>
                  </div>
                ) : transkripData ? (
                  /* Tampilan jika Transkrip SUDAH diunggah */
                  <div className="ub-doc-body-available">
                    <div className="ub-date-row">
                      <span className="ub-date-label">Tanggal Unggah</span>
                      <span className="ub-date-value">
                        {formatDateIndo(transkripData.updatedAt || transkripData.createdAt)}
                      </span>
                    </div>

                    <div className="ub-action-buttons-row">
                      <button
                        className="ub-btn-download"
                        disabled={downloadingType === 'Transkrip'}
                        onClick={() => handleDownloadDoc('Transkrip', transkripData.id, transkripData.name || `Transkrip_${student?.nim}.pdf`)}
                      >
                        <Download size={14} />
                        {downloadingType === 'Transkrip' ? 'Mengunduh…' : 'Unduh Transkrip (PDF)'}
                      </button>
                      <button
                        className="ub-btn-preview"
                        onClick={() => handleOpenPreview('Transkrip', transkripData.id, 'Transkrip Nilai Akademik', transkripData.name)}
                      >
                        <Eye size={14} /> Pratinjau
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Tampilan jika Transkrip BELUM diunggah */
                  <div className="ub-doc-body-unavailable">
                    <div className="ub-unavail-info-box">
                      <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <h4 className="ub-unavail-title">Berkas Belum Diunggah</h4>
                        <p className="ub-unavail-desc">
                          Transkrip nilai resmi belum diunggah oleh admin.
                          Tombol unduh akan aktif otomatis setelah berkas tersedia.
                        </p>
                      </div>
                    </div>

                    <button className="ub-btn-disabled" disabled>
                      <Lock size={14} /> Unduh Transkrip (Belum Tersedia)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal Pratinjau PDF ────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewState.isOpen && (
          <div
            className="ub-modal-overlay"
            onClick={handleClosePreview}
          >
            <motion.div
              className="ub-modal-container"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header Modal */}
              <div className="ub-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color="#C0182A" />
                  <h3 className="ub-modal-title">
                    Pratinjau {previewState.title}
                  </h3>
                </div>
                <button
                  className="ub-modal-close-btn"
                  onClick={handleClosePreview}
                  title="Tutup"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Modal (PDF Iframe) */}
              <div className="ub-modal-body">
                {previewState.blobUrl ? (
                  <iframe
                    src={previewState.blobUrl}
                    title="Pratinjau PDF"
                    className="ub-modal-iframe"
                  />
                ) : (
                  <div className="ub-modal-loading">
                    <span className="ub-loading-spinner" />
                    <span>Memuat dokumen…</span>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="ub-modal-footer">
                <button
                  className="ub-btn-batal"
                  onClick={handleClosePreview}
                >
                  Tutup
                </button>
                <button
                  className="ub-btn-download"
                  onClick={() => handleDownloadDoc(previewState.docType, previewState.uploadId, previewState.fileName)}
                >
                  <Download size={14} /> Unduh PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Alert Toast ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastAlert.show && (
          <div className="ub-toast-overlay">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
              <CustomAlert
                type={toastAlert.type}
                title={toastAlert.title}
                message={toastAlert.message}
                style={{ margin: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default UnduhBerkasKelulusan;
