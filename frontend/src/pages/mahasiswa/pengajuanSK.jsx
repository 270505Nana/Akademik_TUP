import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Info, MessageCircle, User, Phone, GraduationCap, UploadCloud, FileText, Download, AlertTriangle, FileBadge, CheckCircle, Loader, Clock, RefreshCw, AlertCircle, Menu, Eye } from 'lucide-react';
import { useAuth }    from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import api, { getLecturers, getSKTARequest, getAllSktaRequests, submitSKTARequest, submitFinalSKTARequest, downloadTemplate, downloadSK } from '../../service/api';
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
import '../../style/css/mahasiswa/pengajuansk.css';

const OngoingPembaruanBanner = ({ pembaruan, navigate }) => {
  if (!pembaruan) return null;
  return (
    <div className="sk-banner-ongoing">
      <Info size={20} color="#0284C7" className="sk-banner-icon" />
      <div className="sk-banner-content">
        <div className="sk-banner-header">
          <h4 className="sk-banner-title">
            Pengajuan Pembaruan SK Sedang Berjalan
          </h4>
          <span className="sk-banner-badge">
            {determineSkStatus(pembaruan).replace('-', ' ')}
          </span>
        </div>
        <p className="sk-banner-desc">
          Kamu memiliki pengajuan <strong>{pembaruan.category}</strong> yang sedang aktif. 
          Silakan pantau atau lanjutkan permohonan tersebut melalui menu <strong>Pembaruan SK Tugas Akhir</strong>.
        </p>
        <button
          onClick={() => navigate('/mahasiswa/pembaruan-sk')}
          className="sk-btn-ongoing"
        >
          Cek Pembaruan SK
        </button>
      </div>
    </div>
  );
};

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
    <div className="sk-modal-overlay">
      <div className="sk-modal-container">
        <div className="sk-modal-header">
          <h3 className="sk-modal-title">Preview Dokumen Template</h3>
          <button onClick={onClose} className="sk-modal-close">
            <span>✕</span>
          </button>
        </div>
        <div className="sk-modal-body">
          {loading && (
            <div className="sk-modal-state">
              <Loader size={32} color="#C0182A" className="sk-spinner" />
              <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Memuat preview dokumen...</p>
            </div>
          )}
          {error && !loading && (
            <div className="sk-modal-state error">
              <AlertTriangle size={32} color="#B91C1C" />
              <p>Gagal memuat preview dokumen.</p>
              <span>Pastikan koneksi stabil atau coba unduh secara langsung.</span>
            </div>
          )}
          {blobUrl && !loading && (
            <iframe src={blobUrl} className="sk-modal-iframe" title="Preview PDF Template" />
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
      <div className="sk-template-actions">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="sk-btn-preview"
        >
          <Eye size={13} /> Preview
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="sk-btn-download-template"
        >
          {isDownloading ? 'Mengunduh...' : '⬇ Download Template'}
        </button>
      </div>
      {showPreview && <PreviewModal code={code} onClose={() => setShowPreview(false)} />}
    </>
  );
};

