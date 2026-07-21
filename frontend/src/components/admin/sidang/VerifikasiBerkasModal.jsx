import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  User, Hash, BookOpen, GraduationCap, FileText,
  Calendar, MessageSquare, Clock, Check, Loader,
  AlertTriangle, Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  downloadSidangRegistrationUpload,
  getSidangRegistrationById,
  getSidangRegistrationResponse,
  createSidangRegistrationResponse,
  updateSidangRegistrationResponse,
} from '../../../service/api';
import { DOCUMENT_CONFIG, SECTIONS } from '../../../requirement/sidangDocument';



const BERKAS_STATUS = { SESUAI: 'sesuai', BERMASALAH: 'bermasalah', UNCHECKED: 'unchecked' };

// Flatten  dokumen dari DOCUMENT_CONFIG → Map<slug, namaResmi>
const SLUG_TO_NAME = Object.values(DOCUMENT_CONFIG)
  .flat()
  .reduce((acc, doc) => { acc[doc.slug] = doc.name; return acc; }, {});

// Helper:  nama resmi berkas dari slug, fallback ke upload.name
const getBerkasName = (upload) =>
  SLUG_TO_NAME[upload.slug] || upload.name || upload.filename || 'Berkas';

const CLR = {
  red    : '#C0182A',
  green  : '#16A34A',
  orange : '#D97706',
  border : '#E2E8F0',
  muted  : '#94A3B8',
  text   : '#1E293B',
  sub    : '#64748B',
};


const STEPS = [
  { n: 1, label: 'Data Diri & Akademik'    },
  { n: 2, label: 'Periksa Berkas & Dokumen' },
  { n: 3, label: 'Finalisasi'               },
];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '0 0 28px 0' }}>
    {STEPS.map((s, i) => {
      const done   = s.n < current;
      const active = s.n === current;
      return (
        <React.Fragment key={s.n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: done ? CLR.green : active ? CLR.red : '#E5E7EB',
              color: done || active ? '#fff' : '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease',
            }}>
              {done ? <Check size={16} /> : s.n}
            </div>
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 500,
              color: done ? CLR.green : active ? CLR.red : '#9CA3AF',
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              height: 2, width: 80,
              background: done ? CLR.green : CLR.border,
              margin: '0 8px', marginBottom: 22,
              transition: 'background 0.3s ease',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

//  InfoCard 

const InfoCard = ({ label, value, icon: Icon, highlight }) => (
  <div style={{
    background: '#F8FAFC', border: `1px solid ${CLR.border}`,
    borderRadius: 10, padding: '14px 16px',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: '#FEF2F2', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={18} color={CLR.red} />
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? CLR.red : CLR.text, lineHeight: 1.4 }}>
        {value || '-'}
      </div>
    </div>
  </div>
);

//  Step 1: Data Diri & Akademik 

const Step1 = ({ registration, prodiName }) => {
  const s = registration?.student || {};
  const r = registration || {};
  const dosenInfo = [r.dosenPembimbing1?.name, r.dosenPembimbing2?.name]
    .filter(Boolean).join(' & ') || '-';

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#FEF2F2',
        border: '1px solid #FECACA', borderRadius: 10, marginBottom: 20,
      }}>
        <User size={16} color={CLR.red} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Tahap 1: Informasi Pokok Mahasiswa
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <InfoCard label="Nama Lengkap Mahasiswa"      icon={User}          value={s.name} />
        <InfoCard label="Nomor Induk Mahasiswa (NIM)" icon={Hash}          value={s.nim} />
        <InfoCard label="Program Studi Terdaftar"     icon={BookOpen}      value={prodiName} />
        <InfoCard label="Skema / Jalur Tugas Akhir"   icon={GraduationCap} value={r.sidangScheme || 'Sidang Reguler'} />
        <div style={{ gridColumn: '1 / -1' }}>
          <InfoCard label="Judul Tugas Akhir (TA)" icon={FileText} value={r.thesisTitleId} highlight />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <InfoCard label="Dosen Pembimbing" icon={User} value={dosenInfo} />
        </div>
      </div>
    </div>
  );
};

