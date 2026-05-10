import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {ArrowLeft, Info, MessageCircle, User, Phone,GraduationCap, UploadCloud, FileText, AlertTriangle,FileBadge, CheckCircle, Loader, Clock, RefreshCw, AlertCircle} from 'lucide-react';
import SimtaLogo from "../../assets/logo-simta.png";
import Telulogo  from "../../assets/logo-telkom.png";
import { useAuth }    from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';
import {getLecturers,getSKTARequest,getSKTAResponse,submitSKTARequest,resubmitSKTARequest,} from '../../service/api';
import '../../components/sk/pengajuanSK.css';

// status SK = dalam proses masih null semua responenya
// revisi = ada message + udh respon tapi file SK belum ada
// expired
// sudah terbit = terbit aja
const getSkStatus = (sktaResponse) => {
  if (!sktaResponse) return 'dalam_proses';

  const { expDate } = sktaResponse;
  const sktaFile = sktaResponse.sktaFile ?? sktaResponse.file ?? null;
  if (!sktaFile) return 'revisi';

  if (expDate) {
    const exp = new Date(expDate);
    if (exp < new Date()) return 'expired';
  }
  return 'sudah_terbit';
};

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
    <Loader size={32} color="#C0182A" style={{ animation: 'spin 1s linear infinite' }} />
    <p style={{ fontSize: 13, color: '#6B7280' }}>Memuat data...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const SkStatusBanner = ({ status, sktaResponse, requestData }) => {
  const configs = {
    dalam_proses: {
      bg: '#EFF6FF', border: '#BFDBFE', icon: <Clock size={20} color="#2563EB" />,
      title: 'Pengajuan SK Sedang Diproses',
      desc: 'Permohonan penerbitan SK Pembimbing Tugas Akhir kamu sedang dalam antrian verifikasi oleh tim akademik. Proses maksimal 3×24 jam kerja. Mohon ditunggu dan pantau status di dashboard.',
      badgeBg: '#DBEAFE', badgeColor: '#1D4ED8', badgeText: 'Dalam Proses',
    },
    revisi: {
      bg: '#FFFBEB', border: '#FDE68A', icon: <AlertCircle size={20} color="#D97706" />,
      title: 'Pengajuan SK Memerlukan Perbaikan Dokumen',
      desc: sktaResponse?.message
        ? `Tim akademik memberikan catatan: "${sktaResponse.message}". Silakan perbaiki pengajuan kamu melalui formulir di bawah ini dan kirim ulang.`

        : 'Pengajuan SK kamu perlu diperbaiki. Tim akademik telah meninjau dokumenmu dan meminta perbaikan. Silakan perbarui data pengajuan melalui formulir di bawah ini, lalu kirim ulang.',
      badgeBg: '#FEF3C7', badgeColor: '#92400E', badgeText: 'Perlu Perbaikan',
    },
    sudah_terbit: {
      bg: '#F0FDF4', border: '#BBF7D0', icon: <CheckCircle size={20} color="#16A34A" />,
      title: 'SK Pembimbing TA Sudah Terbit',
      desc: 'Selamat! SK Pembimbing Tugas Akhir kamu sudah diterbitkan. Kamu dapat mengunduh SK melalui tombol di bawah atau melalui menu dashboard.',
      badgeBg: '#DCFCE7', badgeColor: '#15803D', badgeText: 'Sudah Terbit',
    },
    expired: {
      bg: '#F5F3FF', border: '#DDD6FE', icon: <RefreshCw size={20} color="#7C3AED" />,
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
      borderRadius: 12, padding: '20px 24px', marginBottom: 32,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>{cfg.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{cfg.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 10px',
              borderRadius: 9999, background: cfg.badgeBg, color: cfg.badgeColor,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {cfg.badgeText}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, margin: 0 }}>
            {cfg.desc}
          </p>
          {requestData && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 8, fontSize: 12, color: '#6B7280' }}>
              <div><strong>Judul (ID):</strong> {requestData.proposalTitleId}</div>
              <div style={{ marginTop: 4 }}><strong>Judul (EN):</strong> {requestData.proposalTitleEn}</div>
              {sktaResponse?.expDate && (
                <div style={{ marginTop: 4 }}>
                  <strong>Expired:</strong> {new Date(sktaResponse.expDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          )}
          {status === 'sudah_terbit' && (
            <button
              style={{
                marginTop: 14, padding: '8px 20px', borderRadius: 9999,
                fontSize: 12, fontWeight: 700, background: '#16A34A',
                color: '#fff', border: 'none', cursor: 'pointer',
              }}
              onClick={() => window.open(sktaResponse?.sktaFile, '_blank')}
            >
              Unduh SK
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

const validate = ({ judulIndo, judulInggris, kode1, kode2, actualFile, isResubmit }) => {
  if (!judulIndo.trim())   return 'Judul Tugas Akhir (Bahasa Indonesia) wajib diisi.';
  if (!judulInggris.trim()) return 'Judul Tugas Akhir (Bahasa Inggris) wajib diisi.';
  if (!kode1)               return 'Dosen Pembimbing 1 wajib dipilih.';
  if (!kode2)               return 'Dosen Pembimbing 2 wajib dipilih.';
  if (kode1.value === kode2.value) return 'Dosen Pembimbing 1 dan 2 tidak boleh sama.';
  if (!isResubmit && !actualFile) return 'Dokumen evidence wajib diunggah.';
  return null;
};

const PengajuanSK = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user }    = useAuth();
  const { student, isStudentLoading, sktaRequestId, updateSktaRequestId } = useStudent();
  const [pageStatus, setPageStatus] = useState('loading');
  const [requestData,   setRequestData]   = useState(null); 
  const [sktaResponse,  setSktaResponse]  = useState(null); 
  const [skStatus,      setSkStatus]      = useState(null); 
  const [isExpired,     setIsExpired]     = useState(false);
  const [lecturerOptions, setLecturerOptions] = useState([]);
  const [loadingDosen,    setLoadingDosen]    = useState(true);
  const [formData, setFormData] = useState({
    judulIndo: '', judulInggris: '',
    kode1: null, dosen1: '',
    kode2: null, dosen2: '',
    kelompok: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [actualFile,   setActualFile]   = useState(null);
  const [fileError,    setFileError]    = useState(null);
  const [submitError, setSubmitError] = useState(null);
  useEffect(() => {
    const fetchDosen = async () => {
      try {
        setLoadingDosen(true);
        const data = await getLecturers();
        const options = data.map((d) => ({
          value:           d.id,
          label:           `${d.lecturerCode ?? d.kode} — ${d.name ?? d.nama}`,
          nama:            d.name ?? d.nama,
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
      const studentId = student?.studentId;
      if (!studentId) {
        navigate('/lengkapi-data', { replace: true });
        return;
      }

      try {
        const existingRequest = await getSKTARequest(studentId);

        if (!existingRequest) {
          setPageStatus('form');
          return;
        }

        setRequestData(existingRequest);
        const reqId = existingRequest.id;
        if (!sktaRequestId) {
          updateSktaRequestId(reqId);
        }
        const response = await getSKTAResponse(reqId);
        setSktaResponse(response);

        const status = getSkStatus(response);
        setSkStatus(status);

        if (status === 'revisi' || status === 'expired') {
          setIsExpired(status === 'expired');
          setFormData(prev => ({
            ...prev,
            judulIndo:    existingRequest.proposalTitleId ?? '',
            judulInggris: existingRequest.proposalTitleEn ?? '',
          }));
          setPageStatus('form');
        } else {
          setPageStatus('status_only');
        }

      } catch (err) {
        console.error('Gagal cek status SKTA:', err);
        setPageStatus('form');
      }
    };

    if (!loadingDosen && !isStudentLoading) {
      checkSKTAStatus();
    }
  }, [loadingDosen, isStudentLoading, student, navigate]);

  const namaDisplay  = student?.namaLengkap        || user?.username || '';
  const nimDisplay   = student?.nim                || '';
  const noHpDisplay  = user?.phone                 || '';
  const prodiDisplay = student?.studyProgramNama   || '';

  const handleDosenChange = useCallback((field, val) => {
    const namaField = field === 'kode1' ? 'dosen1' : 'dosen2';

    setFormData(prev => {
      const updated = { ...prev, [field]: val, [namaField]: val?.nama || '' };

      if (field === 'kode1') {
        if (val?.researchGroupId) {
          const matched = kelompokKeilmuan.find(
            (kk) => kk.researchGroupId === val.researchGroupId
          );
          updated.kelompok = matched?.label || '';
        } else {
          updated.kelompok = '';
        }
      }

      return updated;
    });
    setSubmitError(null);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.');
      setSelectedFile(null); setActualFile(null);
      return;
    }
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(`Ukuran file melebihi batas 3MB. Ukuran saat ini: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      setSelectedFile(null); setActualFile(null);
    } else {
      setFileError(null);
      setActualFile(file);
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1),
        type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      });
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const validationError = validate({
      judulIndo:    formData.judulIndo,
      judulInggris: formData.judulInggris,
      kode1:        formData.kode1,
      kode2:        formData.kode2,
      actualFile,
      isResubmit:   isExpired,
    });
    if (validationError) { setSubmitError(validationError); return; }

    const studentId = student?.studentId;
    if (!studentId) {
      setSubmitError('Data mahasiswa tidak ditemukan. Silakan lengkapi profil terlebih dahulu.');
      return;
    }

    setPageStatus('submitting');
    try {
      if ((isExpired || skStatus === 'revisi') && sktaRequestId) {
        await resubmitSKTARequest({
          sktaRequestId,
          proposalTitleId:    formData.judulIndo.trim(),
          proposalTitleEn:    formData.judulInggris.trim(),
          dosenPembimbing1Id: formData.kode1.value,
          dosenPembimbing2Id: formData.kode2.value,
          evidence:           actualFile,
        });
      } else {
        const result = await submitSKTARequest({
          proposalTitleId:    formData.judulIndo.trim(),
          proposalTitleEn:    formData.judulInggris.trim(),
          studentId,
          dosenPembimbing1Id: formData.kode1.value,
          dosenPembimbing2Id: formData.kode2.value,
          evidence:           actualFile,
        });
        const newSktaRequestId = result?.data?.id;
        if (newSktaRequestId) updateSktaRequestId(newSktaRequestId);
      }
      setPageStatus('success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim pengajuan. Silakan coba lagi.';
      setSubmitError(msg);
      setPageStatus('form');
    }
  };
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      paddingLeft: '40px',
      backgroundColor: '#F9FAFB',
      border: `1.5px solid ${state.isFocused ? '#C0182A' : '#E5E7EB'}`,
      borderRadius: '6px',
      fontSize: '14px',
      minHeight: '45px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(192,24,42,0.1)' : 'none',
      '&:hover': { borderColor: '#C0182A' },
    }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    option: (base, state) => ({
      ...base,
      fontSize: '13px',
      backgroundColor: state.isSelected ? '#C0182A' : state.isFocused ? '#FEF2F2' : '#fff',
      color: state.isSelected ? '#fff' : '#374151',
    }),
  };


  if (pageStatus === 'loading') {
    return (
      <div className="sk-page-container">
        <Header onBack={() => navigate('/mahasiswa/dashboard')} />
        <PageLoader />
      </div>
    );
  }

  if (pageStatus === 'success') {
    return (
      <div className="sk-page-container">
        <Header onBack={() => navigate('/mahasiswa/dashboard')} />
        <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#D1FAE5', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <CheckCircle size={40} color="#10B981" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
            {isExpired ? 'Pembaruan SK Berhasil Dikirim!' : 'Pengajuan SK Berhasil Dikirim!'}
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, marginBottom: 32 }}>
            {isExpired
              ? 'Permohonan pembaruan SK Pembimbing Tugas Akhir kamu sudah kami terima. Proses verifikasi membutuhkan waktu maksimal 3×24 jam kerja.'
              : 'Permohonan penerbitan SK Pembimbing Tugas Akhir kamu sudah kami terima. Proses verifikasi membutuhkan waktu maksimal 3×24 jam kerja. Pantau status pengajuan di dashboard.'}
          </p>
          <button
            onClick={() => navigate('/mahasiswa/dashboard')}
            style={{
              padding: '12px 32px', borderRadius: 9999, fontSize: 14,
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
  if (pageStatus === 'status_only') {
    return (
      <div className="sk-page-container">
        <Header onBack={() => navigate('/mahasiswa/dashboard')} />
        <div style={{ padding: '40px 24px', maxWidth: 680, margin: '0 auto' }}>
          <SkStatusBanner
            status={skStatus}
            sktaResponse={sktaResponse}
            requestData={requestData}
          />
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/mahasiswa/dashboard')}
              style={{
                padding: '10px 28px', borderRadius: 9999, fontSize: 13,
                fontWeight: 700, background: '#C0182A', color: '#fff',
                border: 'none', cursor: 'pointer',
              }}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sk-page-container">
      <Header onBack={() => navigate('/mahasiswa/dashboard')} />

      <div className="sk-content-wrapper">

        {isExpired && (
          <SkStatusBanner
            status="expired"
            sktaResponse={sktaResponse}
            requestData={requestData}
          />
        )}

        <div className="info-box-red">
          <div className="info-content" style={{ display: 'flex', gap: '16px' }}>
            <div className="info-icon-circle"><Info size={24} /></div>
            <div className="info-text">
              <h4 style={{ fontSize: '16px', color: '#B91C1C', marginBottom: '12px', fontWeight: 800 }}>
                {isExpired ? 'Pembaruan SK Pembimbing Tugas Akhir' : 'Permohonan Penerbitan SK Pembimbing Tugas Akhir'}
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
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px', marginBottom: '10px' }}>
                <li style={{ marginBottom: '8px' }}>KK Electronics and Telecommunications Science — Bu Solichah Larasati: 085726234838</li>
                <li style={{ marginBottom: '8px' }}>KK Industrial Systems Engineering — Pak Alza Yudha: 085200330027</li>
                <li style={{ marginBottom: '8px' }}>KK Applied Artificial Intelligence — Bu Paradise: 082243368605</li>
                <li style={{ marginBottom: '8px' }}>KK Media, Design and Creative Innovation — Bu Agatha: 081331379241</li>
                <li style={{ marginBottom: '8px' }}>KK Cyber Security, IOT, and Cloud System — Pak Eko Fajar Cahyadi: 085132323346</li>
                <li style={{ marginBottom: '8px' }}>KK Data Science and Optimization — Pak Andi Prademon Yunus: 08114091048</li>
                <li style={{ marginBottom: '8px' }}>KK Bioengineering, Food Technology and Advance Material — Bu Nur Afifah Zen: 081227684018</li>
                <li style={{ marginBottom: '8px' }}>KK Information System, Digital Business & Data Driven Solution — Bu Rona Nisa Sofia Amriza: 085878447414</li>
                <li>KK Software Engineering and Multimedia — Pak Arif Amrulloh: 08567424313</li>
              </ul>
              <p>Pengajuan penerbitan SK diproses dalam waktu maksimal 3×24 jam sesuai antrian</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
            <div className="contact-badge" onClick={() => window.open('https://wa.me/6285117001281', '_blank')}>
              <MessageCircle size={14} /> Contact Person : Helpdesk Layanan Sidang-Yudisium TUP
            </div>
          </div>
        </div>

        <div className="sk-title-wrapper" style={{ margin: '40px 0 50px 0' }}>
          <h1 className="sk-main-title" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isExpired ? 'Pembaruan SK' : skStatus === 'revisi' ? 'Perbaikan Pengajuan SK' : 'Permohonan'}
            <span>Penerbitan SK Pembimbing Tugas Akhir</span>
          </h1>
        </div>

        {submitError && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 24, fontSize: 13, color: '#B91C1C',
          }}>
            <AlertTriangle size={16} />
            {submitError}
          </div>
        )}

        <section className="form-section" style={{ marginBottom: '60px' }}>
          <h2 className="section-title">Identitas & Program Studi</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Nama</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input type="text" value={namaDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed' }} />
              </div>
              <p className="input-hint">Nama diambil otomatis dari data profil kamu.</p>
            </div>
            <div className="form-group">
              <label>NIM (Nomor Induk Mahasiswa) *</label>
              <div className="input-with-icon">
                <input type="text" value={nimDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed' }} />
              </div>
              <p className="input-hint">NIM terverifikasi otomatis dari sistem.</p>
            </div>
            <div className="form-group">
              <label>Nomor HP / WhatsApp Aktif *</label>
              <div className="input-with-icon">
                <Phone className="field-icon" size={18} />
                <input type="text" value={noHpDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed' }} placeholder="Nomor HP dari profil akun" />
              </div>
              <p className="input-hint">Nomor HP terverifikasi otomatis dari akun.</p>
            </div>
            <div className="form-group">
              <label>Program Studi</label>
              <div className="input-with-icon">
                <GraduationCap className="field-icon" size={18} />
                <input type="text" value={prodiDisplay} readOnly style={{ backgroundColor: '#F3F4F6', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>
        </section>

        {/*  SECTION 2: Informasi TA  */}
        <section className="form-section">
          <h2 className="section-title">Informasi Tugas Akhir</h2>

          <div className="form-group">
            <label>Judul Tugas Akhir (Bahasa Indonesia) *</label>
            <div className="input-with-icon">
              <textarea
                placeholder="Masukkan judul tugas akhir dalam Bahasa Indonesia"
                value={formData.judulIndo}
                onChange={(e) => { setFormData(prev => ({ ...prev, judulIndo: e.target.value })); setSubmitError(null); }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Judul Tugas Akhir (Bahasa Inggris) *</label>
            <div className="input-with-icon">
              <textarea
                placeholder="Enter your thesis/final project title in English"
                value={formData.judulInggris}
                onChange={(e) => { setFormData(prev => ({ ...prev, judulInggris: e.target.value })); setSubmitError(null); }}
              />
            </div>
            <p className="input-hint">Pastikan judul sesuai dengan yang tertera di sistem iGracias.</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Nama Dosen Pembimbing 1 *</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input type="text" placeholder="Auto-terisi setelah pilih kode dosen" value={formData.dosen1} readOnly style={{ backgroundColor: '#F3F4F6' }} />
              </div>
            </div>
            <div className="form-group">
              <label>Kode Dosen Pembimbing 1 *</label>
              <div className="input-with-icon block-select">
                <FileBadge className="field-icon" size={18} style={{ zIndex: 10 }} />
                <Select
                  placeholder={loadingDosen ? "Memuat data dosen..." : "Pilih Kode Dosen 1"}
                  options={lecturerOptions} styles={customSelectStyles}
                  value={formData.kode1} onChange={(val) => handleDosenChange('kode1', val)}
                  isLoading={loadingDosen} isDisabled={loadingDosen}
                  isClearable noOptionsMessage={() => "Dosen tidak ditemukan"} className="w-full"
                />
              </div>
              <p className="input-hint">Pilih dari dropdown → nama akan terisi otomatis.</p>
            </div>
            <div className="form-group">
              <label>Nama Dosen Pembimbing 2 *</label>
              <div className="input-with-icon">
                <User className="field-icon" size={18} />
                <input type="text" placeholder="Auto-terisi setelah pilih kode dosen" value={formData.dosen2} readOnly style={{ backgroundColor: '#F3F4F6' }} />
              </div>
            </div>
            <div className="form-group">
              <label>Kode Dosen Pembimbing 2 *</label>
              <div className="input-with-icon block-select">
                <FileBadge className="field-icon" size={18} style={{ zIndex: 10 }} />
                <Select
                  placeholder={loadingDosen ? "Memuat data dosen..." : "Pilih Kode Dosen 2"}
                  options={lecturerOptions} styles={customSelectStyles}
                  value={formData.kode2} onChange={(val) => handleDosenChange('kode2', val)}
                  isLoading={loadingDosen} isDisabled={loadingDosen}
                  isClearable noOptionsMessage={() => "Dosen tidak ditemukan"} className="w-full"
                />
              </div>
              <p className="input-hint">Pilih dari dropdown → nama akan terisi otomatis.</p>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ margin: 0 }}>Kelompok Keilmuan</label>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                Otomatis diambil dari KK Dosen Pembimbing 1
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px',
            }}>
              {kelompokKeilmuan.map((item) => {
                const isSelected = formData.kelompok === item.label;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 8,
                      border: `1.5px solid ${isSelected ? '#C0182A' : '#E5E7EB'}`,
                      background: isSelected ? '#FEF2F2' : '#F9FAFB',
                      cursor: 'default',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? '#C0182A' : '#D1D5DB'}`,
                      background: isSelected ? '#C0182A' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#B91C1C' : '#6B7280',
                      lineHeight: 1.4, userSelect: 'none',
                    }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {!formData.kelompok && (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10, fontStyle: 'italic' }}>
                Pilih Dosen Pembimbing 1 terlebih dahulu untuk menentukan kelompok keilmuan.
              </p>
            )}
          </div>
        </section>

        {/*  SECTION 3: Upload Dokumen  */}
        <section className="form-section">
          <h2 className="section-title">
            Dokumen Evidence Sudah Di Approve Pengajuan Pembimbing Oleh Ketua KK Di iGracias
          </h2>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>
            1. Berkas Lampiran Bukti Dosbing Sudah Diacc KK :{' '}
            <a href="https://tel-u.ac.id/bukti-dosbing" target="_blank" rel="noreferrer" style={{ color: '#0070f3', wordBreak: 'break-all' }}>
              Lihat Contoh Evidence
            </a>
          </p>
          {isExpired && (
            <p style={{ fontSize: 12, color: '#7C3AED', marginBottom: 16, fontStyle: 'italic' }}>
              * Untuk pembaruan SK, upload dokumen baru jika ada perubahan. Jika tidak ada perubahan dokumen, kosongkan saja.
            </p>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label>Unggah Dokumen Prasyarat {!isExpired && '*'}</label>
              <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                <div className="upload-icon-circle"><UploadCloud size={48} /></div>
                <div className="upload-text">
                  <p><strong>Klik untuk memilih file</strong></p>
                  <div className="file-type-badges">
                    <span>PDF</span><span>JPG/PNG</span><span>MAX 3MB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>File Terpilih</label>
              <div className="file-status-list">
                {selectedFile && (
                  <div className="status-card success">
                    <div className="status-icon-wrap" style={{ background: '#10B981' }}><FileText size={20} /></div>
                    <div className="status-info">
                      <div className="status-filename">{selectedFile.name}{' '}<span className="label-siap">Siap</span></div>
                      <div className="status-meta">{selectedFile.size} MB • {selectedFile.type}</div>
                    </div>
                  </div>
                )}
                {fileError && (
                  <div className="status-card error">
                    <div className="status-icon-wrap" style={{ background: '#EF4444' }}><AlertTriangle size={20} /></div>
                    <div className="status-info">
                      <div className="error-title">File Tidak Valid</div>
                      <div className="error-desc">{fileError}</div>
                    </div>
                  </div>
                )}
                {!selectedFile && !fileError && (
                  <div className="empty-file-state" style={{ padding: '20px', border: '1px dashed #E5E7EB', borderRadius: '8px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                    {isExpired ? 'Kosongkan jika tidak ada perubahan dokumen' : 'Belum ada file yang dipilih'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>

      <footer className="bottom-actions">
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={pageStatus === 'submitting'}
          style={pageStatus === 'submitting' ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
        >
          {pageStatus === 'submitting' ? (
            <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Mengirim Pengajuan...</>
          ) : (
            isExpired ? 'Kirim Pembaruan SK' : skStatus === 'revisi' ? 'Kirim Perbaikan' : 'Simpan Pengajuan'
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </footer>
    </div>
  );
};

const Header = ({ onBack }) => (
  <header className="sk-header">
    <button className="btn-back" onClick={onBack}>
      <ArrowLeft size={18} /> Kembali
    </button>
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <img src={SimtaLogo} alt="SIMTA Logo" referrerPolicy="no-referrer" style={{ height: '40px' }} />
      <img src={Telulogo}  alt="Telkom University Logo" referrerPolicy="no-referrer" style={{ height: '40px' }} />
    </div>
  </header>
);

export default PengajuanSK;