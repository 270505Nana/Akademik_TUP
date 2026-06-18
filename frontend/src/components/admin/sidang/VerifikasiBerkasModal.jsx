import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  User, Hash, BookOpen, GraduationCap, FileText,
  Calendar, MessageSquare, Clock, Check, Loader,
  AlertTriangle, Eye, Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  downloadSidangRegistrationUpload,
  getSidangRegistrationById,
  getSidangRegistrationResponse,
  createSidangRegistrationResponse,
  updateSidangRegistrationResponse,
} from '../../../service/api';


const BERKAS_STATUS = { SESUAI: 'sesuai', BERMASALAH: 'bermasalah', UNCHECKED: 'unchecked' };


const StepIndicator = ({ current }) => {
  const steps = [
    { n: 1, label: 'Data Diri & Akademik'    },
    { n: 2, label: 'Periksa Berkas & Dokumen' },
    { n: 3, label: 'Finalisasi'               },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '0 0 28px 0' }}>
      {steps.map((s, i) => {
        const done   = s.n < current;
        const active = s.n === current;
        return (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#16A34A' : active ? '#C0182A' : '#E5E7EB',
                color: done || active ? '#fff' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                transition: 'all 0.3s ease',
              }}>
                {done ? <Check size={16} /> : s.n}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: done ? '#16A34A' : active ? '#C0182A' : '#9CA3AF',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2, width: 80,
                background: done ? '#16A34A' : '#E5E7EB',
                margin: '0 8px', marginBottom: 22,
                transition: 'background 0.3s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

//  InfoCard 

const InfoCard = ({ label, value, icon: Icon, highlight }) => {
  const ActiveIcon = Icon;
  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #E2E8F0',
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: '#FEF2F2', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ActiveIcon size={18} color="#C0182A" />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#C0182A' : '#1E293B', lineHeight: 1.4 }}>
          {value || '-'}
        </div>
      </div>
    </div>
  );
};

//  Step 1: Data Diri & Akademik 

const Step1 = ({ registration, prodiName }) => {
  const s = registration?.student || {};
  const r = registration || {};

  const dosenInfo = [
    r.dosenPembimbing1?.name,
    r.dosenPembimbing2?.name,
  ].filter(Boolean).join(' & ') || '-';

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#FEF2F2',
        border: '1px solid #FECACA', borderRadius: 10, marginBottom: 20,
      }}>
        <User size={16} color="#C0182A" />
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
          <InfoCard
            label="Judul Tugas Akhir (TA)"
            icon={FileText}
            value={r.thesisTitleId}
            highlight
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <InfoCard
            label="Dosen Pembimbing"
            icon={User}
            value={dosenInfo}
          />
        </div>
      </div>
    </div>
  );
};

//  Step 2: Periksa Berkas & Dokumen 

