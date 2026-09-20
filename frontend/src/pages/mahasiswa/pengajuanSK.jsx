import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Info, MessageCircle, User, Phone, GraduationCap, UploadCloud, FileText, AlertTriangle, FileBadge, CheckCircle, Loader, Clock, RefreshCw, AlertCircle, Menu, Eye } from 'lucide-react';
import { useAuth }    from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import api, { getLecturers, getSKTARequest, submitSKTARequest, submitFinalSKTARequest, downloadTemplate, downloadSK } from '../../service/api';
import {
  determineSkStatus,
  getSubmissionMode,
  isMainPageCategory,
  STATUS_SK,
  SKTA_CATEGORY,
  isSkEditable
} from '../../components/common/Skstatushelper';
import CustomAlert from '../../components/common/CustomAlert';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../../components/mahasiswa/pengajuanSK/pengajuanSK.css';

const PreviewModal = ({ code, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPreview = async () => {
      try {
        const res = await api.get(`/api/templates/preview/${code}`, { responseType: 'blob' });
        if (active) {
          const url = URL.createObjectURL(res.data);
          setBlobUrl(url);
        }
      } catch (err) {
        console.error('Preview error:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPreview();
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [code]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fff', width: '90%', maxWidth: '850px', height: '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111827' }}>Preview Dokumen Template</h3>
          <button onClick={onClose} style={{ background: '#E2E8F0', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#CBD5E1'} onMouseLeave={e => e.currentTarget.style.background = '#E2E8F0'}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: 1 }}>✕</span>
          </button>
        </div>
        <div style={{ flex: 1, position: 'relative', background: '#F3F4F6' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Loader size={32} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Memuat preview dokumen...</p>
            </div>
          )}
          {error && !loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertTriangle size={32} color="#B91C1C" />
              <p style={{ fontSize: '13px', color: '#B91C1C', fontWeight: 700, margin: 0 }}>Gagal memuat preview dokumen.</p>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Pastikan koneksi stabil atau coba unduh secara langsung.</p>
            </div>
          )}
          {blobUrl && !loading && (
            <iframe src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Preview PDF Template" />
          )}
        </div>
      </div>
    </div>
  );
};

const TemplateActionButtons = ({ code }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { blob, name } = await downloadTemplate(code);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = name.endsWith('.pdf') ? name : `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[DownloadTemplateButton] error:', err);
      alert('Gagal mengunduh template. Silakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 9999,
            fontSize: 11, fontWeight: 700,
            background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
          onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
        >
          <Eye size={13} /> Preview
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 9999,
            fontSize: 11, fontWeight: 700,
            background: isDownloading ? '#9CA3AF' : '#C0182A',
            color: '#fff', border: 'none', cursor: isDownloading ? 'not-allowed' : 'pointer',
          }}
        >
          {isDownloading ? 'Mengunduh...' : '⬇ Download Template'}
        </button>
      </div>
      {showPreview && <PreviewModal code={code} onClose={() => setShowPreview(false)} />}
    </>
  );
};

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
    <Loader size={32} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
    <p style={{ fontSize: 12, color: '#6B7280' }}>Memuat data...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const SkStatusBanner = ({ status, permohonan }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!permohonan?.id) return;
    setDownloading(true);
    try {
      const blob = await downloadSK(permohonan.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fallbackName = `SKTA_${permohonan?.mahasiswa?.nim || permohonan.id}.pdf`;
      a.download = blob.filename || fallbackName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Gagal unduh SK:', err);
      alert('Gagal mengunduh SK. Silakan coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  const configs = {
    [STATUS_SK.DALAM_PROSES]: {
      bg: '#EFF6FF', border: '#BFDBFE', icon: <Clock size={16} color="#2563EB" />,
      title: 'Pengajuan SK Sedang Diproses',
      desc: 'Permohonan Penerbitan SK Tugas Akhir kamu sedang dalam antrian verifikasi oleh tim akademik. Proses maksimal 3×24 jam kerja. Mohon ditunggu dan pantau status di dashboard.',
      badgeBg: '#DBEAFE', badgeColor: '#1D4ED8', badgeText: 'Dalam Proses',
    },
    [STATUS_SK.BELUM_TERBIT]: {
      bg: '#FFFBEB', border: '#FDE68A', icon: <AlertCircle size={16} color="#D97706" />,
      title: 'Pengajuan SK Memerlukan Perbaikan Dokumen',
      desc: permohonan?.message
        ? `Tim akademik memberikan catatan: "${permohonan.message}". Silakan perbaiki pengajuan kamu melalui formulir di bawah ini dan kirim ulang.`
        : 'Pengajuan SK kamu perlu diperbaiki. Tim akademik telah meninjau dokumenmu dan meminta perbaikan. Silakan perbarui data pengajuan melalui formulir di bawah ini, lalu kirim ulang.',
      badgeBg: '#FEF3C7', badgeColor: '#92400E', badgeText: 'Perlu Perbaikan',
    },
    [STATUS_SK.SUDAH_TERBIT]: {
      bg: '#F0FDF4', border: '#BBF7D0', icon: <CheckCircle size={16} color="#16A34A" />,
      title: 'SK Pembimbing TA Sudah Terbit',
      desc: 'Selamat! SK Pembimbing Tugas Akhir kamu sudah diterbitkan. Kamu dapat mengunduh SK melalui tombol di bawah atau melalui menu dashboard.',
      badgeBg: '#DCFCE7', badgeColor: '#15803D', badgeText: 'Sudah Terbit',
    },
    [STATUS_SK.EXPIRED]: {
      bg: '#F5F3FF', border: '#DDD6FE', icon: <RefreshCw size={16} color="#7C3AED" />,
      title: 'SK Pembimbing TA Sudah Kadaluarsa',
      desc: 'SK Pembimbing Tugas Akhir kamu telah melewati batas masa berlaku. Kamu perlu mengajukan permohonan pembaruan SK melalui formulir di bawah ini. Data pengajuan sebelumnya sudah terisi otomatis, kamu cukup perbarui jika ada perubahan.',
      badgeBg: '#EDE9FE', badgeColor: '#5B21B6', badgeText: 'Kadaluarsa',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 12, padding: '16px 20px', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>{cfg.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{cfg.title}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px',
              borderRadius: 9999, background: cfg.badgeBg, color: cfg.badgeColor,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {cfg.badgeText}
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
            {cfg.desc}
          </p>
          {permohonan && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 11, color: '#6B7280' }}>
              <div><strong>Judul (ID):</strong> {permohonan.judulProposalIndonesia ?? permohonan.proposalTitleId}</div>
              <div style={{ marginTop: 4 }}><strong>Judul (EN):</strong> {permohonan.judulProposalInggris ?? permohonan.proposalTitleEn}</div>
              {permohonan?.expDate && (
                <div style={{ marginTop: 4 }}>
                  <strong>Expired:</strong> {new Date(permohonan.expDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          )}
          {status === STATUS_SK.SUDAH_TERBIT && (
            <button
              style={{
                marginTop: 12, padding: '6px 16px', borderRadius: 9999,
                fontSize: 11, fontWeight: 700, background: downloading ? '#9CA3AF' : '#16A34A',
                color: '#fff', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
              }}
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading ? 'Membuka SK...' : 'Buka / Unduh SK'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const kelompokKeilmuan = [
  { id: 'kk1', researchGroupId: 1, label: 'ELECTRONICS AND TELECOMMUNICATIONS SCIENCE' },
  { id: 'kk2', researchGroupId: 2, label: 'INDUSTRIAL SYSTEMS ENGINEERING' },
  { id: 'kk3', researchGroupId: 3, label: 'MEDIA, DESIGN AND CREATIVE INNOVATION' },
  { id: 'kk4', researchGroupId: 4, label: 'APPLIED ARTIFICIAL INTELLIGENCE' },
  { id: 'kk5', researchGroupId: 5, label: 'CYBER SECURITY, IOT, AND CLOUD SYSTEM' },
  { id: 'kk6', researchGroupId: 6, label: 'DATA SCIENCE AND OPTIMIZATION' },
  { id: 'kk7', researchGroupId: 7, label: 'BIOENGINEERING, FOOD TECHNOLOGY AND ADVANCE MATERIAL' },
  { id: 'kk8', researchGroupId: 8, label: 'SOFTWARE ENGINEERING AND MULTIMEDIA' },
];

const validate = ({ judulIndo, judulInggris, kode1, kode2, actualFile, submissionMode }) => {
  if (!judulIndo || !judulIndo.trim())    return 'Judul Tugas Akhir (Bahasa Indonesia) wajib diisi.';
  if (!judulInggris || !judulInggris.trim()) return 'Judul Tugas Akhir (Bahasa Inggris) wajib diisi.';
  if (!kode1 || !kode1.value)               return 'Dosen Pembimbing 1 wajib dipilih.';
  if (!kode2 || !kode2.value)               return 'Dosen Pembimbing 2 wajib dipilih.';
  if (String(kode1.value) === String(kode2.value)) return 'Dosen Pembimbing 1 dan 2 tidak boleh sama.';
  
  if ((submissionMode === 'create-baru' || submissionMode === 'create-perpanjangan') && !actualFile) {
    return 'Dokumen evidence wajib diunggah.';
  }
  return null;
};

const parseBackendError = (err) => {
  const data = err.response?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const lines = data.errors.map(e => `• ${e.message}`);
    return { title: data.message || 'Periksa kembali formulirmu', message: lines.join('\n') };
  }
  if (data?.message) return { title: 'Gagal mengirim pengajuan', message: data.message };
  return { title: 'Gagal mengirim pengajuan', message: err.message || 'Terjadi kesalahan pada sistem. Silakan coba lagi.' };
};

const PengajuanSK = () => {
  const navigate     = useNavigate();
  const fileInputRef = useRef(null);
  const errorRef     = useRef(null);
  const { user }    = useAuth();
  const { student, isStudentLoading, sktaRequestId, updateSktaRequestId } = useStudent();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  
  const [pageStatus,      setPageStatus]      = useState('loading');
  const [permohonan,      setPermohonan]      = useState(null);
  const [skStatus,        setSkStatus]        = useState(null);
  const [submissionMode,  setSubmissionMode]  = useState('create-baru'); 
  const [lecturerOptions, setLecturerOptions] = useState([]);
  const [loadingDosen,    setLoadingDosen]    = useState(true);
  const [formData, setFormData] = useState({
    judulIndo: '', judulInggris: '',
    kode1: null,  dosen1: '',
    kode2: null,  dosen2: '',
    kelompok: '',
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [actualFile,   setActualFile]   = useState(null);
  const [fileError,    setFileError]    = useState(null);
  const [isDragging,   setIsDragging]   = useState(false);
  
  const [submitError,  setSubmitError]  = useState(null);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) setSidebarOpen(!sidebarOpen);
    else setIsDesktopCollapsed(!isDesktopCollapsed);
  };

  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setLoadingDosen(true);
        const data    = await getLecturers();
        const options = data.map((d) => ({
          value: d.id,
          label: `${d.kodeDosen ?? d.lecturerCode ?? d.kode ?? ''} — ${d.user?.name ?? d.name ?? d.nama ?? ''}`,
          nama:  d.user?.name ?? d.name ?? d.nama ?? '',
          researchGroupId: d.researchGroupId ?? null,
        }));
        setLecturerOptions(options);
      } catch (err) {
        console.error('Gagal fetch dosen:', err);
      } finally {
        setLoadingDosen(false);
      }
    };
    fetchDosen();
  }, []);

  useEffect(() => {
    const checkSKTAStatus = async () => {
      const mahasiswaId = student?.mahasiswaId || student?.studentId;
      if (!mahasiswaId) { navigate('/lengkapi-data', { replace: true }); return; }

      try {
        const latest = await getSKTARequest(mahasiswaId);

        if (!latest) {
          setPermohonan(null);
          setSubmissionMode('create-baru');
          setSkStatus(null);
          setPageStatus('form');
          return;
        }

        setPermohonan(latest);
        updateSktaRequestId(latest.id);

        const status = determineSkStatus(latest);
        const mode   = getSubmissionMode(latest);

        setSkStatus(status);
        setSubmissionMode(mode);

        if (mode === 'create-perpanjangan' || mode === 'patch-revisi') {
          const matchedKode1 = lecturerOptions.find(
            opt => String(opt.value) === String(latest.dosenPembimbing1Id)
          );
          const matchedKode2 = lecturerOptions.find(
            opt => String(opt.value) === String(latest.dosenPembimbing2Id)
          );
          const matchedKK = matchedKode1?.researchGroupId != null
            ? kelompokKeilmuan.find(
                kk => String(kk.researchGroupId) === String(matchedKode1.researchGroupId)
              )
            : null;
          setFormData(prev => ({
            ...prev,
            judulIndo:    latest.judulProposalIndonesia ?? latest.proposalTitleId ?? '',
            judulInggris: latest.judulProposalInggris ?? latest.proposalTitleEn ?? '',
            kode1:    matchedKode1 ?? null,
            dosen1:   matchedKode1?.nama ?? '',
            kode2:    matchedKode2 ?? null,
            dosen2:   matchedKode2?.nama ?? '',
            kelompok: matchedKK?.label ?? '',
          }));
          setPageStatus('form');
        } else {
          setPageStatus('status_only');
        }

      } catch (err) {
        console.error('Gagal cek status SKTA:', err);
        setSubmitError({ title: 'Gagal memuat data', message: 'Terjadi kesalahan saat memuat status pengajuan SK kamu. Silakan refresh halaman.' });
        setPageStatus('form');
      }
    };

    if (!loadingDosen && !isStudentLoading) checkSKTAStatus();
  }, [loadingDosen, isStudentLoading, student, navigate, lecturerOptions]);

  const namaDisplay  = student?.namaLengkap      || user?.username || '';
  const nimDisplay   = student?.nim              || '';
  const noHpDisplay  = user?.phone               || '';
  const prodiDisplay = student?.studyProgramNama || '';

  // STATE KONDISIONAL BERDASARKAN DEADLINE
  const isExpired      = submissionMode === 'create-perpanjangan';
  const isBelumTerbit  = submissionMode === 'patch-revisi';
  const isEditableForm = isSkEditable(skStatus, permohonan);
  const isReadOnlyForm = isBelumTerbit && !isEditableForm;

  const dynamicTitle = `${isExpired ? 'Perpanjangan SK' : isBelumTerbit ? 'Perbaikan Revisi SK' : 'Permohonan'} Penerbitan SK Pembimbing Tugas Akhir`;

  const handleDosenChange = useCallback((field, val) => {
    if (isReadOnlyForm) return;
    const namaField = field === 'kode1' ? 'dosen1' : 'dosen2';
    setFormData(prev => {
      const updated = { ...prev, [field]: val, [namaField]: val?.nama || '' };
      if (field === 'kode1') {
        if (val?.researchGroupId != null) {
          const matched = kelompokKeilmuan.find(
            kk => String(kk.researchGroupId) === String(val.researchGroupId)
          );
          updated.kelompok = matched?.label || '';
        } else {
          updated.kelompok = '';
        }
      }
      return updated;
    });
    setSubmitError(null);
  }, [isReadOnlyForm]);

  const processFile = (file) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Format file tidak didukung. Gunakan PDF, PNG, atau JPG');
      setSelectedFile(null); setActualFile(null);
      return;
    }
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(`Ukuran file melebihi batas 3MB. Ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      setSelectedFile(null); setActualFile(null);
    } else {
      setFileError(null);
      const safeName = (student?.namaLengkap || user?.username || "mahasiswa").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const safeNim = student?.nim || "0000000000";
      const extension = file.name.split('.').pop();
      const formattedFileName = `${safeNim}-${safeName}-evidence-pembimbing.${extension}`;
      const renamedFile = new File([file], formattedFileName, { type: file.type });
      
      setActualFile(renamedFile);
      setSelectedFile({
        name: renamedFile.name,
        size: (renamedFile.size / (1024 * 1024)).toFixed(1),
        type: renamedFile.type.split('/')[1]?.toUpperCase() || 'FILE',
      });
    }
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = ""; 
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (isReadOnlyForm) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (isReadOnlyForm) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (submissionMode === 'blocked' || isReadOnlyForm) return;

    const validationError = validate({
      judulIndo:    formData.judulIndo,
      judulInggris: formData.judulInggris,
      kode1:        formData.kode1,
      kode2:        formData.kode2,
      actualFile,
      submissionMode,
    });
    
    if (validationError) {
      setSubmitError({ title: 'Periksa kembali formulirmu', message: validationError });
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    const mahasiswaId = student?.mahasiswaId || student?.studentId;
    if (!mahasiswaId) {
      setSubmitError({ title: 'Data tidak ditemukan', message: 'Data mahasiswa tidak ditemukan. Silakan lengkapi profil terlebih dahulu.' });
      return;
    }

    setPageStatus('submitting');

    try {
      if (submissionMode === 'patch-revisi') {
        const activeRequestId = sktaRequestId ?? permohonan?.id;

        const finalPayload = new FormData();
        finalPayload.append('id', activeRequestId);
        finalPayload.append('mahasiswaId', mahasiswaId);
        finalPayload.append('category', permohonan?.category || SKTA_CATEGORY.PERMOHONAN_BARU);
        finalPayload.append('judulProposalIndonesia', formData.judulIndo.trim());
        finalPayload.append('judulProposalInggris', formData.judulInggris.trim());
        if (formData.kode1?.value) finalPayload.append('dosenPembimbing1Id', formData.kode1.value);
        if (formData.kode2?.value) finalPayload.append('dosenPembimbing2Id', formData.kode2.value);
        if (actualFile) finalPayload.append('evidence', actualFile);

        await submitFinalSKTARequest(finalPayload);
        setPageStatus('revision_sent');

      } else {
        const categoryString = submissionMode === 'create-perpanjangan'
          ? SKTA_CATEGORY.PERPANJANGAN_SK
          : SKTA_CATEGORY.PERMOHONAN_BARU;

        const draftResult = await submitSKTARequest({
          proposalTitleId:    formData.judulIndo.trim(),
          proposalTitleEn:    formData.judulInggris.trim(),
          studentId:          mahasiswaId,
          dosenPembimbing1Id: formData.kode1?.value,
          dosenPembimbing2Id: formData.kode2?.value,
          category:           categoryString,
        });
        
        const newSktaRequestId = draftResult?.data?.id || draftResult?.id;
        if (!newSktaRequestId) throw new Error("Gagal mendapatkan ID Permohonan dari server.");

        const finalPayload = new FormData();
        finalPayload.append('id', newSktaRequestId);
        finalPayload.append('mahasiswaId', mahasiswaId);
        finalPayload.append('category', categoryString);
        finalPayload.append('judulProposalIndonesia', formData.judulIndo.trim());
        finalPayload.append('judulProposalInggris', formData.judulInggris.trim());
        if (formData.kode1?.value) finalPayload.append('dosenPembimbing1Id', formData.kode1.value);
        if (formData.kode2?.value) finalPayload.append('dosenPembimbing2Id', formData.kode2.value);
        if (actualFile) finalPayload.append('evidence', actualFile);

        await submitFinalSKTARequest(finalPayload);
        
        updateSktaRequestId(newSktaRequestId);
        setPageStatus('success');
      }
    } catch (err) {
      setSubmitError(parseBackendError(err));
      setPageStatus('form');
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      paddingLeft: '32px',
      backgroundColor: state.isDisabled ? '#F3F4F6' : '#F9FAFB',
      border: `1.5px solid ${state.isFocused ? '#C0182A' : '#E5E7EB'}`,
      borderRadius: '6px',
      fontSize: '12.5px',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(192,24,42,0.1)' : 'none',
      '&:hover': { borderColor: state.isDisabled ? '#E5E7EB' : '#C0182A' },
      cursor: state.isDisabled ? 'not-allowed' : 'default'
    }),
    valueContainer: (base) => ({ ...base, padding: '0 6px' }),
    option: (base, state) => ({
      ...base,
      fontSize: '11.5px',
      backgroundColor: state.isSelected ? '#C0182A' : state.isFocused ? '#FEF2F2' : '#fff',
      color: state.isSelected ? '#fff' : '#374151',
    }),
  };

  const renderContent = () => {
    if (pageStatus === 'loading') return <PageLoader />;

    if (pageStatus === 'revision_sent') {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#DBEAFE', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Clock size={32} color="#2563EB" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            Revisi Pengajuan SK Berhasil Dikirim!
          </h2>
          <div style={{
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>
                  Revisi dokumen sudah kami terima
                </p>
                <p style={{ fontSize: 11.5, color: '#3B82F6', lineHeight: 1.6, margin: 0 }}>
                  Tim akademik akan memverifikasi kembali pengajuan SK Pembimbing Tugas Akhir kamu.
                  Proses verifikasi membutuhkan waktu maksimal <strong>3×24 jam kerja</strong>.
                  Pantau status terbaru melalui dashboard.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            style={{
              padding: '10px 24px', borderRadius: 9999, fontSize: 12,
              fontWeight: 700, background: '#2563EB', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    if (pageStatus === 'success') {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#D1FAE5', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            {isExpired ? 'Perpanjangan SK Berhasil Dikirim!' : 'Pengajuan SK Berhasil Dikirim!'}
          </h2>
          <p style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
            {isExpired
              ? 'Permohonan perpanjangan SK Tugas Akhir kamu sudah kami terima sebagai pengajuan baru. Proses verifikasi membutuhkan waktu maksimal 3×24 jam kerja.'
              : 'Permohonan Penerbitan SK Tugas Akhir kamu sudah kami terima. Proses verifikasi membutuhkan waktu maksimal 3×24 jam kerja. Pantau status pengajuan di dashboard.'}
          </p>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            style={{
              padding: '10px 24px', borderRadius: 9999, fontSize: 12,
              fontWeight: 700, background: '#C0182A', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    if (pageStatus === 'status_only') {
      const categoryMismatch = !isMainPageCategory(permohonan);
      return (
        <div style={{ padding: '24px 16px', maxWidth: 600, margin: '0 auto' }}>
          {categoryMismatch ? (
            <div style={{
              background: '#F9FAFB', border: '1px solid #E5E7EB',
              borderRadius: 10, padding: '16px 20px', marginBottom: 24,
            }}>
              <p style={{ fontSize: 11.5, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
                Kamu memiliki pengajuan perubahan data SK (<strong>{permohonan?.category}</strong>) yang sedang berjalan.
                Silakan pantau status pengajuan tersebut melalui halaman Perubahan SK, bukan di halaman ini.
              </p>
            </div>
          ) : (
            <SkStatusBanner status={skStatus} permohonan={permohonan} />
          )}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/mahasiswa/dashboard')}
              style={{
                padding: '8px 24px', borderRadius: 9999, fontSize: 11.5,
                fontWeight: 700, background: '#C0182A', color: '#fff',
                border: 'none', cursor: 'pointer',
              }}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="sk-content-wrapper" style={{ padding: '0 8px' }}>

        {isExpired && <SkStatusBanner status={STATUS_SK.EXPIRED} permohonan={permohonan} />}
        {isBelumTerbit && <SkStatusBanner status={STATUS_SK.BELUM_TERBIT} permohonan={permohonan} />}

        {isBelumTerbit && permohonan?.isEdit && (
          <div style={{
            background: isReadOnlyForm ? '#FEF2F2' : '#FFF7ED', 
            border: `1px solid ${isReadOnlyForm ? '#FECACA' : '#FED7AA'}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11.5, color: isReadOnlyForm ? '#B91C1C' : '#92400E',
          }}>
            <span style={{ fontWeight: 700 }}>
              {isReadOnlyForm ? '❌ Masa perbaikan dokumen telah habis:' : '⏰ Batas perbaikan dokumen:'}
            </span>
            <span>
              {new Date(permohonan.isEdit).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* SECTION: Info Box */}
        <div className="info-box-red" style={{ padding: '16px 20px', borderRadius: '10px', marginBottom: '32px' }}>
          <div className="info-content" style={{ display: 'flex', gap: '12px' }}>
            <div className="info-icon-circle" style={{ width: '32px', height: '32px', padding: '6px' }}>
              <Info size={20} />
            </div>
            <div className="info-text">
              <h4 style={{ fontSize: '13.5px', color: '#B91C1C', marginBottom: '10px', fontWeight: 800 }}>
                {isExpired
                  ? 'Perpanjangan SK Tugas Akhir'
                  : isBelumTerbit
                    ? 'Perbaikan Dokumen SK Tugas Akhir'
                    : 'Permohonan Penerbitan SK Tugas Akhir'}
              </h4>
              <p style={{ fontSize: '11px', marginBottom: '6px' }}><strong>Formulir ini ditujukan bagi mahasiswa yang belum memiliki SK TA pada menu TA/PA iGracias</strong></p>
              <p style={{ fontSize: '11px', marginBottom: '6px' }}><strong>Harap Baca Secara Teliti</strong></p>
              <p style={{ fontSize: '11px', marginBottom: '6px' }}>Formulir ini diajukan setelah mahasiswa mengajukan pembimbing di igracias dan sudah di approve oleh ketua KK.</p>
              <p style={{ fontSize: '11px', marginBottom: '6px' }}>
                Apabila belum diapprove, silahkan dapat meminta Approval Dosen Pembimbing kepada ketua KK. Pemilihan KK berdasarkan Dosen Pembimbing I, cek KK dosen di:{' '}
                <a href="http://tel-u.ac.id/dosentatup" target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'underline' }}>
                  tel-u.ac.id/dosentatup
                </a>
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '16px', marginTop: '8px', marginBottom: '8px', fontSize: '11px' }}>
                <li style={{ marginBottom: '6px' }}>KK Electronics and Telecommunications Science — Bu Solichah Larasati: 085726234838</li>
                <li style={{ marginBottom: '6px' }}>KK Industrial Systems Engineering — Pak Alza Yudha: 085200330027</li>
                <li style={{ marginBottom: '6px' }}>KK Applied Artificial Intelligence — Bu Paradise: 082243368605</li>
                <li style={{ marginBottom: '6px' }}>KK Media, Design and Creative Innovation — Bu Agatha: 081331379241</li>
                <li style={{ marginBottom: '6px' }}>KK Cyber Security, IOT, and Cloud System — Pak Eko Fajar Cahyadi: 085132323346</li>
                <li style={{ marginBottom: '6px' }}>KK Data Science and Optimization — Pak Andi Prademon Yunus: 08114091048</li>
                <li style={{ marginBottom: '6px' }}>KK Bioengineering, Food Technology and Advance Material — Bu Nur Afifah Zen: 081227684018</li>
                <li style={{ marginBottom: '6px' }}>KK Information System, Digital Business & Data Driven Solution — Bu Rona Nisa Sofia Amriza: 085878447414</li>
                <li>KK Software Engineering and Multimedia — Pak Arif Amrulloh: 08567424313</li>
              </ul>
              <p style={{ fontSize: '11px' }}>Pengajuan penerbitan SK diproses dalam waktu maksimal 3×24 jam sesuai antrian</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <div className="contact-badge" style={{ fontSize: '10.5px', padding: '6px 12px' }} onClick={() => window.open('https://wa.me/6285117001281', '_blank')}>
              <MessageCircle size={12} /> Contact Person : Helpdesk Layanan Sidang-Yudisium TUP
            </div>
          </div>
        </div>

        {submitError && (
          <div ref={errorRef}>
            <CustomAlert
              type="error"
              title={submitError.title}
              message={<span style={{ whiteSpace: 'pre-line' }}>{submitError.message}</span>}
              style={{ margin: '0 0 20px 0' }}
            />
          </div>
        )}

        {/* SECTION 1: Identitas */}
        <section className="form-section" style={{ marginBottom: '40px', padding: '20px', borderRadius: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>Identitas & Program Studi</h2>
          <div className="form-grid" style={{ gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Nama</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} />
                <input type="text" value={namaDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>NIM (Nomor Induk Mahasiswa) *</label>
              <div className="input-with-icon">
                <input type="text" value={nimDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px', height: '40px' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Nomor HP / WhatsApp Aktif *</label>
              <div className="input-with-icon">
                <Phone className="field-icon" size={16} />
                <input type="text" value={noHpDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Program Studi</label>
              <div className="input-with-icon">
                <GraduationCap className="field-icon" size={16} />
                <input type="text" value={prodiDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px' }} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Informasi TA */}
        <section className="form-section" style={{ marginBottom: '40px', padding: '20px', borderRadius: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>Informasi Tugas Akhir</h2>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Judul Tugas Akhir (Bahasa Indonesia) *</label>
            <div className="input-with-icon">
              <textarea
                placeholder="Masukkan judul tugas akhir dalam Bahasa Indonesia"
                value={formData.judulIndo}
                onChange={(e) => { setFormData(prev => ({ ...prev, judulIndo: e.target.value })); setSubmitError(null); }}
                readOnly={isReadOnlyForm}
                style={{ fontSize: '12.5px', padding: '10px 12px', minHeight: '70px', backgroundColor: isReadOnlyForm ? '#F3F4F6' : '#fff', cursor: isReadOnlyForm ? 'not-allowed' : 'text' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Judul Tugas Akhir (Bahasa Inggris) *</label>
            <div className="input-with-icon">
              <textarea
                placeholder="Enter your thesis/final project title in English"
                value={formData.judulInggris}
                onChange={(e) => { setFormData(prev => ({ ...prev, judulInggris: e.target.value })); setSubmitError(null); }}
                readOnly={isReadOnlyForm}
                style={{ fontSize: '12.5px', padding: '10px 12px', minHeight: '70px', backgroundColor: isReadOnlyForm ? '#F3F4F6' : '#fff', cursor: isReadOnlyForm ? 'not-allowed' : 'text' }}
              />
            </div>
          </div>

          <div className="form-grid" style={{ gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Nama Dosen Pembimbing 1 *</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} />
                <input type="text" placeholder="Auto-terisi setelah pilih kode dosen" value={formData.dosen1} readOnly style={{ backgroundColor: '#F3F4F6', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Kode Dosen Pembimbing 1 *</label>
              <div className="input-with-icon block-select">
                <FileBadge className="field-icon" size={16} style={{ zIndex: 10 }} />
                <Select
                  placeholder={loadingDosen ? "Memuat data dosen..." : "Pilih Kode Dosen 1"}
                  options={lecturerOptions} styles={customSelectStyles}
                  value={formData.kode1} onChange={(val) => handleDosenChange('kode1', val)}
                  isLoading={loadingDosen} isDisabled={loadingDosen || isReadOnlyForm}
                  isClearable noOptionsMessage={() => "Dosen tidak ditemukan"} className="w-full"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Nama Dosen Pembimbing 2 *</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} />
                <input type="text" placeholder="Auto-terisi setelah pilih kode dosen" value={formData.dosen2} readOnly style={{ backgroundColor: '#F3F4F6', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Kode Dosen Pembimbing 2 *</label>
              <div className="input-with-icon block-select">
                <FileBadge className="field-icon" size={16} style={{ zIndex: 10 }} />
                <Select
                  placeholder={loadingDosen ? "Memuat data dosen..." : "Pilih Kode Dosen 2"}
                  options={lecturerOptions} styles={customSelectStyles}
                  value={formData.kode2} onChange={(val) => handleDosenChange('kode2', val)}
                  isLoading={loadingDosen} isDisabled={loadingDosen || isReadOnlyForm}
                  isClearable noOptionsMessage={() => "Dosen tidak ditemukan"} className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Kelompok Keilmuan */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <label style={{ margin: 0, fontSize: '11.5px' }}>Kelompok Keilmuan</label>
              <span style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>Otomatis diambil dari KK Dosen Pembimbing 1</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
              {kelompokKeilmuan.map((item) => {
                const isSelected = formData.kelompok === item.label;
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6,
                    border: `1px solid ${isSelected ? '#C0182A' : '#E5E7EB'}`, background: isSelected ? '#FEF2F2' : '#F9FAFB',
                    cursor: 'default', opacity: isReadOnlyForm && !isSelected ? 0.6 : 1
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${isSelected ? '#C0182A' : '#D1D5DB'}`,
                      background: isSelected ? '#C0182A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#B91C1C' : '#6B7280', lineHeight: 1.3 }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: Upload Dokumen */}
        <section className="form-section" style={{ padding: '20px', borderRadius: '12px' }}>
          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>
            Dokumen Evidence Sudah Di Approve Pengajuan Pembimbing Oleh Ketua KK Di iGracias
          </h2>

          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5 }}>Berkas Lampiran Bukti Dosbing Sudah Diacc KK :</span>
             <TemplateActionButtons code="permohonan-skta-pengajuan-skta-evidence-approve-dospem-kk" />
          </div>

          {(isBelumTerbit || isExpired) && (
            <p style={{ fontSize: 10.5, color: isBelumTerbit ? '#D97706' : '#7C3AED', marginBottom: 14, fontStyle: 'italic', fontWeight: 600 }}>
              * Dokumen evidence bersifat opsional untuk {isExpired ? 'perpanjangan SK' : 'revisi'}. Kosongkan jika evidence lama masih berlaku.
            </p>
          )}

          <div className="form-grid" style={{ gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>Unggah Dokumen Prasyarat {(!isBelumTerbit) ? '*' : ''}</label>
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''} ${isReadOnlyForm ? 'disabled' : ''}`} 
                onClick={() => !isReadOnlyForm && fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ padding: '24px 16px', minHeight: '120px', opacity: isReadOnlyForm ? 0.5 : 1, cursor: isReadOnlyForm ? 'not-allowed' : 'pointer' }}
              >
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf, .png, .jpg, .jpeg" />
                <div className="upload-icon-circle" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                  <UploadCloud size={32} color={isDragging ? "#c0182a" : "#6B7280"} />
                </div>
                <div className="upload-text">
                  <p style={{ fontSize: '12px' }}><strong>Pilih File</strong> atau Tarik dan Lepaskan di sini</p>
                  <div className="file-type-badges" style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '9px', padding: '2px 6px' }}>PDF / PNG / JPG</span>
                    <span style={{ fontSize: '9px', padding: '2px 6px' }}>MAX 3MB</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px' }}>File Terpilih</label>
              <div className="file-status-list">
                {selectedFile && (
                  <div className="status-card success" style={{ padding: '12px', borderRadius: '8px' }}>
                    <div className="status-icon-wrap" style={{ background: '#10B981', width: '32px', height: '32px' }}><FileText size={16} /></div>
                    <div className="status-info">
                      <div className="status-filename" style={{ fontSize: '12px' }}>{selectedFile.name}{' '}<span className="label-siap" style={{ fontSize: '9px', padding: '2px 6px' }}>Siap</span></div>
                      <div className="status-meta" style={{ fontSize: '10.5px' }}>{selectedFile.size} MB • {selectedFile.type}</div>
                    </div>
                  </div>
                )}
                {fileError && (
                  <div className="status-card error" style={{ padding: '12px', borderRadius: '8px' }}>
                    <div className="status-icon-wrap" style={{ background: '#EF4444', width: '32px', height: '32px' }}><AlertTriangle size={16} /></div>
                    <div className="status-info">
                      <div className="error-title" style={{ fontSize: '12px' }}>File Tidak Valid</div>
                      <div className="error-desc" style={{ fontSize: '10.5px' }}>{fileError}</div>
                    </div>
                  </div>
                )}
                {!selectedFile && !fileError && (
                  <div className="empty-file-state" style={{ padding: '16px', border: '1px dashed #E5E7EB', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '11px' }}>
                    {isExpired ? 'Wajib upload dokumen untuk perpanjangan' : isBelumTerbit ? 'Opsional kosongkan jika evidence lama masih berlaku' : 'Belum ada file yang dipilih'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E9EDF5', paddingBottom: '32px' }}>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={pageStatus === 'submitting' || isReadOnlyForm}
            style={{
              ...((pageStatus === 'submitting' || isReadOnlyForm) ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
              padding: '12px 32px', fontSize: '13px', borderRadius: '8px', background: isReadOnlyForm ? '#6B7280' : '#C0182A', color: '#fff', fontWeight: 700, border: 'none'
            }}
          >
            {pageStatus === 'submitting' ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Mengirim...</>
            ) : isReadOnlyForm ? (
              'Batas Waktu Habis'
            ) : isExpired ? (
              'Kirim Perpanjangan SK'
            ) : isBelumTerbit ? (
              'Kirim Revisi Dokumen'
            ) : (
              'Simpan Pengajuan'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex bg-[#F4F6FB] min-h-screen ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <style>{`
        .topbar-toggle { display: flex !important; cursor: pointer; }
        @media (min-width: 992px) {
          .desktop-collapsed #sidebar { transform: translateX(-100%) !important; }
          .desktop-collapsed #main-content { margin-left: 0 !important; }
        }
      `}</style>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div id="main-content" className="flex-1 flex flex-col" style={{ transition: 'margin-left 0.22s ease' }}>
        <header className="topbar">
          <button className="topbar-toggle" onClick={handleToggleSidebar}>
            <Menu size={20} color="#fff" />
          </button>
          <div className="topbar-brand text-white" style={{ fontSize: '15px' }}>{dynamicTitle}</div>
        </header>
        <main className="page-body px-4 py-6 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PengajuanSK;