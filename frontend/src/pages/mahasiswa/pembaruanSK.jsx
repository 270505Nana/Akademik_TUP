import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Info, MessageCircle, User, Phone, GraduationCap, UploadCloud, FileText, AlertTriangle, FileBadge, CheckCircle, Loader, Clock, AlertCircle, Menu, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

// 1. TAMBAHKAN IMPORT getAllSktaRequests
import { getLecturers, getSKTARequest, getAllSktaRequests, submitSKTARequest, submitFinalSKTARequest } from '../../service/api';

// 2. IMPORT LOGO DARI ASSETS AGAR BISA DIBACA OLEH HTML2PDF
import LogoTelkom from '../../assets/logo-telkom.png';

import { useAuth }    from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import { determineSkStatus, STATUS_SK } from '../../components/common/Skstatushelper';
import CustomAlert from '../../components/common/CustomAlert';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../../components/mahasiswa/pengajuanSK/pengajuanSK.css';

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
    <Loader size={32} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
    <p style={{ fontSize: 12, color: '#6B7280' }}>Memuat data...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const SkStatusBanner = ({ status, permohonan }) => {
  const configs = {
    [STATUS_SK.DALAM_PROSES]: {
      bg: '#EFF6FF', border: '#BFDBFE', icon: <Clock size={16} color="#2563EB" />,
      title: 'Pengajuan Perubahan SK Sedang Diproses',
      desc: 'Permohonan perubahan SK Tugas Akhir kamu sedang dalam antrian verifikasi oleh tim akademik. Proses maksimal 3×24 jam kerja.',
      badgeBg: '#DBEAFE', badgeColor: '#1D4ED8', badgeText: 'Dalam Proses',
    },
    [STATUS_SK.BELUM_TERBIT]: {
      bg: '#FFFBEB', border: '#FDE68A', icon: <AlertCircle size={16} color="#D97706" />,
      title: 'Perubahan SK Memerlukan Perbaikan Dokumen',
      desc: permohonan?.message
        ? `Tim akademik memberikan catatan: "${permohonan.message}". Silakan perbaiki pengajuan kamu di bawah ini.`
        : 'Pengajuan perubahan SK kamu perlu diperbaiki. Silakan perbarui data melalui formulir di bawah ini.',
      badgeBg: '#FEF3C7', badgeColor: '#92400E', badgeText: 'Perlu Perbaikan',
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
        // Fetch pengajuan terakhir (Bisa jadi ini adalah draft perubahan yang sedang aktif)
        const latest = await getSKTARequest(mahasiswaId);

        if (!latest) {
          setSubmitError({ title: 'Akses Ditolak', message: 'Kamu belum memiliki SK Tugas Akhir yang aktif atau diterbitkan. Silakan ajukan Permohonan SK baru terlebih dahulu.' });
          setPageStatus('blocked');
          return;
        }

        // 3. LOGIKA BARU: Cari SK Asli/Utama untuk mengisi "Data Lama"
        let activeSk = latest; 
        try {
          const allReq = await getAllSktaRequests({ mahasiswaId, limit: 100 });
          if (Array.isArray(allReq) && allReq.length > 0) {
            // Sort berdasarkan waktu dibuat (terbaru di atas)
            const sortedReq = allReq.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            // Cari SK yang BUKAN draft ini, DAN berstatus SUDAH_TERBIT atau Permohonan Baru
            const foundActive = sortedReq.find(req => 
              req.id !== latest.id && 
              (determineSkStatus(req) === STATUS_SK.SUDAH_TERBIT || req.category === 'Permohonan Baru' || req.category === 'Perpanjangan SK')
            );
            if (foundActive) {
              activeSk = foundActive; // Ini adalah Data Lama yang sebenarnya!
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
              title: 'Pembaruan SK Telah Kadaluarsa', 
              message: 'SK Pembaruan kamu telah kadaluarsa. Sistem memprioritaskan perpanjangan masa berlaku. Silakan lakukan Perpanjangan SK terlebih dahulu di menu Permohonan Penerbitan SK.' 
            });
            setPageStatus('blocked');
            return;
          } else if (status === STATUS_SK.SUDAH_TERBIT) {
            setSubmissionMode('create-baru');
          }
        }

        // 4. MENGISI DATA LAMA BERDASARKAN activeSk (SK Utama)
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

        // 5. MENGISI FORM DATA BARU BERDASARKAN latest (Draft/Revisi)
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

  const handleDosenChange = useCallback((field, val) => {
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
  }, []);

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
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleGenerateTemplateAndSaveDraft = async () => {
    setSubmitError(null);
    
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

    // 6. LAYOUT HTML BORDER LENGKAP & IMPORT LOGO
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
        
        <!-- HEADER KOP SURAT -->
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

        <!-- ISI FORMULIR -->
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
        
        <!-- FOOTER CATATAN -->
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
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#FEF2F2', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <AlertTriangle size={32} color="#DC2626" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            {submitError?.title || 'Akses Ditolak'}
          </h2>
          <p style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
            {submitError?.message || 'Kamu tidak dapat mengakses menu Pembaruan SK saat ini.'}
          </p>
          <button
            onClick={() => navigate('/mahasiswa/pengajuan-sk')}
            style={{
              padding: '10px 24px', borderRadius: 9999, fontSize: 12,
              fontWeight: 700, background: '#C0182A', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Ke Menu Permohonan SK
          </button>
        </div>
      );
    }

    if (pageStatus === 'revision_sent' || pageStatus === 'success') {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: pageStatus === 'success' ? '#D1FAE5' : '#DBEAFE', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            {pageStatus === 'success' ? <CheckCircle size={32} color="#10B981" /> : <Clock size={32} color="#2563EB" />}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            {pageStatus === 'success' ? 'Pengajuan Perubahan SK Berhasil Dikirim!' : 'Revisi Perubahan SK Berhasil Dikirim!'}
          </h2>
          <p style={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
            Permohonan kamu sudah kami terima dan masuk ke dalam antrian verifikasi tim akademik. Proses membutuhkan waktu maksimal 3×24 jam kerja. Pantau status pengajuan di dashboard.
          </p>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            style={{
              padding: '10px 24px', borderRadius: 9999, fontSize: 12,
              fontWeight: 700, background: '#C0182A', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            Kembali ke Dashboard
          </button>
        </div>
      );
    }

    if (pageStatus === 'status_only') {
      return (
        <div style={{ padding: '24px 16px', maxWidth: 600, margin: '0 auto' }}>
          <SkStatusBanner status={skStatus} permohonan={permohonan} />
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/mahasiswa/dashboard')}
              style={{ padding: '8px 24px', borderRadius: 9999, fontSize: 11.5, fontWeight: 700, background: '#C0182A', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="sk-content-wrapper" style={{ padding: '0 8px' }}>
        
        {submissionMode === 'patch-revisi' && (
          <SkStatusBanner status={STATUS_SK.BELUM_TERBIT} permohonan={permohonan} />
        )}
        <div className="info-box-red" style={{ padding: '16px 20px', borderRadius: '10px', marginBottom: '32px' }}>
          <div className="info-content" style={{ display: 'flex', gap: '12px' }}>
            <div className="info-icon-circle" style={{ width: '32px', height: '32px', padding: '6px' }}>
              <Info size={20} />
            </div>
            <div className="info-text">
              <h4 style={{ fontSize: '13.5px', color: '#B91C1C', marginBottom: '10px', fontWeight: 800 }}>
                Pembaruan / Perubahan SK Tugas Akhir
              </h4>
              <p style={{ fontSize: '11px', marginBottom: '6px' }}><strong>Halaman ini dikhususkan bagi mahasiswa yang ingin mengajukan perubahan data pada SK TA yang sudah terbit.</strong></p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '16px', marginTop: '8px', marginBottom: '8px', fontSize: '11px' }}>
                <li style={{ marginBottom: '6px' }}>Pilih kategori perubahan sesuai dengan kebutuhan.</li>
                <li style={{ marginBottom: '6px' }}>Lengkapi form perubahan. Setelah selesai, klik tombol <strong>Export Evidence Formulir</strong> untuk menyimpan draft secara otomatis.</li>
                <li style={{ marginBottom: '6px' }}>Mintalah persetujuan (Tanda Tangan) pihak terkait pada formulir yang telah diunduh, lalu scan dan unggah kembali pada kolom di bawah untuk memproses pengajuan.</li>
              </ul>
              <p style={{ fontSize: '11px' }}>Pengajuan perubahan SK diproses dalam waktu maksimal 3×24 jam sesuai antrian.</p>
            </div>
          </div>
        </div>

        {submitError && (
          <div ref={errorRef}>
            <CustomAlert type="error" title={submitError.title} message={<span style={{ whiteSpace: 'pre-line' }}>{submitError.message}</span>} style={{ margin: '0 0 20px 0' }} />
          </div>
        )}

        <section className="form-section" style={{ marginBottom: '32px', padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #E9EDF5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px', color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Kategori Perubahan
            {draftId && (
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, background: '#DCFCE7', padding: '4px 10px', borderRadius: '20px' }}>
                <CheckCircle size={12} /> Draft otomatis tersimpan
              </span>
            )}
          </h2>
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Kategori Perubahan SK *</label>
            <Select
              placeholder="Pilih Kategori Perubahan"
              options={categoryOptions}
              value={kategori}
              onChange={(val) => { setKategori(val); setDraftId(null); }}
              isDisabled={submissionMode === 'patch-revisi' || draftId != null}
              styles={customSelectStyles}
            />
            {(submissionMode === 'patch-revisi' || draftId) && (
              <p className="input-hint" style={{ fontSize: '10px', marginTop: '6px', color: '#D97706' }}>Kategori terkunci karena sudah masuk ke mode draft/perbaikan.</p>
            )}
          </div>

          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', color: '#111827' }}>Identitas & Data SK Lama</h2>
          <div className="form-grid" style={{ gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#4B5563' }}>NIM</label>
              <div className="input-with-icon">
                <input type="text" value={nimDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px', height: '40px', color: '#6B7280' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#4B5563' }}>Nama</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} color="#9CA3AF" />
                <input type="text" value={namaDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px', color: '#6B7280' }} />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#4B5563' }}>Judul Lama (Bahasa Indonesia)</label>
            <div className="input-with-icon">
              <textarea value={oldData.judulIndo} readOnly style={{ fontSize: '12.5px', padding: '10px 12px', minHeight: '50px', backgroundColor: '#F3F4F6', cursor: 'not-allowed', color: '#6B7280' }} />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#4B5563' }}>Judul Lama (Bahasa Inggris)</label>
            <div className="input-with-icon">
              <textarea value={oldData.judulInggris} readOnly style={{ fontSize: '12.5px', padding: '10px 12px', minHeight: '50px', backgroundColor: '#F3F4F6', cursor: 'not-allowed', color: '#6B7280' }} />
            </div>
          </div>

          <div className="form-grid" style={{ gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#4B5563' }}>Pembimbing Lama 1</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} color="#9CA3AF" />
                <input type="text" value={oldData.dosen1} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px', color: '#6B7280' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#4B5563' }}>Pembimbing Lama 2 (Opsional)</label>
              <div className="input-with-icon">
                <User className="field-icon" size={16} color="#9CA3AF" />
                <input type="text" value={oldData.dosen2} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px', color: '#6B7280' }} />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Form Perubahan Data Baru */}
        <section className="form-section" style={{ marginBottom: '32px', padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #E9EDF5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', opacity: kategori ? 1 : 0.5, pointerEvents: kategori ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px', color: '#111827' }}>Formulir Data Perubahan</h2>
          {!kategori && <p style={{ fontSize: '11px', color: '#C0182A', marginBottom: '16px', fontWeight: 600 }}>Pilih kategori perubahan di atas untuk mengaktifkan form.</p>}

          {isGantiJudul && (
            <>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Judul Baru (Bahasa Indonesia) *</label>
                <div className="input-with-icon">
                  <textarea
                    value={formData.judulIndo}
                    onChange={(e) => { setFormData(prev => ({ ...prev, judulIndo: e.target.value })); setSubmitError(null); }}
                    style={{ fontSize: '12.5px', padding: '10px 12px', minHeight: '60px', borderColor: '#E5E7EB' }}
                    placeholder="Masukkan judul tugas akhir baru dalam Bahasa Indonesia"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Judul Baru (Bahasa Inggris) *</label>
                <div className="input-with-icon">
                  <textarea
                    value={formData.judulInggris}
                    onChange={(e) => { setFormData(prev => ({ ...prev, judulInggris: e.target.value })); setSubmitError(null); }}
                    style={{ fontSize: '12.5px', padding: '10px 12px', minHeight: '60px', borderColor: '#E5E7EB' }}
                    placeholder="Enter your new thesis title in English"
                  />
                </div>
              </div>
            </>
          )}

          {isGantiDosen && (
            <div className="form-grid" style={{ gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Nama Pembimbing 1 Baru *</label>
                <div className="input-with-icon">
                  <User className="field-icon" size={16} color="#9CA3AF" />
                  <input type="text" value={formData.dosen1} readOnly style={{ backgroundColor: '#F3F4F6', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px', color: '#6B7280' }} placeholder="Auto-terisi" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Kode Pembimbing 1 Baru *</label>
                <div className="input-with-icon block-select">
                  <FileBadge className="field-icon" size={16} style={{ zIndex: 10 }} color="#9CA3AF" />
                  <Select
                    options={lecturerOptions} styles={{...customSelectStyles, control: (b, s) => ({ ...customSelectStyles.control(b, s), paddingLeft: '32px'})}}
                    value={formData.kode1} onChange={(val) => handleDosenChange('kode1', val)}
                    isLoading={loadingDosen} isDisabled={loadingDosen}
                    isClearable className="w-full" placeholder="Pilih Kode Dosen"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Nama Pembimbing 2 Baru (Opsional)</label>
                <div className="input-with-icon">
                  <User className="field-icon" size={16} color="#9CA3AF" />
                  <input type="text" value={formData.dosen2} readOnly style={{ backgroundColor: '#F3F4F6', fontSize: '12.5px', padding: '8px 12px 8px 36px', height: '40px', color: '#6B7280' }} placeholder="Auto-terisi" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Kode Pembimbing 2 Baru (Opsional)</label>
                <div className="input-with-icon block-select">
                  <FileBadge className="field-icon" size={16} style={{ zIndex: 10 }} color="#9CA3AF" />
                  <Select
                    options={lecturerOptions} styles={{...customSelectStyles, control: (b, s) => ({ ...customSelectStyles.control(b, s), paddingLeft: '32px'})}}
                    value={formData.kode2} onChange={(val) => handleDosenChange('kode2', val)}
                    isLoading={loadingDosen} isDisabled={loadingDosen}
                    isClearable className="w-full" placeholder="Pilih Kode Dosen"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
            <button
              onClick={handleGenerateTemplateAndSaveDraft}
              disabled={isGenerating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', fontSize: '12px', fontWeight: 700,
                background: isGenerating ? '#9CA3AF' : '#10B981', color: '#fff', border: 'none', borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
            >
              {isGenerating ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />} 
              {isGenerating ? 'Menyiapkan Dokumen...' : 'Export Evidence Formulir'}
            </button>
          </div>
        </section>

        {/* SECTION 3: Upload Dokumen */}
        <section className="form-section" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #E9EDF5', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', opacity: kategori ? 1 : 0.5, pointerEvents: kategori ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
          <h2 className="section-title" style={{ fontSize: '14px', marginBottom: '16px', color: '#111827' }}>Upload Dokumen Evidence</h2>
          
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11.5, color: '#4B5563', marginBottom: 6 }}>
              Unggah Formulir Evidence yang telah diekspor dan ditandatangani oleh pihak terkait.
            </p>
            {kategori?.value === 'Perubahan Judul' && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', marginTop: '8px' }}>
                <p style={{ fontSize: 11, color: '#B91C1C', margin: 0, fontWeight: 600 }}>
                  * Khusus untuk Perubahan Judul, wajib melampirkan Evidence Formulir Perubahan Judul dan fotokopi SK Lama. (Gabungkan kedua dokumen tersebut ke dalam 1 file PDF).
                </p>
              </div>
            )}
            {submissionMode === 'patch-revisi' && (
              <p style={{ fontSize: 10.5, color: '#D97706', marginTop: 8, fontStyle: 'italic', fontWeight: 600 }}>
                * Jika catatan revisi tidak mewajibkan ganti dokumen, file ini boleh dikosongkan.
              </p>
            )}
          </div>

          <div className="form-grid" style={{ gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>Unggah Dokumen Evidence {submissionMode !== 'patch-revisi' ? '*' : ''}</label>
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`} 
                onClick={() => fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ padding: '24px 16px', minHeight: '120px', border: '1.5px dashed #CBD5E1', borderRadius: '8px', background: '#F8FAFC', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
              >
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf, .png, .jpg, .jpeg" />
                <div className="upload-icon-circle" style={{ width: '40px', height: '40px', marginBottom: '10px', background: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <UploadCloud size={24} color={isDragging ? "#c0182a" : "#64748B"} />
                </div>
                <div className="upload-text">
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 6px' }}><strong>Pilih File</strong> atau Tarik dan Lepaskan di sini</p>
                  <div className="file-type-badges" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <span style={{ fontSize: '9px', padding: '2px 6px', background: '#E2E8F0', borderRadius: '4px', color: '#475569', fontWeight: 700 }}>PDF / PNG / JPG</span>
                    <span style={{ fontSize: '9px', padding: '2px 6px', background: '#E2E8F0', borderRadius: '4px', color: '#475569', fontWeight: 700 }}>MAX 3MB</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11.5px', marginBottom: '6px', color: '#374151', fontWeight: 600 }}>File Terpilih</label>
              <div className="file-status-list">
                {selectedFile && (
                  <div className="status-card success" style={{ padding: '12px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="status-icon-wrap" style={{ background: '#10B981', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><FileText size={16} /></div>
                    <div className="status-info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="status-filename" style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {selectedFile.name}
                        <span className="label-siap" style={{ fontSize: '9px', padding: '2px 6px', background: '#DCFCE7', color: '#166534', borderRadius: '9999px', flexShrink: 0 }}>Siap</span>
                      </div>
                      <div className="status-meta" style={{ fontSize: '10.5px', color: '#6B7280', marginTop: '2px' }}>{selectedFile.size} MB • {selectedFile.type}</div>
                    </div>
                  </div>
                )}
                {fileError && (
                  <div className="status-card error" style={{ padding: '12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="status-icon-wrap" style={{ background: '#EF4444', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><AlertTriangle size={16} /></div>
                    <div className="status-info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="error-title" style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>File Tidak Valid</div>
                      <div className="error-desc" style={{ fontSize: '10.5px', color: '#B91C1C', marginTop: '2px' }}>{fileError}</div>
                    </div>
                  </div>
                )}
                {!selectedFile && !fileError && (
                  <div className="empty-file-state" style={{ padding: '16px', border: '1px dashed #E5E7EB', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '11px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Belum ada file yang dipilih
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E9EDF5' }}>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={pageStatus === 'submitting' || !kategori}
            style={{
              ...(pageStatus === 'submitting' || !kategori ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
              padding: '12px 32px', fontSize: '13px', borderRadius: '8px', background: '#C0182A', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.2s'
            }}
          >
            {pageStatus === 'submitting' ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} /> Mengirim Pengajuan...</>
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
          <div className="topbar-brand text-white" style={{ fontSize: '15px' }}>Pembaruan SK Tugas Akhir</div>
        </header>
        <main className="page-body px-4 py-6 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default PembaruanSK;