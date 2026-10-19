import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Info, MessageCircle, User, Phone, GraduationCap, UploadCloud, FileText, AlertTriangle, FileBadge, CheckCircle, Loader, Clock, AlertCircle, Menu, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

import { getLecturers, getSKTARequest, getAllSktaRequests, submitSKTARequest, submitFinalSKTARequest } from '../../service/api';
import LogoTelkom from '../../assets/logo-telkom.png';
import { useAuth }    from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import { determineSkStatus, STATUS_SK, isSkEditable, getSkFileUrl } from '../../components/common/Skstatushelper';
import CustomAlert from '../../components/common/CustomAlert';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../../style/css/mahasiswa/pembaruansk.css'; 

const PageLoader = () => (
  <div className="pb-page-loader">
    <Loader size={32} color="#C0182A" className="pb-spinner" />
    <p>Memuat data...</p>
  </div>
);

const SkStatusBanner = ({ status, permohonan }) => {
  const configs = {
    [STATUS_SK.DALAM_PROSES]: {
      styleClass: 'proses',
      icon: <Clock size={16} color="#2563EB" />,
      title: 'Pengajuan Pembaruan SK Sedang Diproses',
      desc: 'Permohonan pembaruan SK Tugas Akhir kamu sedang dalam antrian verifikasi oleh tim akademik. Proses maksimal 3×24 jam kerja.',
      badgeText: 'Dalam Proses',
    },
    [STATUS_SK.BELUM_TERBIT]: {
      styleClass: 'revisi',
      icon: <AlertCircle size={16} color="#D97706" />,
      title: 'Pembaruan SK Memerlukan Perbaikan Dokumen',
      desc: permohonan?.message
        ? `Tim akademik memberikan catatan: "${permohonan.message}". Silakan perbaiki pengajuan kamu di bawah ini.`
        : 'Pengajuan pembaruan SK kamu perlu diperbaiki. Silakan perbarui data melalui formulir di bawah ini.',
      badgeText: 'Perlu Perbaikan',
    },
    [STATUS_SK.SUDAH_TERBIT]: {
      styleClass: 'terbit',
      icon: <CheckCircle size={16} color="#059669" />,
      title: 'Pembaruan SK Tugas Akhir Telah Terbit',
      desc: 'Permohonan pembaruan SK kamu telah disetujui dan diterbitkan. Kamu dapat mengunduh dokumen SK melalui tombol di bawah ini. Jika ada perubahan lanjutan, kamu dapat mengisi formulir kembali.',
      badgeText: 'Sudah Terbit',
    }
  };

  const cfg = configs[status];
  if (!cfg) return null;

  const isBelumTerbit = status === STATUS_SK.BELUM_TERBIT;
  const isEditable = isBelumTerbit ? isSkEditable(status, permohonan) : true;
  const skUrl = status === STATUS_SK.SUDAH_TERBIT ? getSkFileUrl(permohonan) : null;

  return (
    <div className={`pb-status-banner ${cfg.styleClass}`}>
      <div className="pb-banner-inner">
        <div className="pb-banner-icon">{cfg.icon}</div>
        <div className="pb-banner-content">
          <div className="pb-banner-header">
            <span className="pb-banner-title">{cfg.title}</span>
            <span className="pb-banner-badge">
              {cfg.badgeText}
            </span>
          </div>
          <p className="pb-banner-desc">
            {cfg.desc}
          </p>
          
          {isBelumTerbit && permohonan?.isEdit && (
            <div className={`pb-banner-alert ${isEditable ? 'editable' : 'expired'}`}>
              <Clock size={14} />
              <span>
                {isEditable ? 'Batas Waktu Perbaikan: ' : 'Masa Perbaikan Berakhir: '} 
                {new Date(permohonan.isEdit).toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
          )}

          {status === STATUS_SK.SUDAH_TERBIT && skUrl && (
            <button 
              onClick={() => window.open(skUrl, '_blank')}
              className="pb-btn-download"
            >
              <Download size={14} />
              Unduh SK Pembaruan
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

const categoryOptions = [
  { value: 'Perubahan Judul', label: 'Perubahan Judul' },
  { value: 'Perubahan Dosen Pembimbing', label: 'Perubahan Dosen Pembimbing' },
  { value: 'Perubahan Judul dan Dosen Pembimbing', label: 'Perubahan Judul dan Dosen Pembimbing' },
];

const parseBackendError = (err) => {
  const data = err.response?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const lines = data.errors.map(e => {
      if (typeof e === 'string') return `• ${e}`;
      return `• ${e.message || e.msg || JSON.stringify(e)}`;
    });
    return { title: data.message || 'Validasi Gagal, Periksa Formulirmu', message: lines.join('\n') };
  }
  if (data?.message) return { title: 'Gagal', message: data.message };
  return { title: 'Gagal', message: err.message || 'Terjadi kesalahan pada sistem.' };
};

const PembaruanSK = () => {
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
  
  const [draftId, setDraftId] = useState(null); 
  const [isGenerating, setIsGenerating] = useState(false);

  const [oldData, setOldData] = useState({
    judulIndo: '', judulInggris: '', dosen1: '', dosen2: '', kode1: null, kode2: null, researchGroupId: null
  });

  const [kategori, setKategori] = useState(null);
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
          setSubmitError({ title: 'Akses Ditolak', message: 'Kamu belum memiliki SK Tugas Akhir yang aktif atau diterbitkan. Silakan ajukan Permohonan SK baru terlebih dahulu.' });
          setPageStatus('blocked');
          return;
        }

        let activeSk = latest; 
        try {
          const allReq = await getAllSktaRequests({ mahasiswaId, limit: 100 });
          if (Array.isArray(allReq) && allReq.length > 0) {
            const sortedReq = allReq.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const foundActive = sortedReq.find(req => 
              req.id !== latest.id && 
              (determineSkStatus(req) === STATUS_SK.SUDAH_TERBIT || req.category === 'Permohonan Baru' || req.category === 'Perpanjangan SK')
            );
            if (foundActive) {
              activeSk = foundActive; 
            }
          }
        } catch(e) {
          console.warn("Gagal fetch history SK, menggunakan latest sbg fallback");
        }

        setPermohonan(latest);
        updateSktaRequestId(latest.id);

        const status = determineSkStatus(latest);
        const isPerubahan = latest.category && latest.category.includes('Perubahan');
        
        setSkStatus(status);

        if (!isPerubahan) {
          if (status === STATUS_SK.DALAM_PROSES || status === STATUS_SK.BELUM_TERBIT) {
            setSubmitError({ 
              title: 'Pengajuan Utama Sedang Berjalan', 
              message: 'Kamu masih memiliki pengajuan Penerbitan SK yang sedang diproses atau perlu direvisi. Selesaikan pengajuan tersebut terlebih dahulu sebelum melakukan Pembaruan SK.' 
            });
            setPageStatus('blocked');
            return;
          }
          setSubmissionMode('create-baru');
        } else {
          if (status === STATUS_SK.DRAFT) {
            setDraftId(latest.id);
            setSubmissionMode('create-baru');
            setKategori(categoryOptions.find(c => c.value === latest.category) || null);
          } else if (status === STATUS_SK.DALAM_PROSES) {
            setPageStatus('status_only');
            return;
          } else if (status === STATUS_SK.BELUM_TERBIT) {
            setSubmissionMode('patch-revisi');
            setKategori(categoryOptions.find(c => c.value === latest.category) || null);
          } else if (status === STATUS_SK.EXPIRED) {
            setSubmitError({ 
              type: 'expired',
              title: 'Masa Berlaku SK Telah Habis', 
              message: 'SK Tugas Akhir kamu telah kadaluarsa. Sistem memprioritaskan perpanjangan masa berlaku sebelum kamu bisa melakukan pembaruan data. Silakan ajukan Perpanjangan SK terlebih dahulu.' 
            });
            setPageStatus('blocked');
            return;
          } else if (status === STATUS_SK.SUDAH_TERBIT) {
            setSubmissionMode('create-baru');
          }
        }

        const d1Obj = activeSk.dosenPembimbing1;
        const d2Obj = activeSk.dosenPembimbing2;

        const matchedKode1 = d1Obj 
          ? { value: String(d1Obj.id), label: `${d1Obj.kodeDosen || ''} — ${d1Obj.name || d1Obj.nama || ''}`, nama: d1Obj.name || d1Obj.nama || '', researchGroupId: d1Obj.researchGroupId }
          : lecturerOptions.find(opt => String(opt.value) === String(activeSk.dosenPembimbing1Id));

        const matchedKode2 = d2Obj 
          ? { value: String(d2Obj.id), label: `${d2Obj.kodeDosen || ''} — ${d2Obj.name || d2Obj.nama || ''}`, nama: d2Obj.name || d2Obj.nama || '', researchGroupId: d2Obj.researchGroupId }
          : lecturerOptions.find(opt => String(opt.value) === String(activeSk.dosenPembimbing2Id));

        const matchedKK = matchedKode1?.researchGroupId != null
          ? kelompokKeilmuan.find(kk => String(kk.researchGroupId) === String(matchedKode1.researchGroupId))
          : null;
        
        setOldData({
          judulIndo: activeSk.judulProposalIndonesia ?? activeSk.proposalTitleId ?? '-',
          judulInggris: activeSk.judulProposalInggris ?? activeSk.proposalTitleEn ?? '-',
          dosen1: matchedKode1?.nama ?? '-',
          dosen2: matchedKode2?.nama ?? '-',
          kode1: matchedKode1 ?? (activeSk.dosenPembimbing1Id ? { value: activeSk.dosenPembimbing1Id } : null),
          kode2: matchedKode2 ?? (activeSk.dosenPembimbing2Id ? { value: activeSk.dosenPembimbing2Id } : null),
          kelompok: matchedKK?.label ?? '',
          researchGroupId: activeSk.researchGroupId,
        });

        if (status === STATUS_SK.DRAFT || (isPerubahan && status === STATUS_SK.BELUM_TERBIT)) {
          const draftD1 = latest.dosenPembimbing1;
          const draftD2 = latest.dosenPembimbing2;
          
          const draftMatched1 = draftD1 
            ? { value: String(draftD1.id), label: `${draftD1.kodeDosen || ''} — ${draftD1.name || draftD1.nama || ''}`, nama: draftD1.name || draftD1.nama || '', researchGroupId: draftD1.researchGroupId }
            : lecturerOptions.find(opt => String(opt.value) === String(latest.dosenPembimbing1Id)) ?? matchedKode1;

          const draftMatched2 = draftD2 
            ? { value: String(draftD2.id), label: `${draftD2.kodeDosen || ''} — ${draftD2.name || draftD2.nama || ''}`, nama: draftD2.name || draftD2.nama || '', researchGroupId: draftD2.researchGroupId }
            : lecturerOptions.find(opt => String(opt.value) === String(latest.dosenPembimbing2Id)) ?? matchedKode2;

          setFormData({
            judulIndo: latest.judulProposalIndonesia ?? latest.proposalTitleId ?? '',
            judulInggris: latest.judulProposalInggris ?? latest.proposalTitleEn ?? '',
            kode1: draftMatched1 ?? null,
            dosen1: draftMatched1?.nama ?? '',
            kode2: draftMatched2 ?? null,
            dosen2: draftMatched2?.nama ?? '',
            kelompok: matchedKK?.label ?? '',
          });
        }

        setPageStatus('form');
      } catch (err) {
        console.error('Gagal cek status SKTA:', err);
        setPageStatus('form');
      }
    };

    if (!loadingDosen && !isStudentLoading) checkSKTAStatus();
  }, [loadingDosen, isStudentLoading, student, navigate, lecturerOptions]);

  const namaDisplay  = student?.namaLengkap || user?.username || '';
  const nimDisplay   = student?.nim || '';
  const prodiDisplay = student?.studyProgramNama || '';

  const isGantiJudul = kategori?.value === 'Perubahan Judul' || kategori?.value === 'Perubahan Judul dan Dosen Pembimbing';
  const isGantiDosen = kategori?.value === 'Perubahan Dosen Pembimbing' || kategori?.value === 'Perubahan Judul dan Dosen Pembimbing';

  const isBelumTerbit = submissionMode === 'patch-revisi';
  const isEditableForm = isSkEditable(skStatus, permohonan);
  const isReadOnlyForm = isBelumTerbit && !isEditableForm;

  const handleDosenChange = useCallback((field, val) => {
    if (isReadOnlyForm) return;
    const namaField = field === 'kode1' ? 'dosen1' : 'dosen2';
    setFormData(prev => {
      const updated = { ...prev, [field]: val, [namaField]: val?.nama || '' };
      if (field === 'kode1') {
        if (val?.researchGroupId != null) {
          const matched = kelompokKeilmuan.find(kk => String(kk.researchGroupId) === String(val.researchGroupId));
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
      const safeNim = student?.nim || "0000000000";
      const extension = file.name.split('.').pop();
      const catName = kategori ? kategori.value : 'Perubahan';
      const formattedFileName = `${safeNim}_Evidence_${catName}.${extension}`;
      
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

  const handleGenerateTemplateAndSaveDraft = async () => {
    setSubmitError(null);
    if (isReadOnlyForm) return;
    
    if (!kategori) {
      setSubmitError({ title: 'Kategori Belum Dipilih', message: 'Silakan pilih kategori perubahan terlebih dahulu.' });
      return;
    }
    if (isGantiJudul && (!formData.judulIndo.trim() || !formData.judulInggris.trim())) {
      setSubmitError({ title: 'Data Belum Lengkap', message: 'Silakan lengkapi judul tugas akhir baru terlebih dahulu.' });
      return;
    }
    if (isGantiDosen && (!formData.kode1)) {
      setSubmitError({ title: 'Data Belum Lengkap', message: 'Silakan lengkapi data dosen pembimbing baru terlebih dahulu.' });
      return;
    }

    setIsGenerating(true);

    const d1Lama = oldData.dosen1;
    const d2Lama = oldData.dosen2 || '-';
    
    const d1Baru = isGantiDosen ? formData.dosen1 : d1Lama;
    const d2Baru = isGantiDosen ? (formData.dosen2 || '-') : d2Lama;
    const jBaru = isGantiJudul ? formData.judulIndo : oldData.judulIndo;

    const isPerubahanJudulSaja = kategori.value === 'Perubahan Judul';
    const docNo = isPerubahanJudulSaja ? 'TUP-SPM-FM-TA-006' : 'TUP-SPM-FM-TA-007';
    const headerFormTitle = isPerubahanJudulSaja ? 'FORMULIR PERMOHONAN<br>PERUBAHAN JUDUL TUGAS AKHIR' : 'FORMULIR PERMOHONAN<br>PERUBAHAN SK TUGAS AKHIR';
    const bodyFormTitle = isPerubahanJudulSaja ? 'PERMOHONAN PERUBAHAN JUDUL TUGAS AKHIR' : 'PERMOHONAN PERUBAHAN SK TUGAS AKHIR';

    const signatureRowHTML = isGantiDosen ? `
      <tr>
        <td style="width: 25%; text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 11px;">PEMBIMBING I<br/>(SEBELUMNYA)</td>
        <td style="width: 25%; text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 11px;">PEMBIMBING I<br/>(BARU)</td>
        <td style="width: 25%; text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 11px;">PEMBIMBING II<br/>(SEBELUMNYA)</td>
        <td style="width: 25%; text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 11px;">PEMBIMBING II<br/>(BARU)</td>
      </tr>
      <tr>
        <td style="height: 65px; border: 1px solid black;"></td>
        <td style="height: 65px; border: 1px solid black;"></td>
        <td style="height: 65px; border: 1px solid black;"></td>
        <td style="height: 65px; border: 1px solid black;"></td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 5px; border: 1px solid black; font-size: 11px;">( ${d1Lama} )</td>
        <td style="text-align: center; padding: 5px; border: 1px solid black; font-size: 11px;">( ${d1Baru} )</td>
        <td style="text-align: center; padding: 5px; border: 1px solid black; font-size: 11px;">( ${d2Lama !== '-' ? d2Lama : '...........................'} )</td>
        <td style="text-align: center; padding: 5px; border: 1px solid black; font-size: 11px;">( ${d2Baru !== '-' ? d2Baru : '...........................'} )</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; padding: 5px; border: 1px solid black; vertical-align: top;">
           Mengetahui<br/>Kaprodi ${prodiDisplay},<br/><br/><br/><br/><br/>
           <b>(......................................................)</b>
        </td>
        <td colspan="2" style="text-align: center; padding: 5px; border: 1px solid black; vertical-align: top;">
           Purwokerto, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pemohon,<br/><br/><br/><br/><br/>
           <b>( ${namaDisplay} )</b>
        </td>
      </tr>
    ` : `
      <tr>
        <td colspan="2" style="width: 50%; text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 12px;">PEMBIMBING I</td>
        <td colspan="2" style="width: 50%; text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 12px;">PEMBIMBING II</td>
      </tr>
      <tr>
        <td colspan="2" style="height: 65px; border: 1px solid black;"></td>
        <td colspan="2" style="height: 65px; border: 1px solid black;"></td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; padding: 5px; border: 1px solid black; font-size: 12px;">( ${d1Baru} )</td>
        <td colspan="2" style="text-align: center; padding: 5px; border: 1px solid black; font-size: 12px;">( ${d2Baru !== '-' ? d2Baru : '...................................................'} )</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; padding: 5px; border: 1px solid black; vertical-align: top;">
           Mengetahui<br/>Kaprodi ${prodiDisplay},<br/><br/><br/><br/><br/>
           <b>(......................................................)</b>
        </td>
        <td colspan="2" style="text-align: center; padding: 5px; border: 1px solid black; vertical-align: top;">
           Purwokerto, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Pemohon,<br/><br/><br/><br/><br/>
           <b>( ${namaDisplay} )</b>
        </td>
      </tr>
    `;

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12px; padding: 20px; color: #000; width: 100%; box-sizing: border-box;">
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid black;">
          <tr>
            <td rowspan="4" style="width: 20%; text-align: center; border: 1px solid black; padding: 10px; vertical-align: middle;">
              <img src="${LogoTelkom}" alt="Logo Telkom" style="max-height: 50px; display: block; margin: 0 auto; object-fit: contain;" />
            </td>
            <td rowspan="2" style="width: 50%; text-align: center; border: 1px solid black; padding: 5px; vertical-align: middle;">
              <div style="font-weight: bold; font-size: 14px;">UNIVERSITAS TELKOM</div>
              <div style="font-size: 10px; margin-top: 3px;">Jl. Telekomunikasi No. 1, Dayeuh Kolot, Kab. Bandung 40257</div>
            </td>
            <td style="width: 15%; border: 1px solid black; padding: 5px; font-size: 11px;">No. Dokumen</td>
            <td style="width: 15%; border: 1px solid black; padding: 5px; font-size: 11px;">${docNo}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 5px; font-size: 11px;">No. Revisi</td>
            <td style="border: 1px solid black; padding: 5px; font-size: 11px;">00</td>
          </tr>
          <tr>
            <td rowspan="2" style="text-align: center; border: 1px solid black; padding: 5px; font-weight: bold; font-size: 13px; vertical-align: middle;">
              ${headerFormTitle}
            </td>
            <td style="border: 1px solid black; padding: 5px; font-size: 11px;">Berlaku Efektif</td>
            <td style="border: 1px solid black; padding: 5px; font-size: 11px;">02 Januari 2025</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 5px; font-size: 11px;">Halaman</td>
            <td style="border: 1px solid black; padding: 5px; font-size: 11px;">1 dari 1</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
          <tr>
            <td colspan="4" style="text-align: center; padding: 12px; border: 1px solid black;">
              <div style="font-weight: bold; font-size: 15px; text-transform: uppercase;">${bodyFormTitle}</div>
              <div style="font-weight: bold; font-size: 13px; margin-top: 4px;">PROGRAM STUDI SARJANA</div>
            </td>
          </tr>
          <tr>
            <td style="width: 15%; padding: 6px 10px; border-left: 1px solid black; font-size: 12px;">NIM</td>
            <td colspan="3" style="padding: 6px 10px; border-right: 1px solid black; font-size: 12px;">: ${nimDisplay}</td>
          </tr>
          <tr>
            <td style="width: 15%; padding: 6px 10px; border-left: 1px solid black; border-bottom: 1px solid black; font-size: 12px;">Nama</td>
            <td colspan="3" style="padding: 6px 10px; border-right: 1px solid black; border-bottom: 1px solid black; font-size: 12px;">: ${namaDisplay}</td>
          </tr>

          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 12px;">NAMA PEMBIMBING</td>
          </tr>
          <tr>
            <td style="width: 15%; padding: 6px 10px; border-left: 1px solid black; font-size: 12px;">Pembimbing I</td>
            <td colspan="3" style="padding: 6px 10px; border-right: 1px solid black; font-size: 12px;">: ${d1Baru}</td>
          </tr>
          <tr>
            <td style="width: 15%; padding: 6px 10px; border-left: 1px solid black; border-bottom: 1px solid black; font-size: 12px;">Pembimbing II</td>
            <td colspan="3" style="padding: 6px 10px; border-right: 1px solid black; border-bottom: 1px solid black; font-size: 12px;">: ${d2Baru !== '-' ? d2Baru : ''}</td>
          </tr>

          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 12px;">JUDUL YANG DITETAPKAN SEBELUMNYA *)</td>
          </tr>
          <tr>
            <td colspan="4" style="padding: 15px 15px; border: 1px solid black; text-transform: uppercase; text-align: center; height: 60px; vertical-align: middle; font-size: 12px;">
              ${oldData.judulIndo}
            </td>
          </tr>

          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 12px;">JUDUL BARU **)</td>
          </tr>
          <tr>
            <td colspan="4" style="padding: 15px 15px; border: 1px solid black; text-transform: uppercase; text-align: center; height: 60px; vertical-align: middle; font-size: 12px;">
              ${jBaru}
            </td>
          </tr>

          <tr>
            <td colspan="4" style="text-align: center; font-weight: bold; padding: 5px; border: 1px solid black; font-size: 12px;">MENYETUJUI PERUBAHAN JUDUL DAN PEMBIMBING TUGAS AKHIR</td>
          </tr>
          
          ${signatureRowHTML}
          
        </table>
        
        <div style="margin-top: 15px; font-size: 11px; line-height: 1.5;">
          <u>Catatan:</u><br/>
          *) : Harus melampirkan SK TA yang lama<br/>
          **) : Harus diisi<br/>
          Formulir ini disediakan oleh admin Akademik. Form ini diisi lengkap dan dikumpulkan ke admin Akademik. Mahasiswa juga melakukan perubahan judul dan pembimbing pada aplikasi iGracias.
        </div>
      </div>
    `;

    const opt = {
      margin:       [10, 10, 10, 10], 
      filename:     `${nimDisplay}_Evidence_${kategori.value}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const mahasiswaId = student?.mahasiswaId || student?.studentId;
      
      const payloadDraft = {
        studentId: mahasiswaId,
        mahasiswaId: mahasiswaId,
        category: kategori.value,
        proposalTitleId: isGantiJudul ? formData.judulIndo.trim() : oldData.judulIndo,
        proposalTitleEn: isGantiJudul ? formData.judulInggris.trim() : oldData.judulInggris,
      };

      const rgBaru = isGantiDosen ? formData.kode1?.researchGroupId : oldData.researchGroupId;
      const p1 = isGantiDosen ? formData.kode1?.value : oldData.kode1?.value;
      const p2 = isGantiDosen ? formData.kode2?.value : oldData.kode2?.value;
      
      if (draftId) payloadDraft.id = draftId;
      if (p1) payloadDraft.dosenPembimbing1Id = p1;
      if (p2) payloadDraft.dosenPembimbing2Id = p2;
      if (rgBaru) payloadDraft.researchGroupId = rgBaru;

      const res = await submitSKTARequest(payloadDraft);
      const newDraftId = res?.data?.id || res?.id;
      if (newDraftId) {
        setDraftId(newDraftId);
        updateSktaRequestId(newDraftId);
      }
      
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Gagal menyimpan draft:', err);
      const parsedErr = parseBackendError(err);
      setSubmitError({ title: 'Gagal Membuat Draft', message: parsedErr.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (isReadOnlyForm) return;

    if (submissionMode === 'create-baru' && !draftId) {
      setSubmitError({ title: 'Aksi Ditolak', message: 'Silakan Export Evidence Formulir terlebih dahulu untuk menyimpan data.' });
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    if (submissionMode === 'create-baru' && !actualFile) {
      setSubmitError({ title: 'Dokumen Kosong', message: 'Dokumen evidence perubahan wajib dilampirkan.' });
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    const mahasiswaId = student?.mahasiswaId || student?.studentId;
    if (!mahasiswaId) return;

    setPageStatus('submitting');

    try {
      if (submissionMode === 'patch-revisi') {
        const activeRequestId = sktaRequestId ?? permohonan?.id;
        
        const finalPayload = new FormData();
        finalPayload.append('id', activeRequestId);
        finalPayload.append('mahasiswaId', mahasiswaId);
        finalPayload.append('category', kategori.value);
        finalPayload.append('judulProposalIndonesia', isGantiJudul ? formData.judulIndo.trim() : oldData.judulIndo);
        finalPayload.append('judulProposalInggris', isGantiJudul ? formData.judulInggris.trim() : oldData.judulInggris);
        
        const p1 = isGantiDosen ? formData.kode1?.value : oldData.kode1?.value;
        const p2 = isGantiDosen ? formData.kode2?.value : oldData.kode2?.value;
        const rgBaru = isGantiDosen ? formData.kode1?.researchGroupId : oldData.researchGroupId;

        if (p1) finalPayload.append('dosenPembimbing1Id', p1);
        if (p2) finalPayload.append('dosenPembimbing2Id', p2);
        if (rgBaru) finalPayload.append('researchGroupId', rgBaru);
        if (actualFile) finalPayload.append('evidence', actualFile);

        await submitFinalSKTARequest(finalPayload);
        setPageStatus('revision_sent');
      } else {
        const finalPayload = new FormData();
        finalPayload.append('id', draftId);
        finalPayload.append('mahasiswaId', mahasiswaId);
        finalPayload.append('category', kategori.value);
        finalPayload.append('judulProposalIndonesia', isGantiJudul ? formData.judulIndo.trim() : oldData.judulIndo);
        finalPayload.append('judulProposalInggris', isGantiJudul ? formData.judulInggris.trim() : oldData.judulInggris);
        
        const p1 = isGantiDosen ? formData.kode1?.value : oldData.kode1?.value;
        const p2 = isGantiDosen ? formData.kode2?.value : oldData.kode2?.value;
        const rgBaru = isGantiDosen ? formData.kode1?.researchGroupId : oldData.researchGroupId;

        if (p1) finalPayload.append('dosenPembimbing1Id', p1);
        if (p2) finalPayload.append('dosenPembimbing2Id', p2);
        if (rgBaru) finalPayload.append('researchGroupId', rgBaru);
        
        finalPayload.append('evidence', actualFile);

        await submitFinalSKTARequest(finalPayload);
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
      paddingLeft: '8px',
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

    if (pageStatus === 'blocked') {
      const isExpired = submitError?.type === 'expired';
      
      return (
        <div className="pb-result-container">
          <div className={`pb-result-icon-wrap ${isExpired ? 'expired' : 'error'}`}>
            {isExpired ? <Clock size={32} color="#D97706" /> : <AlertTriangle size={32} color="#DC2626" />}
          </div>
          <h2 className="pb-result-title">
            {submitError?.title || 'Akses Ditolak'}
          </h2>
          <p className="pb-result-desc">
            {submitError?.message || 'Kamu tidak dapat mengakses menu Pembaruan SK saat ini.'}
          </p>
          <button
            onClick={() => navigate('/mahasiswa/pengajuan-sk')}
            className={`pb-btn-action center ${isExpired ? 'expired' : 'primary'}`}
          >
            {isExpired ? 'Perpanjang SK Sekarang' : 'Ke Menu Permohonan SK'}
          </button>
        </div>
      );
    }

    if (pageStatus === 'revision_sent' || pageStatus === 'success') {
      return (
        <div className="pb-result-container">
          <div className={`pb-result-icon-wrap ${pageStatus === 'success' ? 'success' : 'proses'}`}>
            {pageStatus === 'success' ? <CheckCircle size={32} color="#10B981" /> : <Clock size={32} color="#2563EB" />}
          </div>
          <h2 className="pb-result-title">
            {pageStatus === 'success' ? 'Pengajuan Pembaruan SK Berhasil Dikirim!' : 'Revisi Pembaruan SK Berhasil Dikirim!'}
          </h2>
          <p className="pb-result-desc">
            Permohonan kamu sudah kami terima dan masuk ke dalam antrian verifikasi tim akademik. Proses membutuhkan waktu maksimal 3×24 jam kerja. Pantau status pengajuan di dashboard.
          </p>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            className="pb-btn-action primary center"
          >
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    if (pageStatus === 'status_only') {
      return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <SkStatusBanner status={skStatus} permohonan={permohonan} />
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/mahasiswa/dashboard')}
              className="pb-btn-action primary center"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        {submissionMode === 'patch-revisi' && (
          <SkStatusBanner status={STATUS_SK.BELUM_TERBIT} permohonan={permohonan} />
        )}
        
        {skStatus === STATUS_SK.SUDAH_TERBIT && permohonan?.category?.includes('Perubahan') && (
          <SkStatusBanner status={STATUS_SK.SUDAH_TERBIT} permohonan={permohonan} />
        )}

        <div className="pb-info-box">
          <div className="pb-info-content">
            <div className="pb-info-icon-circle">
              <Info size={20} />
            </div>
            <div className="pb-info-text">
              <h4>
                Pembaruan / Perubahan SK Tugas Akhir
              </h4>
              <p><strong>Halaman ini dikhususkan bagi mahasiswa yang ingin mengajukan perubahan data pada SK TA yang sudah terbit.</strong></p>
              <ul>
                <li>Pilih kategori perubahan sesuai dengan kebutuhan.</li>
                <li>Lengkapi form perubahan. Setelah selesai, klik tombol <strong>Export Evidence Formulir</strong> untuk menyimpan draft secara otomatis.</li>
                <li>Mintalah persetujuan (Tanda Tangan) pihak terkait pada formulir yang telah diunduh, lalu scan dan unggah kembali pada kolom di bawah untuk memproses pengajuan.</li>
              </ul>
              <p>Pengajuan pembaruan SK diproses dalam waktu maksimal 3×24 jam sesuai antrian.</p>
            </div>
          </div>
        </div>

        {submitError && (
          <div ref={errorRef}>
            <CustomAlert type="error" title={submitError.title} message={<span style={{ whiteSpace: 'pre-line' }}>{submitError.message}</span>} style={{ margin: '0 0 20px 0' }} />
          </div>
        )}

        <section className={`pb-form-section ${kategori ? '' : 'disabled'}`} style={!kategori ? { pointerEvents: 'auto', opacity: 1 } : {}}>
          <h2 className="pb-section-title">
            Kategori Perubahan
            {draftId && (
              <span className="pb-draft-badge">
                <CheckCircle size={12} /> Draft otomatis tersimpan
              </span>
            )}
          </h2>
          
          <div className="pb-form-group pb-mb-24">
            <label className="pb-form-label">Kategori Perubahan SK *</label>
            <Select
              placeholder="Pilih Kategori Perubahan"
              options={categoryOptions}
              value={kategori}
              onChange={(val) => { setKategori(val); setDraftId(null); }}
              isDisabled={submissionMode === 'patch-revisi' || draftId != null}
              styles={customSelectStyles}
            />
            {(submissionMode === 'patch-revisi' || draftId) && (
              <p className="pb-input-hint">Kategori terkunci karena sudah masuk ke mode draft/perbaikan.</p>
            )}
          </div>

          <h2 className="pb-section-title bordered">Identitas & Data SK Lama</h2>
          <div className="pb-form-grid">
            <div className="pb-form-group pb-mb-0">
              <label className="pb-form-label">NIM</label>
              <div className="pb-input-wrap">
                <input type="text" value={nimDisplay} readOnly className="pb-input" disabled />
              </div>
            </div>
            <div className="pb-form-group pb-mb-0">
              <label className="pb-form-label">Nama</label>
              <div className="pb-input-wrap">
                <User className="pb-input-icon" size={16} />
                <input type="text" value={namaDisplay} readOnly className="pb-input with-icon" disabled />
              </div>
            </div>
          </div>

          <div className="pb-form-group">
            <label className="pb-form-label">Judul Lama (Bahasa Indonesia)</label>
            <div className="pb-input-wrap">
              <textarea value={oldData.judulIndo} readOnly className="pb-input pb-textarea" disabled />
            </div>
          </div>
          
          <div className="pb-form-group">
            <label className="pb-form-label">Judul Lama (Bahasa Inggris)</label>
            <div className="pb-input-wrap">
              <textarea value={oldData.judulInggris} readOnly className="pb-input pb-textarea" disabled />
            </div>
          </div>

          <div className="pb-form-grid">
            <div className="pb-form-group pb-mb-0">
              <label className="pb-form-label">Pembimbing Lama 1</label>
              <div className="pb-input-wrap">
                <User className="pb-input-icon" size={16} />
                <input type="text" value={oldData.dosen1} readOnly className="pb-input with-icon" disabled />
              </div>
            </div>
            <div className="pb-form-group pb-mb-0">
              <label className="pb-form-label">Pembimbing Lama 2 (Opsional)</label>
              <div className="pb-input-wrap">
                <User className="pb-input-icon" size={16} />
                <input type="text" value={oldData.dosen2} readOnly className="pb-input with-icon" disabled />
              </div>
            </div>
          </div>
        </section>

        <section className={`pb-form-section ${kategori ? '' : 'disabled'}`}>
          <h2 className="pb-section-title">Formulir Data Perubahan</h2>
          {!kategori && <p className="pb-section-hint">Pilih kategori perubahan di atas untuk mengaktifkan form.</p>}

          {isGantiJudul && (
            <>
              <div className="pb-form-group">
                <label className="pb-form-label">Judul Baru (Bahasa Indonesia) *</label>
                <div className="pb-input-wrap">
                  <textarea
                    value={formData.judulIndo}
                    onChange={(e) => { setFormData(prev => ({ ...prev, judulIndo: e.target.value })); setSubmitError(null); }}
                    className="pb-input pb-textarea tall"
                    readOnly={isReadOnlyForm}
                    disabled={isReadOnlyForm}
                    placeholder="Masukkan judul tugas akhir baru dalam Bahasa Indonesia"
                  />
                </div>
              </div>

              <div className="pb-form-group pb-mb-20">
                <label className="pb-form-label">Judul Baru (Bahasa Inggris) *</label>
                <div className="pb-input-wrap">
                  <textarea
                    value={formData.judulInggris}
                    onChange={(e) => { setFormData(prev => ({ ...prev, judulInggris: e.target.value })); setSubmitError(null); }}
                    className="pb-input pb-textarea tall"
                    readOnly={isReadOnlyForm}
                    disabled={isReadOnlyForm}
                    placeholder="Enter your new thesis title in English"
                  />
                </div>
              </div>
            </>
          )}

          {isGantiDosen && (
            <div className="pb-form-grid pb-mb-20">
              <div className="pb-form-group pb-mb-0">
                <label className="pb-form-label">Nama Pembimbing 1 Baru *</label>
                <div className="pb-input-wrap">
                  <User className="pb-input-icon" size={16} />
                  <input type="text" value={formData.dosen1} readOnly className="pb-input with-icon" disabled placeholder="Auto-terisi" />
                </div>
              </div>
              <div className="pb-form-group pb-mb-0">
                <label className="pb-form-label">Kode Pembimbing 1 Baru *</label>
                <div className="pb-input-wrap block-select">
                  <FileBadge className="pb-input-icon" size={16} />
                  <Select
                    options={lecturerOptions} styles={{...customSelectStyles, control: (b, s) => ({ ...customSelectStyles.control(b, s), paddingLeft: '32px'})}}
                    value={formData.kode1} onChange={(val) => handleDosenChange('kode1', val)}
                    isLoading={loadingDosen} isDisabled={loadingDosen || isReadOnlyForm}
                    isClearable placeholder="Pilih Kode Dosen"
                  />
                </div>
              </div>
              <div className="pb-form-group pb-mb-0">
                <label className="pb-form-label">Nama Pembimbing 2 Baru (Opsional)</label>
                <div className="pb-input-wrap">
                  <User className="pb-input-icon" size={16} />
                  <input type="text" value={formData.dosen2} readOnly className="pb-input with-icon" disabled placeholder="Auto-terisi" />
                </div>
              </div>
              <div className="pb-form-group pb-mb-0">
                <label className="pb-form-label">Kode Pembimbing 2 Baru (Opsional)</label>
                <div className="pb-input-wrap block-select">
                  <FileBadge className="pb-input-icon" size={16} />
                  <Select
                    options={lecturerOptions} styles={{...customSelectStyles, control: (b, s) => ({ ...customSelectStyles.control(b, s), paddingLeft: '32px'})}}
                    value={formData.kode2} onChange={(val) => handleDosenChange('kode2', val)}
                    isLoading={loadingDosen} isDisabled={loadingDosen || isReadOnlyForm}
                    isClearable placeholder="Pilih Kode Dosen"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pb-export-action">
            <button
              onClick={handleGenerateTemplateAndSaveDraft}
              disabled={isGenerating || isReadOnlyForm}
              className="pb-btn-export"
            >
              {isGenerating ? <Loader size={16} className="pb-spinner" /> : <Download size={16} />} 
              {isGenerating ? 'Menyiapkan Dokumen...' : 'Export Evidence Formulir'}
            </button>
          </div>
        </section>

        <section className={`pb-form-section ${kategori ? '' : 'disabled'}`}>
          <h2 className="pb-section-title">Upload Dokumen Evidence</h2>
          
          <div className="pb-form-group">
            <p className="pb-upload-desc">
              Unggah Formulir Evidence yang telah diekspor dan ditandatangani oleh pihak terkait.
            </p>
            {kategori?.value === 'Perubahan Judul' && (
              <div className="pb-upload-alert">
                <p>
                  * Khusus untuk Perubahan Judul, wajib melampirkan Evidence Formulir Perubahan Judul dan fotokopi SK Lama. (Gabungkan kedua dokumen tersebut ke dalam 1 file PDF).
                </p>
              </div>
            )}
            {submissionMode === 'patch-revisi' && (
              <p className="pb-upload-hint">
                * Jika catatan revisi tidak mewajibkan ganti dokumen, file ini boleh dikosongkan.
              </p>
            )}
          </div>

          <div className="pb-form-grid">
            <div className="pb-form-group pb-mb-0">
              <label className="pb-form-label">Unggah Dokumen Evidence {submissionMode !== 'patch-revisi' ? '*' : ''}</label>
              <div 
                className={`pb-upload-area ${isDragging ? 'dragging' : ''} ${isReadOnlyForm ? 'disabled' : ''}`} 
                onClick={() => !isReadOnlyForm && fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf, .png, .jpg, .jpeg" />
                <div className="pb-upload-icon-circle">
                  <UploadCloud size={24} color={isDragging ? "#c0182a" : "#64748B"} />
                </div>
                <div className="pb-upload-text">
                  <p><strong>Pilih File</strong> atau Tarik dan Lepaskan di sini</p>
                  <div className="pb-file-type-badges">
                    <span>PDF / PNG / JPG</span>
                    <span>MAX 3MB</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pb-form-group pb-mb-0">
              <label className="pb-form-label">File Terpilih</label>
              <div className="pb-file-status-list">
                {selectedFile && (
                  <div className="pb-status-card success">
                    <div className="pb-status-icon-wrap"><FileText size={16} /></div>
                    <div className="pb-status-info">
                      <div className="pb-status-filename">
                        {selectedFile.name}
                        <span className="pb-label-siap">Siap</span>
                      </div>
                      <div className="pb-status-meta">{selectedFile.size} MB • {selectedFile.type}</div>
                    </div>
                  </div>
                )}
                {fileError && (
                  <div className="pb-status-card error">
                    <div className="pb-status-icon-wrap"><AlertTriangle size={16} /></div>
                    <div className="pb-status-info">
                      <div className="pb-error-title">File Tidak Valid</div>
                      <div className="pb-error-desc">{fileError}</div>
                    </div>
                  </div>
                )}
                {!selectedFile && !fileError && (
                  <div className="pb-empty-state">
                    Belum ada file yang dipilih
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="pb-bottom-actions">
          <button
            className={`pb-btn-submit ${isReadOnlyForm ? 'disabled-gray' : ''}`}
            onClick={handleSubmit}
            disabled={pageStatus === 'submitting' || !kategori || isReadOnlyForm}
          >
            {pageStatus === 'submitting' ? (
              <><Loader size={14} className="pb-spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Mengirim Pengajuan...</>
            ) : isReadOnlyForm ? (
              'Batas Waktu Perbaikan Habis'
            ) : submissionMode === 'patch-revisi' ? (
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
    <div className={`pb-layout ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div id="main-content">
        <header className="topbar">
          <button className="topbar-toggle" onClick={handleToggleSidebar}>
            <Menu size={20} color="#fff" />
          </button>
          <div className="topbar-brand text-white" style={{ fontSize: '15px' }}>Pembaruan SK Tugas Akhir</div>
        </header>
        <main className="pb-page-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PembaruanSK;