const Step2 = ({ uploads, berkasStatuses, onToggle, previewFile, onPreview, onDownload, loadingFileId, loadingUploads }) => (
  <div style={{ display: 'flex', gap: 0, minHeight: 420 }}>
    {/* Left panel — daftar berkas */}
    <div style={{
      width: 240, flexShrink: 0,
      borderRight: '1px solid #E2E8F0',
      overflowY: 'auto',
      padding: '12px 0',
    }}>
      <div style={{
        padding: '0 12px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Lampiran Berkas ({uploads.length})
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: 9999, background: '#DCFCE7', color: '#16A34A',
        }}>
          {Object.values(berkasStatuses).filter(v => v === BERKAS_STATUS.SESUAI).length} Sesuai
        </span>
      </div>

      {loadingUploads ? (
        <div style={{ padding: '20px 12px', fontSize: 12, color: '#9CA3AF', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memuat berkas...
        </div>
      ) : uploads.length === 0 ? (
        <div style={{ padding: '20px 12px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
          Tidak ada berkas diunggah
        </div>
      ) : null}

      {uploads.map((upload, idx) => {
        const status   = berkasStatuses[upload.id] || BERKAS_STATUS.UNCHECKED;
        const isActive = previewFile?.id === upload.id;
        const name     = upload.name || upload.filename || `Berkas ${idx + 1}`;

        return (
          <div
            key={upload.id}
            onClick={() => onPreview(upload)}
            style={{
              padding: '10px 12px',
              cursor: 'pointer',
              background: isActive ? '#FEF2F2' : 'transparent',
              borderLeft: isActive ? '3px solid #C0182A' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', lineHeight: 1.3, marginBottom: 3 }}>
                  {idx + 1}. {name.toUpperCase()}
                </div>
                {status !== BERKAS_STATUS.UNCHECKED && (
                  <div style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    color: status === BERKAS_STATUS.SESUAI ? '#16A34A' : '#DC2626',
                  }}>
                    {status === BERKAS_STATUS.SESUAI ? 'SESUAI / TRUE' : 'BERMASALAH / FALSE'}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                {status === BERKAS_STATUS.SESUAI
                  ? <CheckCircle2 size={16} color="#16A34A" />
                  : status === BERKAS_STATUS.BERMASALAH
                    ? <XCircle size={16} color="#DC2626" />
                    : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #D1D5DB' }} />
                }
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Right panel — preview */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {previewFile ? (
        <>
          {/* Preview header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} color="#C0182A" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                {(previewFile.name || previewFile.filename || 'Berkas').toUpperCase()}
              </span>
              {berkasStatuses[previewFile.id] !== BERKAS_STATUS.UNCHECKED && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 9999,
                  background: berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#DCFCE7' : '#FEE2E2',
                  color: berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#16A34A' : '#DC2626',
                }}>
                  {berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? 'TRUE' : 'FALSE'}
                </span>
              )}
            </div>
            <button
              onClick={() => onDownload(previewFile)}
              disabled={loadingFileId === previewFile.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer',
                color: '#374151',
              }}
            >
              {loadingFileId === previewFile.id
                ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={12} />}
              Unduh
            </button>
          </div>

          {/* Frame preview */}
          <div style={{ flex: 1, background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
            {previewFile.blobUrl ? (
              previewFile.type === 'pdf' ? (
                <iframe
                  src={previewFile.blobUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Preview"
                />
              ) : (
                <img
                  src={previewFile.blobUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: 'auto', display: 'block', padding: 16 }}
                />
              )
            ) : loadingFileId === previewFile.id ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#9CA3AF' }}>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13 }}>Memuat berkas...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#9CA3AF' }}>
                <Eye size={32} strokeWidth={1} />
                <span style={{ fontSize: 13 }}>Klik tombol di bawah untuk memuat preview berkas</span>
                <button
                  onClick={() => onPreview(previewFile, true)}
                  style={{
                    padding: '8px 20px', borderRadius: 9999, fontSize: 12, fontWeight: 700,
                    background: '#C0182A', color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  <Eye size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Lihat Preview
                </button>
              </div>
            )}
          </div>

          {/* Verifikasi toggle */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #E2E8F0',
            background: '#fff', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginRight: 4 }}>
              Verifikasi Berkas Ini:
            </span>

            <button
              onClick={() => onToggle(previewFile.id, BERKAS_STATUS.SESUAI)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#16A34A' : '#D1D5DB'}`,
                background: berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#DCFCE7' : '#fff',
                color: berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#16A34A' : '#6B7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                background: berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#16A34A' : 'transparent',
                border: `2px solid ${berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI ? '#16A34A' : '#D1D5DB'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {berkasStatuses[previewFile.id] === BERKAS_STATUS.SESUAI && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              Sesuai / Valid (True)
            </button>

            <button
              onClick={() => onToggle(previewFile.id, BERKAS_STATUS.BERMASALAH)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${berkasStatuses[previewFile.id] === BERKAS_STATUS.BERMASALAH ? '#DC2626' : '#D1D5DB'}`,
                background: berkasStatuses[previewFile.id] === BERKAS_STATUS.BERMASALAH ? '#FEE2E2' : '#fff',
                color: berkasStatuses[previewFile.id] === BERKAS_STATUS.BERMASALAH ? '#DC2626' : '#6B7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                background: berkasStatuses[previewFile.id] === BERKAS_STATUS.BERMASALAH ? '#DC2626' : 'transparent',
                border: `2px solid ${berkasStatuses[previewFile.id] === BERKAS_STATUS.BERMASALAH ? '#DC2626' : '#D1D5DB'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {berkasStatuses[previewFile.id] === BERKAS_STATUS.BERMASALAH && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              Bermasalah (False)
            </button>
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 10, color: '#9CA3AF',
        }}>
          <FileText size={36} strokeWidth={1} />
          <span style={{ fontSize: 13 }}>Pilih berkas dari daftar kiri untuk memeriksa</span>
        </div>
      )}
    </div>
  </div>
);

// Ada bermasalah → set revisi 

const Step3Revisi = ({ berkasStatuses, uploads, dueDate, setDueDate, message, setMessage }) => {
  const bermasalah = uploads.filter(u => berkasStatuses[u.id] === BERKAS_STATUS.BERMASALAH);

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#FFF7ED',
        border: '1px solid #FED7AA', borderRadius: 10, marginBottom: 20,
      }}>
        <AlertTriangle size={16} color="#D97706" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
          Ditemukan {bermasalah.length} berkas bermasalah — mahasiswa perlu melakukan perbaikan
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
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
                {i + 1}. {(u.name || u.filename || 'Berkas').toUpperCase()}
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
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', border: '1.5px solid #CBD5E1',
            borderRadius: 8, fontSize: 14, color: '#1E293B',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#C0182A'}
          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          <MessageSquare size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Catatan / Instruksi Perbaikan untuk Mahasiswa *
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Contoh: Berkas scan akta kelahiran tidak terbaca, harap scan ulang dengan resolusi minimum 300dpi..."
          rows={5}
          style={{
            width: '100%', padding: '12px 14px', border: '1.5px solid #CBD5E1',
            borderRadius: 8, fontSize: 13, color: '#1E293B', resize: 'vertical',
            outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = '#C0182A'}
          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
        />
      </div>
    </div>
  );
};

// Step 3B:  pilih periode 

const Step3Approve = ({ periods, selectedPeriodId, onSelectPeriod, uploads }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', background: '#F0FDF4',
      border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 20,
    }}>
      <CheckCircle2 size={16} color="#16A34A" />
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
        <div style={{
          padding: '16px', background: '#FFF7ED', border: '1px solid #FED7AA',
          borderRadius: 8, fontSize: 13, color: '#92400E',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={16} />
          Belum ada periode sidang yang tersedia. Buat periode terlebih dahulu di menu Atur Periode.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {periods.map(p => {
            const now    = new Date();
            const start  = new Date(p.startDate);
            const end    = new Date(p.endDate);
            const status = now >= start && now <= end ? 'Aktif'
                         : now < start ? 'Mendatang' : 'Selesai';
            const statusColor = status === 'Aktif' ? '#16A34A' : status === 'Mendatang' ? '#1D4ED8' : '#64748B';
            const statusBg    = status === 'Aktif' ? '#DCFCE7' : status === 'Mendatang' ? '#DBEAFE' : '#F1F5F9';
            const isSelected  = selectedPeriodId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPeriod(p.id)}
                style={{
                  padding: '14px 16px',
                  border: `2px solid ${isSelected ? '#C0182A' : '#E2E8F0'}`,
                  borderRadius: 10,
                  background: isSelected ? '#FEF2F2' : '#fff',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${isSelected ? '#C0182A' : '#D1D5DB'}`,
                    background: isSelected ? '#C0182A' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      {new Date(p.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' — '}
                      {new Date(p.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px',
                  borderRadius: 9999, background: statusBg, color: statusColor,
                }}>
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


const VerifikasiBerkasModal = ({
  registration,     
  academicStaffId,  
  periodMap,       
  onClose,
  onSaved,          
}) => {
  const [step,             setStep]             = useState(1);
  const [berkasStatuses,   setBerkasStatuses]   = useState({});
  const [previewFile,      setPreviewFile]      = useState(null);
  const [loadingFileId,    setLoadingFileId]    = useState(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [dueDate,          setDueDate]          = useState('');
  const [message,          setMessage]          = useState('');
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [submitError,      setSubmitError]      = useState(null);
  const [existingResponseId, setExistingResponseId] = useState(null);
  const [uploads,          setUploads]          = useState([]);
  const [loadingUploads,   setLoadingUploads]   = useState(false);
  const prodiName = registration?.student?.studyProgram?.name || '—';

  const periods = Object.values(periodMap ?? {});

  useEffect(() => {
    const initial = registration?.sidangRegistrationUploads;
    if (initial && initial.length > 0) {
      setUploads(initial);
      return;
    }
    if (!registration?.id) return;

    setLoadingUploads(true);
    getSidangRegistrationById(registration.id)
      .then(detail => setUploads(detail?.sidangRegistrationUploads ?? []))
      .catch(() => setUploads([]))
      .finally(() => setLoadingUploads(false));
  }, [registration?.id]);

  useEffect(() => {
    if (!registration?.id) return;

    getSidangRegistrationResponse(registration.id)
      .then(existing => {
        if (!existing) return;
        setExistingResponseId(existing.id);

        // Restore dueDate dari isEdit (timestamp)
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
            if (u.isValid === true)  restored[u.id] = BERKAS_STATUS.SESUAI;
            else if (u.isValid === false) restored[u.id] = BERKAS_STATUS.BERMASALAH;
            else restored[u.id] = BERKAS_STATUS.UNCHECKED;
          });
          setBerkasStatuses(restored);
        }
      })
      .catch(() => {});
  }, [registration?.id]);

  useEffect(() => {
    if (uploads.length > 0 && !previewFile) {
      setPreviewFile(uploads[0]);
    }
  }, [uploads]);

  const hasBermasalah  = Object.values(berkasStatuses).some(v => v === BERKAS_STATUS.BERMASALAH);
  const allChecked     = uploads.length > 0 && uploads.every(u =>
    berkasStatuses[u.id] === BERKAS_STATUS.SESUAI || berkasStatuses[u.id] === BERKAS_STATUS.BERMASALAH
  );
  const uncheckedCount = uploads.filter(u =>
    !berkasStatuses[u.id] || berkasStatuses[u.id] === BERKAS_STATUS.UNCHECKED
  ).length;

  const handleToggle = (uploadId, status) => {
    setBerkasStatuses(prev => ({
      ...prev,
      [uploadId]: prev[uploadId] === status ? BERKAS_STATUS.UNCHECKED : status,
    }));
  };

  const handlePreview = useCallback(async (upload, forceLoad = false) => {
    setPreviewFile(prev => prev?.id === upload.id ? prev : upload);

    if (upload.blobUrl && !forceLoad) return;

    setLoadingFileId(upload.id);
    try {
      const blob    = await downloadSidangRegistrationUpload(upload.id);
      const isPdf   = blob.type.includes('pdf') || (upload.filename || '').toLowerCase().endsWith('.pdf');
      const blobUrl = URL.createObjectURL(blob);
      const enriched = { ...upload, blobUrl, type: isPdf ? 'pdf' : 'image' };

      setPreviewFile(enriched);
      setUploads(prev => prev.map(u => u.id === upload.id ? enriched : u));
    } catch (err) {
      console.error('Preview error:', err);
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

    // Upload ID yang valid (isValid = true) → masuk ke array
    const validUploadIds = uploads
      .filter(u => berkasStatuses[u.id] === BERKAS_STATUS.SESUAI)
      .map(u => u.id);

    const payload = {
      sidangRegistrationId:        registration.id,
      academicStaffId:             academicStaffId,
      sidangRegistrationUploadIds: validUploadIds,
      ...(hasBermasalah
        ? {
            isEdit:        `${dueDate}T23:59:59.000Z`,
            message:       message.trim(),
            sidangPeriodId: null,
          }
        : {
            isEdit:        null,
            message:       null,
            sidangPeriodId: selectedPeriodId,
          }
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
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
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: step === 2 ? 900 : 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
            Verifikasi Berkas — {studentName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#64748B',
              background: '#F1F5F9', padding: '4px 12px', borderRadius: 9999,
            }}>
              NIM {nim}
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748B' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <StepIndicator current={step} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: step === 2 ? 0 : '0 24px 24px' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ padding: '0 24px 24px' }}
              >
                <Step1 registration={registration} prodiName={prodiName} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ height: '100%' }}
              >
                <Step2
                  uploads={uploads}
                  loadingUploads={loadingUploads}
                  berkasStatuses={berkasStatuses}
                  onToggle={handleToggle}
                  previewFile={previewFile}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  loadingFileId={loadingFileId}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ padding: '0 24px 24px' }}
              >
                {hasBermasalah ? (
                  <Step3Revisi
                    berkasStatuses={berkasStatuses}
                    uploads={uploads}
                    dueDate={dueDate}
                    setDueDate={setDueDate}
                    message={message}
                    setMessage={setMessage}
                  />
                ) : (
                  <Step3Approve
                    periods={periods}
                    selectedPeriodId={selectedPeriodId}
                    onSelectPeriod={setSelectedPeriodId}
                    uploads={uploads}
                  />
                )}

                {submitError && (
                  <div style={{
                    marginTop: 16, padding: '10px 14px',
                    background: '#FEE2E2', border: '1px solid #FECACA',
                    borderRadius: 8, fontSize: 13, color: '#DC2626',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
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
          padding: '16px 24px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: '#FAFAFA',
        }}>
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: '1px solid #CBD5E1', background: '#fff', color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={16} /> Kembali
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {step === 2 && uncheckedCount > 0 && (
              <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>
                {uncheckedCount} berkas belum diverifikasi
              </span>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: '1px solid #CBD5E1', background: '#fff', color: '#374151', cursor: 'pointer',
              }}
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
                  background: step === 2 && !allChecked
                    ? '#E2E8F0'
                    : step === 2 && hasBermasalah ? '#D97706' : '#C0182A',
                  color: step === 2 && !allChecked ? '#94A3B8' : '#fff',
                  border: 'none',
                  cursor: step === 2 && !allChecked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
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
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: isSubmitting ? '#E2E8F0' : hasBermasalah ? '#D97706' : '#16A34A',
                  color: isSubmitting ? '#94A3B8' : '#fff',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
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