//  VerifButton (Sesuai / Bermasalah) 

const VerifButton = ({ active, onClick, color, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      border: `1.5px solid ${active ? color : '#D1D5DB'}`,
      background: active ? (color === CLR.green ? '#DCFCE7' : '#FEE2E2') : '#fff',
      color: active ? color : '#6B7280',
      cursor: 'pointer', transition: 'all 0.15s',
    }}
  >
    <div style={{
      width: 13, height: 13, borderRadius: 3, flexShrink: 0,
      background: active ? color : 'transparent',
      border: `2px solid ${active ? color : '#D1D5DB'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {active && <Check size={8} color="#fff" strokeWidth={3} />}
    </div>
    {label}
  </button>
);

//  NavBtn (← →) 

const NavBtn = ({ onClick, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      width: 24, height: 24, borderRadius: 5,
      border: `1px solid ${CLR.border}`,
      background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: disabled ? '#D1D5DB' : '#374151',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}
  >
    {children}
  </button>
);

//  Step 2: Periksa Berkas & Dokumen 

const Step2 = ({ uploads, berkasStatuses, onToggle, previewFile, onPreview, onDownload, loadingFileId, loadingUploads, fileError }) => {
  // currentIdx dihitung sekali, dipakai di navigasi & counter
  const currentIdx = uploads.findIndex(u => u.id === previewFile?.id);
  const currentStatus = berkasStatuses[previewFile?.id];

  return (
    <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, height: '100%' }}>

      {/* Left panel — daftar berkas, scroll sendiri */}
      <div style={{
        width: 220, flexShrink: 0,
        borderRight: `1px solid ${CLR.border}`,
        overflowY: 'auto', padding: '10px 0', height: '100%',
      }}>
        <div style={{
          padding: '0 10px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Lampiran Berkas ({uploads.length})
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px',
            borderRadius: 9999, background: '#DCFCE7', color: CLR.green,
          }}>
            {Object.values(berkasStatuses).filter(v => v === BERKAS_STATUS.SESUAI).length} Sesuai
          </span>
        </div>

        {loadingUploads ? (
          <div style={{ padding: '20px 10px', fontSize: 12, color: '#9CA3AF', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...
          </div>
        ) : uploads.length === 0 ? (
          <div style={{ padding: '20px 10px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
            Tidak ada berkas diunggah
          </div>
        ) : null}

        {uploads.map((upload, idx) => {
          const status   = berkasStatuses[upload.id] || BERKAS_STATUS.UNCHECKED;
          const isActive = previewFile?.id === upload.id;
          const berkasName = getBerkasName(upload);
          return (
            <div
              key={upload.id}
              onClick={() => onPreview(upload)}
              style={{
                padding: '8px 10px', cursor: 'pointer',
                background: isActive ? '#FEF2F2' : 'transparent',
                borderLeft: isActive ? `3px solid ${CLR.red}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', lineHeight: 1.3, marginBottom: 2 }}>
                    {idx + 1}. {berkasName}
                  </div>
                  {status !== BERKAS_STATUS.UNCHECKED && (
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: status === BERKAS_STATUS.SESUAI ? CLR.green : '#DC2626' }}>
                      {status === BERKAS_STATUS.SESUAI ? 'SESUAI' : 'BERMASALAH'}
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {status === BERKAS_STATUS.SESUAI
                    ? <CheckCircle2 size={14} color={CLR.green} />
                    : status === BERKAS_STATUS.BERMASALAH
                      ? <XCircle size={14} color="#DC2626" />
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #D1D5DB' }} />
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel — flex column agar bar selalu di bawah */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: '100%' }}>
        {previewFile ? (
          <>
            {/* Preview header */}
            <div style={{
              padding: '8px 14px', borderBottom: `1px solid ${CLR.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#FAFAFA', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <FileText size={13} color={CLR.red} flexShrink={0} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getBerkasName(previewFile)}
                </span>
                {currentStatus !== BERKAS_STATUS.UNCHECKED && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 9999, flexShrink: 0,
                    background: currentStatus === BERKAS_STATUS.SESUAI ? '#DCFCE7' : '#FEE2E2',
                    color: currentStatus === BERKAS_STATUS.SESUAI ? CLR.green : '#DC2626',
                  }}>
                    {currentStatus === BERKAS_STATUS.SESUAI ? 'TRUE' : 'FALSE'}
                  </span>
                )}
              </div>
              <button
                onClick={() => onDownload(previewFile)}
                disabled={loadingFileId === previewFile.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: '#fff', border: `1px solid ${CLR.border}`, cursor: 'pointer', color: '#374151',
                }}
              >
                {loadingFileId === previewFile.id
                  ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Download size={11} />}
                Unduh
              </button>
            </div>

            {/* Frame preview — flex:1, minHeight:0 wajib ada di flex column */}
            <div style={{ flex: 1, minHeight: 0, background: '#F8FAFC', overflow: 'auto', position: 'relative' }}>
              {fileError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>File Tidak Ditemukan.</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>File mungkin sudah dihapus atau tidak tersedia di server.</span>
                </div>
              ) : previewFile.blobUrl ? (
                previewFile.type === 'pdf' ? (
                  <iframe src={previewFile.blobUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Preview" />
                ) : (
                  <img src={previewFile.blobUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: 'auto', display: 'block', padding: 12 }} />
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#9CA3AF' }}>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12 }}>Memuat berkas...</span>
                </div>
              )}
            </div>

            <div style={{
              flexShrink: 0, padding: '6px 12px',
              borderTop: `1px solid ${CLR.border}`, background: '#fff',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 -2px 6px rgba(0,0,0,0.04)',
            }}>
              {/* Navigasi ← → */}
              <NavBtn
                onClick={() => currentIdx > 0 && onPreview(uploads[currentIdx - 1])}
                disabled={currentIdx <= 0}
                title="Berkas sebelumnya"
              >←</NavBtn>
              <NavBtn
                onClick={() => currentIdx < uploads.length - 1 && onPreview(uploads[currentIdx + 1])}
                disabled={currentIdx >= uploads.length - 1}
                title="Berkas selanjutnya"
              >→</NavBtn>

              <div style={{ width: 1, height: 16, background: CLR.border, margin: '0 2px' }} />

              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Verifikasi:</span>

              <VerifButton
                active={currentStatus === BERKAS_STATUS.SESUAI}
                onClick={() => onToggle(previewFile.id, BERKAS_STATUS.SESUAI)}
                color={CLR.green}
                label="Sesuai / Valid"
              />
              <VerifButton
                active={currentStatus === BERKAS_STATUS.BERMASALAH}
                onClick={() => onToggle(previewFile.id, BERKAS_STATUS.BERMASALAH)}
                color="#DC2626"
                label="Bermasalah"
              />

              {/* Counter posisi */}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                {currentIdx + 1} / {uploads.length}
              </span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#9CA3AF' }}>
            <FileText size={32} strokeWidth={1} />
            <span style={{ fontSize: 13 }}>Pilih berkas dari daftar kiri untuk memeriksa</span>
          </div>
        )}
      </div>
    </div>
  );
};

//  Step 3A: Ada bermasalah → set revisi 

const Step3Revisi = ({ berkasStatuses, uploads, dueDate, setDueDate, message, setMessage }) => {
  const bermasalah = uploads.filter(u => berkasStatuses[u.id] === BERKAS_STATUS.BERMASALAH);

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#FFF7ED',
        border: '1px solid #FED7AA', borderRadius: 10, marginBottom: 20,
      }}>
        <AlertTriangle size={16} color={CLR.orange} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
          Ditemukan {bermasalah.length} berkas bermasalah — mahasiswa perlu melakukan perbaikan
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Berkas Perlu Diperbaiki
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bermasalah.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', background: '#FEE2E2',
              border: '1px solid #FECACA', borderRadius: 8,
            }}>
              <XCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                {i + 1}. {getBerkasName(u)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          <Clock size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Batas Waktu Perbaikan *
        </label>
        <input
          type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 14, color: CLR.text, outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = CLR.red}
          onBlur={e  => e.target.style.borderColor = '#CBD5E1'}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          <MessageSquare size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Catatan / Instruksi Perbaikan untuk Mahasiswa *
        </label>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)} rows={5}
          placeholder="Contoh: Berkas scan akta kelahiran tidak terbaca, harap scan ulang dengan resolusi minimum 300dpi..."
          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 13, color: CLR.text, resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = CLR.red}
          onBlur={e  => e.target.style.borderColor = '#CBD5E1'}
        />
      </div>
    </div>
  );
};

//  Step 3B: Semua OK → pilih periode 

const Step3Approve = ({ periods, selectedPeriodId, onSelectPeriod, uploads }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', background: '#F0FDF4',
      border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 20,
    }}>
      <CheckCircle2 size={16} color={CLR.green} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
        Semua {uploads.length} berkas telah diverifikasi sesuai — pilih periode sidang untuk mahasiswa ini
      </span>
    </div>

    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        <Calendar size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        Periode Sidang *
      </label>

      {periods.length === 0 ? (
        <div style={{ padding: '16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          Belum ada periode sidang yang tersedia. Buat periode terlebih dahulu di menu Atur Periode.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {periods.map(p => {
            const now    = new Date();
            const status = now >= new Date(p.startDate) && now <= new Date(p.endDate) ? 'Aktif' : now < new Date(p.startDate) ? 'Mendatang' : 'Selesai';
            const statusColor = status === 'Aktif' ? CLR.green : status === 'Mendatang' ? '#1D4ED8' : CLR.sub;
            const statusBg    = status === 'Aktif' ? '#DCFCE7' : status === 'Mendatang' ? '#DBEAFE' : '#F1F5F9';
            const isSelected  = selectedPeriodId === p.id;
            const fmtDate     = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

            return (
              <div
                key={p.id} onClick={() => onSelectPeriod(p.id)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isSelected ? CLR.red : CLR.border}`,
                  background: isSelected ? '#FEF2F2' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? CLR.red : '#D1D5DB'}`,
                    background: isSelected ? CLR.red : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: CLR.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: CLR.sub, marginTop: 2 }}>
                      {fmtDate(p.startDate)} — {fmtDate(p.endDate)}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: statusBg, color: statusColor }}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

//  VerifikasiBerkasModal (Main) 

const VerifikasiBerkasModal = ({
  registration,
  academicStaffId,
  periodMap,
  onClose,
  onSaved,
}) => {
  const [step,              setStep]              = useState(1);
  const [berkasStatuses,    setBerkasStatuses]    = useState({});
  const [previewFile,       setPreviewFile]       = useState(null);
  const [loadingFileId,     setLoadingFileId]     = useState(null);
  const [selectedPeriodId,  setSelectedPeriodId]  = useState(null);
  const [dueDate,           setDueDate]           = useState('');
  const [message,           setMessage]           = useState('');
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [submitError,       setSubmitError]       = useState(null);
  const [existingResponseId,setExistingResponseId]= useState(null);
  const [uploads,           setUploads]           = useState([]);
  const [loadingUploads,    setLoadingUploads]    = useState(false);
  const [fileError,         setFileError]         = useState(null);

  // prodiName diambil langsung dari registration prop 
  const prodiName = registration?.student?.studyProgram?.name ?? '-';
  const periods   = Object.values(periodMap ?? {});

  //  Fetch uploads 
  useEffect(() => {
    const initial = registration?.sidangRegistrationUploads;
    if (initial && initial.length > 0) { setUploads(initial); return; }
    if (!registration?.id) return;

    setLoadingUploads(true);
    getSidangRegistrationById(registration.id)
      .then(detail => setUploads(detail?.sidangRegistrationUploads ?? []))
      .catch(() => setUploads([]))
      .finally(() => setLoadingUploads(false));
  }, [registration?.id]);

  //  Fetch & restore existing response 
  useEffect(() => {
    if (!registration?.id) return;

    getSidangRegistrationResponse(registration.id)
      .then(existing => {
        if (!existing) return;
        setExistingResponseId(existing.id);

        // Restore dueDate dari isEdit
        if (existing.isEdit) setDueDate(existing.isEdit.split('T')[0]);
        if (existing.message) setMessage(existing.message);

        // Restore selectedPeriodId dari sidangPeriodId di registration
        const pId = registration.sidangPeriodId ?? null;
        if (pId) setSelectedPeriodId(pId);

        // Restore berkasStatuses dari isValid per upload
        const existingUploads =
          existing.sidangRegistration?.sidangRegistrationUploads ??
          registration.sidangRegistrationUploads ?? [];

        if (existingUploads.length > 0) {
          const restored = {};
          existingUploads.forEach(u => {
            if (u.isValid === true)       restored[u.id] = BERKAS_STATUS.SESUAI;
            else if (u.isValid === false) restored[u.id] = BERKAS_STATUS.BERMASALAH;
            else                          restored[u.id] = BERKAS_STATUS.UNCHECKED;
          });
          setBerkasStatuses(restored);
        }
      })
      .catch(() => {});
  }, [registration?.id]);

  //  Auto-load file  saat uploads tersedia 
  useEffect(() => {
    if (uploads.length > 0 && !previewFile) {
      handlePreview(uploads[0]);
    }
  }, [uploads]);

  //    
  const hasBermasalah  = Object.values(berkasStatuses).some(v => v === BERKAS_STATUS.BERMASALAH);
  const allChecked     = uploads.length > 0 && uploads.every(u =>
    berkasStatuses[u.id] === BERKAS_STATUS.SESUAI || berkasStatuses[u.id] === BERKAS_STATUS.BERMASALAH
  );
  const uncheckedCount = uploads.filter(u =>
    !berkasStatuses[u.id] || berkasStatuses[u.id] === BERKAS_STATUS.UNCHECKED
  ).length;

  //  Handlers 
  const handleToggle = (uploadId, status) => {
    setBerkasStatuses(prev => ({
      ...prev,
      [uploadId]: prev[uploadId] === status ? BERKAS_STATUS.UNCHECKED : status,
    }));
  };

  const handlePreview = useCallback(async (upload) => {
    setPreviewFile(prev => prev?.id === upload.id ? prev : upload);
    setFileError(null);

    // Sudah punya blobUrl → tidak perlu fetch ulang
    if (upload.blobUrl) return;

    // Auto-load: langsung fetch tanpa perlu klik tombol
    setLoadingFileId(upload.id);
    try {
      const blob     = await downloadSidangRegistrationUpload(upload.id);
      const isPdf    = blob.type.includes('pdf') || (upload.filename || '').toLowerCase().endsWith('.pdf');
      const blobUrl  = URL.createObjectURL(blob);
      const enriched = { ...upload, blobUrl, type: isPdf ? 'pdf' : 'image' };
      setPreviewFile(enriched);
      setUploads(prev => prev.map(u => u.id === upload.id ? enriched : u));
    } catch (err) {
      console.error('Preview error:', err);
      setFileError('File Tidak Ditemukan.');
    } finally {
      setLoadingFileId(null);
    }
  }, []);

  const handleDownload = useCallback(async (upload) => {
    setLoadingFileId(upload.id);
    try {
      const blob = await downloadSidangRegistrationUpload(upload.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = upload.filename || upload.name || `berkas_${upload.id}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setLoadingFileId(null);
    }
  }, []);

  const handleSubmit = async () => {
    setSubmitError(null);

    if (hasBermasalah) {
      if (!dueDate)        { setSubmitError('Batas waktu perbaikan wajib diisi.'); return; }
      if (!message.trim()) { setSubmitError('Catatan perbaikan untuk mahasiswa wajib diisi.'); return; }
    } else {
      if (!selectedPeriodId) { setSubmitError('Pilih periode sidang terlebih dahulu.'); return; }
    }

    const validUploadIds = uploads
      .filter(u => berkasStatuses[u.id] === BERKAS_STATUS.SESUAI)
      .map(u => u.id);

    const payload = {
      sidangRegistrationId:        registration.id,
      academicStaffId,
      sidangRegistrationUploadIds: validUploadIds,
      ...(hasBermasalah
        ? { isEdit: `${dueDate}T23:59:59.000Z`, message: message.trim(), sidangPeriodId: null }
        : { isEdit: null, message: null, sidangPeriodId: selectedPeriodId }
      ),
    };

    setIsSubmitting(true);
    try {
      if (existingResponseId) {
        await updateSidangRegistrationResponse(existingResponseId, payload);
      } else {
        await createSidangRegistrationResponse(payload);
      }
      onSaved?.();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentName = registration?.student?.name || 'Mahasiswa';
  const nim         = registration?.student?.nim  || '';

  //  Render 
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%',
          maxWidth: step === 2 ? 900 : 680,
          height: '92vh', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${CLR.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
            Verifikasi Berkas — {studentName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: CLR.sub, background: '#F1F5F9', padding: '4px 12px', borderRadius: 9999 }}>
              NIM {nim}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: CLR.sub }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <StepIndicator current={step} />
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflow: step === 2 ? 'hidden' : 'auto',
          padding: step === 2 ? 0 : '0 24px 24px',
          display: 'flex', flexDirection: 'column',
        }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '0 24px 24px' }}>
                <Step1 registration={registration} prodiName={prodiName} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                <Step2
                  uploads={uploads}
                  loadingUploads={loadingUploads}
                  berkasStatuses={berkasStatuses}
                  onToggle={handleToggle}
                  previewFile={previewFile}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  loadingFileId={loadingFileId}
                  fileError={fileError}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '0 24px 24px' }}>
                {hasBermasalah ? (
                  <Step3Revisi
                    berkasStatuses={berkasStatuses} uploads={uploads}
                    dueDate={dueDate} setDueDate={setDueDate}
                    message={message} setMessage={setMessage}
                  />
                ) : (
                  <Step3Approve
                    periods={periods} selectedPeriodId={selectedPeriodId}
                    onSelectPeriod={setSelectedPeriodId} uploads={uploads}
                  />
                )}
                {submitError && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={15} />
                    {submitError}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${CLR.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#FAFAFA',
        }}>
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)} disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: `1px solid ${CLR.border}`, background: '#fff', color: '#374151', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} /> Kembali
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {step === 2 && uncheckedCount > 0 && (
              <span style={{ fontSize: 11, color: CLR.orange, fontWeight: 600 }}>
                {uncheckedCount} berkas belum diverifikasi
              </span>
            )}

            <button
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: `1px solid ${CLR.border}`, background: '#fff', color: '#374151', cursor: 'pointer' }}
            >
              Batal
            </button>

            {step < 3 ? (
              <button
                onClick={step === 1 ? () => setStep(2) : () => { if (allChecked) setStep(3); }}
                disabled={step === 2 && !allChecked}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: step === 2 && !allChecked ? '#E2E8F0' : step === 2 && hasBermasalah ? CLR.orange : CLR.red,
                  color: step === 2 && !allChecked ? '#94A3B8' : '#fff',
                  border: 'none', cursor: step === 2 && !allChecked ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                }}
              >
                {step === 1
                  ? <> Langkah Selanjutnya: Periksa Berkas <ChevronRight size={16} /></>
                  : hasBermasalah
                    ? <> Lanjut: Set Revisi <ChevronRight size={16} /></>
                    : <> Lanjut: Pilih Periode <ChevronRight size={16} /></>
                }
              </button>
            ) : (
              <button
                onClick={handleSubmit} disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: isSubmitting ? '#E2E8F0' : hasBermasalah ? CLR.orange : CLR.green,
                  color: isSubmitting ? '#94A3B8' : '#fff',
                  border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                }}
              >
                {isSubmitting
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                  : hasBermasalah
                    ? <><MessageSquare size={16} /> Kirim Permintaan Revisi</>
                    : <><CheckCircle2 size={16} /> Verifikasi & Setujui</>
                }
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export { BERKAS_STATUS };
export default VerifikasiBerkasModal;