const PageLoader = () => (
  <div className="sk-page-loader">
    <Loader size={32} color="#C0182A" className="sk-spinner" />
    <p>Memuat data...</p>
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

  const isPerpanjangan = permohonan?.category === SKTA_CATEGORY.PERPANJANGAN_SK || permohonan?.category === 'Perpanjangan SK';

  const configs = {
    [STATUS_SK.DALAM_PROSES]: {
      styleClass: 'proses', icon: <Clock size={16} color="#2563EB" />,
      title: isPerpanjangan ? 'Perpanjangan SK Sedang Diproses' : 'Pengajuan SK Sedang Diproses',
      desc: isPerpanjangan 
        ? 'Permohonan perpanjangan SK Tugas Akhir kamu sudah terkirim dan sedang dalam antrian verifikasi admin. Proses maksimal 3×24 jam kerja.'
        : 'Permohonan Penerbitan SK Tugas Akhir kamu sedang dalam antrian verifikasi oleh tim akademik. Proses maksimal 3×24 jam kerja. Mohon ditunggu dan pantau status di dashboard.',
      badgeText: 'Dalam Proses',
    },
    [STATUS_SK.BELUM_TERBIT]: {
      styleClass: 'revisi', icon: <AlertCircle size={16} color="#D97706" />,
      title: 'Pengajuan SK Memerlukan Perbaikan Dokumen',
      desc: permohonan?.message
        ? `Tim akademik memberikan catatan: "${permohonan.message}". Silakan perbaiki pengajuan kamu melalui formulir di bawah ini dan kirim ulang.`
        : 'Pengajuan SK kamu perlu diperbaiki. Tim akademik telah meninjau dokumenmu dan meminta perbaikan. Silakan perbarui data pengajuan melalui formulir di bawah ini, lalu kirim ulang.',
      badgeText: 'Perlu Perbaikan',
    },
    [STATUS_SK.SUDAH_TERBIT]: {
      styleClass: 'terbit', icon: <CheckCircle size={16} color="#16A34A" />,
      title: 'SK Pembimbing TA Sudah Terbit',
      desc: 'Selamat! SK Pembimbing Tugas Akhir kamu sudah diterbitkan. Kamu dapat mengunduh SK melalui tombol di bawah atau melalui menu dashboard.',
      badgeText: 'Sudah Terbit',
    },
    [STATUS_SK.EXPIRED]: {
      styleClass: 'expired', icon: <RefreshCw size={16} color="#7C3AED" />,
      title: 'SK Pembimbing TA Sudah Kadaluarsa',
      desc: 'SK Pembimbing Tugas Akhir kamu telah melewati batas masa berlaku. Kamu perlu mengajukan permohonan perpanjangan SK melalui formulir di bawah ini. Data pengajuan telah di-lock untuk mencegah perubahan.',
      badgeText: 'Kadaluarsa',
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className={`sk-status-banner ${cfg.styleClass}`}>
      <div className="sk-status-banner-inner">
        <div className="sk-banner-icon">{cfg.icon}</div>
        <div className="sk-banner-content">
          <div className="sk-status-header">
            <span className="sk-status-title">{cfg.title}</span>
            <span className="sk-status-badge">{cfg.badgeText}</span>
          </div>
          <p className="sk-status-desc">{cfg.desc}</p>
          {permohonan && (
            <div className="sk-status-meta">
              <div><strong>Judul (ID):</strong> {permohonan.judulProposalIndonesia ?? permohonan.proposalTitleId}</div>
              <div className="sk-status-meta-row"><strong>Judul (EN):</strong> {permohonan.judulProposalInggris ?? permohonan.proposalTitleEn}</div>
              {permohonan?.expDate && (
                <div className="sk-status-meta-row">
                  <strong>Expired:</strong> {new Date(permohonan.expDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          )}
          {status === STATUS_SK.SUDAH_TERBIT && (
            <button
              className="sk-btn-download-sk"
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
  
  if (submissionMode === 'create-baru' && !actualFile) {
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
  const [ongoingPembaruan, setOngoingPembaruan] = useState(null); 
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
        const latestSk = await getSKTARequest(mahasiswaId);
        const allReq = await getAllSktaRequests({ mahasiswaId, limit: 100 });
        
        if (!latestSk && (!allReq || allReq.length === 0)) {
          setPermohonan(null);
          setSubmissionMode('create-baru');
          setSkStatus(null);
          setPageStatus('form');
          return;
        }

        const sortedReq = (allReq || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const activePembaruan = sortedReq.find(req => 
          !isMainPageCategory(req) && 
          [STATUS_SK.DRAFT, STATUS_SK.DALAM_PROSES, STATUS_SK.BELUM_TERBIT].includes(determineSkStatus(req))
        );

        setOngoingPembaruan(activePembaruan);

        let displaySk = latestSk || sortedReq[0];

        if (displaySk && activePembaruan && displaySk.id === activePembaruan.id) {
          const latestPublishedSk = sortedReq.find(req => determineSkStatus(req) === STATUS_SK.SUDAH_TERBIT);
          if (latestPublishedSk) {
             displaySk = latestPublishedSk;
          }
        }

        setPermohonan(displaySk);
        updateSktaRequestId(displaySk?.id);

        const status = determineSkStatus(displaySk);
        const mode   = getSubmissionMode(displaySk);

        setSkStatus(status);
        setSubmissionMode(mode);

        if (mode === 'create-perpanjangan' || mode === 'patch-revisi') {
          const d1 = displaySk.dosenPembimbing1;
          const d2 = displaySk.dosenPembimbing2;

          let matchedKode1 = null;
          if (d1) {
            matchedKode1 = {
              value: String(d1.id), label: `${d1.kodeDosen || ''} — ${d1.name || ''}`,
              nama: d1.name || '', researchGroupId: d1.researchGroupId || null,
            };
          } else {
            matchedKode1 = lecturerOptions.find(opt => String(opt.value) === String(displaySk.dosenPembimbing1Id));
          }

          let matchedKode2 = null;
          if (d2) {
            matchedKode2 = {
              value: String(d2.id), label: `${d2.kodeDosen || ''} — ${d2.name || ''}`,
              nama: d2.name || '', researchGroupId: d2.researchGroupId || null,
            };
          } else {
            matchedKode2 = lecturerOptions.find(opt => String(opt.value) === String(displaySk.dosenPembimbing2Id));
          }

          const matchedKK = displaySk.researchGroup 
            ? displaySk.researchGroup.name.toUpperCase() 
            : (matchedKode1?.researchGroupId != null
              ? kelompokKeilmuan.find(kk => String(kk.researchGroupId) === String(matchedKode1.researchGroupId))?.label
              : '');

          setFormData(prev => ({
            ...prev,
            judulIndo: displaySk.judulProposalIndonesia ?? displaySk.proposalTitleId ?? '',
            judulInggris: displaySk.judulProposalInggris ?? displaySk.proposalTitleEn ?? '',
            kode1: matchedKode1 ?? null,
            dosen1: matchedKode1?.nama ?? '',
            kode2: matchedKode2 ?? null,
            dosen2: matchedKode2?.nama ?? '',
            kelompok: matchedKK || '',
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
  }, [loadingDosen, isStudentLoading, student, navigate, lecturerOptions, updateSktaRequestId]);

  const namaDisplay  = student?.namaLengkap      || user?.username || '';
  const nimDisplay   = student?.nim              || '';
  const noHpDisplay  = user?.phone               || '';
  const prodiDisplay = student?.studyProgramNama || '';

  const isExpired      = submissionMode === 'create-perpanjangan';
  const isBelumTerbit  = submissionMode === 'patch-revisi';
  const isEditableForm = isSkEditable(skStatus, permohonan);
  const isReadOnlyForm = isBelumTerbit && !isEditableForm;
  
  const isPerpanjanganRequest = permohonan?.category === SKTA_CATEGORY.PERPANJANGAN_SK || permohonan?.category === 'Perpanjangan SK';
  const isLockedFields = isExpired || isReadOnlyForm || (isBelumTerbit && isPerpanjanganRequest);

  let dynamicTitle = 'Permohonan Penerbitan SK Pembimbing Tugas Akhir';
  if (isExpired) dynamicTitle = 'Perpanjangan SK Pembimbing Tugas Akhir';
  else if (isBelumTerbit) dynamicTitle = 'Perbaikan Revisi SK Pembimbing Tugas Akhir';
  else if (isPerpanjanganRequest) dynamicTitle = 'Perpanjangan SK Pembimbing Tugas Akhir';

  const handleDosenChange = useCallback((field, val) => {
    if (isLockedFields) return; 
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
  }, [isLockedFields]);

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
      // Bypass pembuatan draft untuk Revisi maupun Perpanjangan
      if (submissionMode === 'patch-revisi' || submissionMode === 'create-perpanjangan') {
        const activeRequestId = sktaRequestId ?? permohonan?.id;

        const finalPayload = new FormData();
        finalPayload.append('id', activeRequestId);
        finalPayload.append('mahasiswaId', mahasiswaId);
        
        const categoryString = submissionMode === 'create-perpanjangan' 
          ? SKTA_CATEGORY.PERPANJANGAN_SK 
          : (permohonan?.category || SKTA_CATEGORY.PERMOHONAN_BARU);
          
        finalPayload.append('category', categoryString);
        finalPayload.append('judulProposalIndonesia', formData.judulIndo.trim());
        finalPayload.append('judulProposalInggris', formData.judulInggris.trim());
        if (formData.kode1?.value) finalPayload.append('dosenPembimbing1Id', formData.kode1.value);
        if (formData.kode2?.value) finalPayload.append('dosenPembimbing2Id', formData.kode2.value);
        if (actualFile) finalPayload.append('evidence', actualFile);

        await submitFinalSKTARequest(finalPayload);
        
        if (submissionMode === 'patch-revisi') {
          setPageStatus('revision_sent');
        } else {
          setPageStatus('success');
        }
      } else {
        const categoryString = SKTA_CATEGORY.PERMOHONAN_BARU;

        const draftResult = await submitSKTARequest({
          proposalTitleId:    formData.judulIndo.trim(),
          proposalTitleEn:    formData.judulInggris.trim(),
          studentId:          mahasiswaId,
          dosenPembimbing1Id: formData.kode1?.value,
          dosenPembimbing2Id: formData.kode2?.value,
          category:           categoryString
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
        if (permohonan) {
          setPermohonan({ ...permohonan, category: categoryString });
        }
        
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
        <div className="sk-result-container">
          <div className="sk-result-icon-wrap revisi">
            <Clock size={32} color="#2563EB" />
          </div>
          <h2 className="sk-result-title">
            Revisi Pengajuan SK Berhasil Dikirim!
          </h2>
          <div className="sk-status-banner proses" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div className="sk-status-banner-inner">
              <CheckCircle size={18} color="#2563EB" className="sk-banner-icon" />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', margin: '0 0 4px' }}>
                  Revisi dokumen sudah kami terima
                </p>
                <p className="sk-status-desc" style={{ color: '#3B82F6' }}>
                  Tim akademik akan memverifikasi kembali pengajuan SK Pembimbing Tugas Akhir kamu.
                  Proses verifikasi membutuhkan waktu maksimal <strong>3×24 jam kerja</strong>.
                  Pantau status terbaru melalui dashboard.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            className="sk-btn-action blue"
          >
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    if (pageStatus === 'success') {
      return (
        <div className="sk-result-container">
          <div className="sk-result-icon-wrap success">
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2 className="sk-result-title">
            {isExpired ? 'Perpanjangan SK Berhasil Dikirim!' : 'Pengajuan SK Berhasil Dikirim!'}
          </h2>
          <p className="sk-result-desc">
            {isExpired
              ? 'Permohonan perpanjangan SK Tugas Akhir kamu sudah kami terima. Proses verifikasi membutuhkan waktu maksimal 3×24 jam kerja.'
              : 'Permohonan Penerbitan SK Tugas Akhir kamu sudah kami terima. Proses verifikasi membutuhkan waktu maksimal 3×24 jam kerja. Pantau status pengajuan di dashboard.'}
          </p>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            className="sk-btn-action primary"
          >
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    if (pageStatus === 'status_only') {
      return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <OngoingPembaruanBanner pembaruan={ongoingPembaruan} navigate={navigate} />
          <SkStatusBanner status={skStatus} permohonan={permohonan} />
          
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/mahasiswa/dashboard')}
              className="sk-btn-action primary"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="sk-content-wrapper">
        
        <OngoingPembaruanBanner pembaruan={ongoingPembaruan} navigate={navigate} />

        {isExpired && <SkStatusBanner status={STATUS_SK.EXPIRED} permohonan={permohonan} />}
        {isBelumTerbit && <SkStatusBanner status={STATUS_SK.BELUM_TERBIT} permohonan={permohonan} />}

        {isBelumTerbit && permohonan?.isEdit && (
          <div className={`sk-deadline-alert ${isReadOnlyForm ? 'expired' : 'active'}`}>
            <span>
              {isReadOnlyForm ? '❌ Masa perbaikan dokumen telah habis:' : '⏰ Batas perbaikan dokumen:'}
            </span>
            <span>
              {new Date(permohonan.isEdit).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        )}

        <div className="sk-info-box">
          <div className="sk-info-content">
            <div className="sk-info-icon-circle">
              <Info size={20} />
            </div>
            <div className="sk-info-text">
              <h4>
                {isExpired
                  ? 'Perpanjangan SK Tugas Akhir'
                  : isBelumTerbit
                    ? 'Perbaikan Dokumen SK Tugas Akhir'
                    : 'Permohonan Penerbitan SK Tugas Akhir'}
              </h4>
              <p><strong>Formulir ini ditujukan bagi mahasiswa yang belum memiliki SK TA pada menu TA/PA iGracias</strong></p>
              <p><strong>Harap Baca Secara Teliti</strong></p>
              <p>Formulir ini diajukan setelah mahasiswa mengajukan pembimbing di igracias dan sudah di approve oleh ketua KK.</p>
              <p>
                Apabila belum diapprove, silahkan dapat meminta Approval Dosen Pembimbing kepada ketua KK. Pemilihan KK berdasarkan Dosen Pembimbing I, cek KK dosen di:{' '}
                <a href="http://tel-u.ac.id/dosentatup" target="_blank" rel="noreferrer" style={{ color: '#0070f3', textDecoration: 'underline' }}>
                  tel-u.ac.id/dosentatup
                </a>
              </p>
              <ul>
                <li>KK Electronics and Telecommunications Science — Bu Solichah Larasati: 085726234838</li>
                <li>KK Industrial Systems Engineering — Pak Alza Yudha: 085200330027</li>
                <li>KK Applied Artificial Intelligence — Bu Paradise: 082243368605</li>
                <li>KK Media, Design and Creative Innovation — Bu Agatha: 081331379241</li>
                <li>KK Cyber Security, IOT, and Cloud System — Pak Eko Fajar Cahyadi: 085132323346</li>
                <li>KK Data Science and Optimization — Pak Andi Prademon Yunus: 08114091048</li>
                <li>KK Bioengineering, Food Technology and Advance Material — Bu Nur Afifah Zen: 081227684018</li>
                <li>KK Information System, Digital Business & Data Driven Solution — Bu Rona Nisa Sofia Amriza: 085878447414</li>
                <li>KK Software Engineering and Multimedia — Pak Arif Amrulloh: 08567424313</li>
              </ul>
              <p>Pengajuan penerbitan SK diproses dalam waktu maksimal 3×24 jam sesuai antrian</p>
            </div>
          </div>
          <div className="sk-contact-badge-wrap">
            <div className="sk-contact-badge" onClick={() => window.open('https://wa.me/6285117001281', '_blank')}>
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

        <section className="sk-form-section">
          <h2 className="sk-section-title">Identitas & Program Studi</h2>
          <div className="sk-form-grid">
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Nama</label>
              <div className="sk-input-wrap">
                <User className="sk-input-icon" size={16} />
                <input type="text" value={namaDisplay} readOnly className="sk-input with-icon" disabled />
              </div>
            </div>
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">NIM (Nomor Induk Mahasiswa) *</label>
              <div className="sk-input-wrap">
                <input type="text" value={nimDisplay} readOnly className="sk-input" disabled />
              </div>
            </div>
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Nomor HP / WhatsApp Aktif *</label>
              <div className="sk-input-wrap">
                <Phone className="sk-input-icon" size={16} />
                <input type="text" value={noHpDisplay} readOnly className="sk-input with-icon" disabled />
              </div>
            </div>
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Program Studi</label>
              <div className="sk-input-wrap">
                <GraduationCap className="sk-input-icon" size={16} />
                <input type="text" value={prodiDisplay} readOnly className="sk-input with-icon" disabled />
              </div>
            </div>
          </div>
        </section>

        <section className="sk-form-section">
          <h2 className="sk-section-title">Informasi Tugas Akhir</h2>

          <div className="sk-form-group">
            <label className="sk-form-label">Judul Tugas Akhir (Bahasa Indonesia) *</label>
            <div className="sk-input-wrap">
              <textarea
                placeholder="Masukkan judul tugas akhir dalam Bahasa Indonesia"
                value={formData.judulIndo}
                onChange={(e) => { setFormData(prev => ({ ...prev, judulIndo: e.target.value })); setSubmitError(null); }}
                readOnly={isLockedFields}
                disabled={isLockedFields}
                className="sk-input sk-textarea"
              />
            </div>
          </div>

          <div className="sk-form-group sk-mb-20">
            <label className="sk-form-label">Judul Tugas Akhir (Bahasa Inggris) *</label>
            <div className="sk-input-wrap">
              <textarea
                placeholder="Enter your thesis/final project title in English"
                value={formData.judulInggris}
                onChange={(e) => { setFormData(prev => ({ ...prev, judulInggris: e.target.value })); setSubmitError(null); }}
                readOnly={isLockedFields}
                disabled={isLockedFields}
                className="sk-input sk-textarea"
              />
            </div>
          </div>

          <div className="sk-form-grid sk-mb-20">
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Nama Dosen Pembimbing 1 *</label>
              <div className="sk-input-wrap">
                <User className="sk-input-icon" size={16} />
                <input type="text" placeholder="Auto-terisi setelah pilih kode dosen" value={formData.dosen1} readOnly className="sk-input with-icon" disabled />
              </div>
            </div>
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Kode Dosen Pembimbing 1 *</label>
              <div className="sk-input-wrap block-select">
                <FileBadge className="sk-input-icon" size={16} />
                <Select
                  placeholder={loadingDosen ? "Memuat data dosen..." : "Pilih Kode Dosen 1"}
                  options={lecturerOptions} styles={customSelectStyles}
                  value={formData.kode1} onChange={(val) => handleDosenChange('kode1', val)}
                  isLoading={loadingDosen} isDisabled={loadingDosen || isLockedFields}
                  isClearable noOptionsMessage={() => "Dosen tidak ditemukan"} className="w-full"
                />
              </div>
            </div>
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Nama Dosen Pembimbing 2 *</label>
              <div className="sk-input-wrap">
                <User className="sk-input-icon" size={16} />
                <input type="text" placeholder="Auto-terisi setelah pilih kode dosen" value={formData.dosen2} readOnly className="sk-input with-icon" disabled />
              </div>
            </div>
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Kode Dosen Pembimbing 2 *</label>
              <div className="sk-input-wrap block-select">
                <FileBadge className="sk-input-icon" size={16} />
                <Select
                  placeholder={loadingDosen ? "Memuat data dosen..." : "Pilih Kode Dosen 2"}
                  options={lecturerOptions} styles={customSelectStyles}
                  value={formData.kode2} onChange={(val) => handleDosenChange('kode2', val)}
                  isLoading={loadingDosen} isDisabled={loadingDosen || isLockedFields}
                  isClearable noOptionsMessage={() => "Dosen tidak ditemukan"} className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="sk-form-group sk-mb-0">
            <div className="sk-kk-header">
              <label>Kelompok Keilmuan</label>
              <span>Otomatis diambil dari KK Dosen Pembimbing 1</span>
            </div>
            <div className="sk-kk-grid">
              {kelompokKeilmuan.map((item) => {
                const isSelected = formData.kelompok === item.label;
                return (
                  <div key={item.id} className={`sk-kk-item ${isSelected ? 'selected' : ''} ${isLockedFields && !isSelected ? 'locked' : ''}`}>
                    <div className="sk-kk-radio">
                      {isSelected && <div className="sk-kk-radio-inner" />}
                    </div>
                    <span className="sk-kk-label">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="sk-form-section">
          <h2 className="sk-section-title">
            Dokumen Evidence Sudah Di Approve Pengajuan Pembimbing Oleh Ketua KK Di iGracias
          </h2>

          <div className="sk-template-header">
            <span className="sk-template-label">Berkas Lampiran Bukti Dosbing Sudah Diacc KK :</span>
            <TemplateActionButtons code="permohonan-skta-pengajuan-skta-evidence-approve-dospem-kk" />
          </div>

          {(isBelumTerbit || isExpired) && (
            <p className={`sk-upload-hint ${isBelumTerbit ? 'revisi' : 'perpanjangan'}`}>
              * Dokumen evidence bersifat opsional untuk {isExpired ? 'perpanjangan SK' : 'revisi'}. Kosongkan jika evidence lama masih berlaku.
            </p>
          )}

          <div className="sk-form-grid">
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">Unggah Dokumen Prasyarat {(!isBelumTerbit && !isExpired) ? '*' : ''}</label>
              <div 
                className={`sk-upload-area ${isDragging ? 'dragging' : ''} ${isReadOnlyForm ? 'disabled' : ''}`} 
                onClick={() => !isReadOnlyForm && fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf, .png, .jpg, .jpeg" />
                <div className="sk-upload-icon-circle">
                  <UploadCloud size={32} color={isDragging ? "#c0182a" : "#6B7280"} />
                </div>
                <div className="sk-upload-text">
                  <p><strong>Pilih File</strong> atau Tarik dan Lepaskan di sini</p>
                  <div className="sk-file-type-badges">
                    <span>PDF / PNG / JPG</span>
                    <span>MAX 3MB</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sk-form-group sk-mb-0">
              <label className="sk-form-label">File Terpilih</label>
              <div className="sk-file-status-list">
                {selectedFile && (
                  <div className="sk-status-card success">
                    <div className="sk-status-icon-wrap"><FileText size={16} /></div>
                    <div className="sk-status-info">
                      <div className="sk-status-filename">{selectedFile.name} <span className="sk-label-siap">Siap</span></div>
                      <div className="sk-status-meta">{selectedFile.size} MB • {selectedFile.type}</div>
                    </div>
                  </div>
                )}
                {fileError && (
                  <div className="sk-status-card error">
                    <div className="sk-status-icon-wrap"><AlertTriangle size={16} /></div>
                    <div className="sk-status-info">
                      <div className="sk-error-title">File Tidak Valid</div>
                      <div className="sk-error-desc">{fileError}</div>
                    </div>
                  </div>
                )}
                {!selectedFile && !fileError && (
                  <div className="sk-empty-state">
                    {isExpired ? 'Opsional: kosongkan jika evidence lama masih berlaku' : isBelumTerbit ? 'Opsional kosongkan jika evidence lama masih berlaku' : 'Belum ada file yang dipilih'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="sk-bottom-actions">
          <button
            className={`sk-btn-submit ${isReadOnlyForm ? 'disabled-gray' : ''}`}
            onClick={handleSubmit}
            disabled={pageStatus === 'submitting' || isReadOnlyForm}
          >
            {pageStatus === 'submitting' ? (
              <><Loader size={14} className="sk-spinner-inline" /> Mengirim...</>
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
    <div className={`sk-layout ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div id="main-content">
        <header className="topbar">
          <button className="topbar-toggle" onClick={handleToggleSidebar}>
            <Menu size={20} color="#fff" />
          </button>
          <div className="topbar-brand text-white" style={{ fontSize: '15px' }}>{dynamicTitle}</div>
        </header>
        <main className="sk-page-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PengajuanSK;