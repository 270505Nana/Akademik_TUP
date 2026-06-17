import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  User, Hash, BookOpen, GraduationCap, FileText,
  Calendar, MessageSquare, Clock, Check, Loader,
  AlertTriangle, Eye, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getSidangPeriods,
  downloadSidangRegistrationUpload,
  getSidangRegistrationById,
  getSidangRegistrationResponse,
  upsertSidangRegistrationResponse,
} from '../../service/api';

// ─── Subcomponents ──────────────────────────────────────────────────────────

const StepIndicator = ({ current }) => {
  const steps = [
    { n: 1, label: 'Data Diri & Akademik' },
    { n: 2, label: 'Digital Berkas & Dokumen' },
    { n: 3, label: current === 3 ? (current === 3 ? 'Finalisasi' : 'Finalisasi') : 'Finalisasi' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '0 0 28px 0' }}>
      {steps.map((s, i) => {
        const done    = s.n < current;
        const active  = s.n === current;
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
                height: 2, width: 80, background: done ? '#16A34A' : '#E5E7EB',
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

const InfoCard = ({ label, value, icon: Icon, highlight }) => (
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
      <Icon size={18} color="#C0182A" />
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

// ─── Step 1: Data Diri & Akademik ───────────────────────────────────────────

const Step1 = ({ registration }) => {
  const s = registration?.student || {};
  const r = registration || {};

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
        <InfoCard label="Nama Lengkap Mahasiswa"    icon={User}          value={s.name} />
        <InfoCard label="Nomor Induk Mahasiswa (NIM)" icon={Hash}        value={s.nim} />
        <InfoCard label="Program Studi Terdaftar"   icon={BookOpen}      value={r.prodiName || s.studyProgram?.name} />
        <InfoCard label="Skema / Jalur Tugas Akhir" icon={GraduationCap} value={r.scheme || 'Sidang Reguler'} />
        <div style={{ gridColumn: '1 / -1' }}>
          <InfoCard
            label="Judul Tugas Akhir (TA)"
            icon={FileText}
            value={r.proposalTitle || r.sktaRequest?.proposalTitleId}
            highlight
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <InfoCard
            label="Dosen Pembimbing Utama & KK"
            icon={User}
            value={r.supervisorInfo || (r.dosenPembimbing1 ? `${r.dosenPembimbing1} (${r.kkName || 'KK'})` : null)}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Step 2: Digital Berkas & Dokumen ───────────────────────────────────────

const BERKAS_STATUS = { SESUAI: 'sesuai', BERMASALAH: 'bermasalah', UNCHECKED: 'unchecked' };

const Step2 = ({ uploads, berkasStatuses, onToggle, previewFile, onPreview, onDownload, loadingFileId, loadingUploads }) => {
  const selected = uploads.find(u => u.id === previewFile?.id) || uploads[0];

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 420 }}>
      {/* Left panel - berkas list */}
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
            Peta Lampiran Berkas ({uploads.length})
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
        ) : uploads.length === 0 && (
          <div style={{ padding: '20px 12px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
            Tidak ada berkas diunggah
          </div>
        )}

        {uploads.map((upload, idx) => {
          const status  = berkasStatuses[upload.id] || BERKAS_STATUS.UNCHECKED;
          const isActive = previewFile?.id === upload.id;
          const name    = upload.name || upload.filename || `Berkas ${idx + 1}`;
          const slug    = upload.slug || '';

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

      {/* Right panel - preview */}
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

            {/* PDF/Image frame */}
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
                  <span style={{ fontSize: 13 }}>Klik "Lihat Preview" atau unduh untuk memeriksa berkas</span>
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
};

// ─── Step 3A: Ada berkas bermasalah → set revisi ─────────────────────────────

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

      {/* Daftar berkas bermasalah */}
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

      {/* Due date */}
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

      {/* Message */}
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          <MessageSquare size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Catatan / Instruksi Perbaikan untuk Mahasiswa *
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Contoh: Berkas scan akta kelahiran tidak terbaca, harap scan ulang dengan resolusi minimum 300dpi. Berkas KHS harus ditandatangani dosen wali terlebih dahulu..."
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

// ─── Step 3B: Semua OK → pilih periode sidang ────────────────────────────────

const Step3Approve = ({ periods, selectedPeriodId, onSelectPeriod, uploads }) => {
  const total    = uploads.length;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#F0FDF4',
        border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 20,
      }}>
        <CheckCircle2 size={16} color="#16A34A" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
          Semua {total} berkas telah diverifikasi sesuai — pilih periode sidang untuk mahasiswa ini
        </span>
      </div>

      <div style={{ marginBottom: 8 }}>
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
            Belum ada periode sidang yang aktif. Buat periode terlebih dahulu di menu Atur Periode.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {periods.map(p => {
              const now = new Date();
              const start = new Date(p.startDate);
              const end   = new Date(p.endDate);
              const status = now >= start && now <= end ? 'Aktif'
                           : now < start ? 'Mendatang' : 'Selesai';
              const statusColor = status === 'Aktif' ? '#16A34A' : status === 'Mendatang' ? '#1D4ED8' : '#64748B';
              const statusBg    = status === 'Aktif' ? '#DCFCE7' : status === 'Mendatang' ? '#DBEAFE' : '#F1F5F9';

              const isSelected = selectedPeriodId === p.id;

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
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
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
};

// ─── Main Modal ──────────────────────────────────────────────────────────────

const VerifikasiBerkasModal = ({
  registration,     // object data pendaftaran sidang mahasiswa
  onClose,
  onSaved,          // callback setelah berhasil simpan
}) => {
  const [step,             setStep]             = useState(1);
  const [berkasStatuses,   setBerkasStatuses]   = useState({});  // { uploadId: 'sesuai'|'bermasalah'|'unchecked' }
  const [previewFile,      setPreviewFile]      = useState(null);
  const [loadingFileId,    setLoadingFileId]    = useState(null);
  const [periods,          setPeriods]          = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [dueDate,          setDueDate]          = useState('');
  const [message,          setMessage]          = useState('');
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [submitError,      setSubmitError]      = useState(null);
  const [existingResponseId, setExistingResponseId] = useState(null);
  const [uploads,          setUploads]          = useState(registration?.sidangRegistrationUploads || registration?.uploads || []);
  const [loadingUploads,   setLoadingUploads]   = useState(false);

  // Load daftar berkas mahasiswa jika belum ada di object registration
  useEffect(() => {
    const initial = registration?.sidangRegistrationUploads || registration?.uploads;
    if (initial && initial.length > 0) {
      setUploads(initial);
      return;
    }
    if (!registration?.id) return;

    setLoadingUploads(true);
    getSidangRegistrationById(registration.id)
      .then(detail => setUploads(detail?.sidangRegistrationUploads || []))
      .catch(() => setUploads([]))
      .finally(() => setLoadingUploads(false));
  }, [registration?.id]);

  // Load existing response jika ada + periode sidang
  useEffect(() => {
    getSidangPeriods().then(data => {
      setPeriods(Array.isArray(data) ? data : []);
    }).catch(() => {});

    if (registration?.id) {
      getSidangRegistrationResponse(registration.id).then(existing => {
        if (!existing) return;
        setExistingResponseId(existing.id);
        if (existing.dueDate) setDueDate(existing.dueDate.split('T')[0]);
        if (existing.message) setMessage(existing.message);
        if (existing.sidangPeriodId) setSelectedPeriodId(existing.sidangPeriodId);
        // Restore berkas statuses jika ada
        if (existing.berkasStatuses) {
          try {
            const parsed = typeof existing.berkasStatuses === 'string'
              ? JSON.parse(existing.berkasStatuses)
              : existing.berkasStatuses;
            setBerkasStatuses(parsed);
          } catch {}
        }
      }).catch(() => {});
    }
  }, [registration?.id]);

  // Auto-select first file
  useEffect(() => {
    if (uploads.length > 0 && !previewFile) {
      setPreviewFile(uploads[0]);
    }
  }, [uploads]);

  const hasBermasalah = Object.values(berkasStatuses).some(v => v === BERKAS_STATUS.BERMASALAH);
  const allChecked    = uploads.length > 0 && uploads.every(u => berkasStatuses[u.id] !== BERKAS_STATUS.UNCHECKED && berkasStatuses[u.id]);

  const handleToggle = (uploadId, status) => {
    setBerkasStatuses(prev => {
      const current = prev[uploadId];
      // Toggle off jika klik yang sudah aktif
      return { ...prev, [uploadId]: current === status ? BERKAS_STATUS.UNCHECKED : status };
    });
  };

  const handlePreview = useCallback(async (upload, forceLoad = false) => {
    setPreviewFile(prev => ({ ...(prev?.id === upload.id ? prev : upload) }));

    // Sudah punya blobUrl, skip
    if (upload.blobUrl && !forceLoad) return;

    setLoadingFileId(upload.id);
    try {
      const blob    = await downloadSidangRegistrationUpload(upload.id);
      const isPdf   = blob.type.includes('pdf') || (upload.filename || '').toLowerCase().endsWith('.pdf');
      const blobUrl = URL.createObjectURL(blob);

      // Update upload object dengan blobUrl (in-memory)
      const enriched = { ...upload, blobUrl, type: isPdf ? 'pdf' : 'image' };
      setPreviewFile(enriched);

      // Patch ke uploads list supaya tidak re-fetch ulang
      setUploads(prev => prev.map(u => (u.id === upload.id ? enriched : u)));
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setLoadingFileId(null);
    }
  }, [uploads]);

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

  // Navigasi ke step 3: cek mode
  const handleNextToStep3 = () => {
    if (!allChecked) return; // guard — tombol disabled jika belum semua dicek
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (hasBermasalah) {
      if (!dueDate)   { setSubmitError('Batas waktu perbaikan wajib diisi.'); return; }
      if (!message.trim()) { setSubmitError('Catatan perbaikan untuk mahasiswa wajib diisi.'); return; }
    } else {
      if (!selectedPeriodId) { setSubmitError('Pilih periode sidang terlebih dahulu.'); return; }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sidangRegistrationId: registration.id,
        isApproved:           !hasBermasalah,
        ...(hasBermasalah
          ? { dueDate, message, sidangPeriodId: null }
          : { sidangPeriodId: selectedPeriodId, dueDate: null, message: null }
        ),
        // Simpan status per berkas sebagai JSON string jika BE support
        berkasStatuses: JSON.stringify(berkasStatuses),
      };

      await upsertSidangRegistrationResponse(payload, existingResponseId);
      onSaved?.({ hasBermasalah, selectedPeriodId });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentName = registration?.student?.name || 'Mahasiswa';
  const nim         = registration?.student?.nim  || '';

  // Unchecked count for step 2 warning
  const uncheckedCount = uploads.filter(u => !berkasStatuses[u.id] || berkasStatuses[u.id] === BERKAS_STATUS.UNCHECKED).length;

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
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
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
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
              Verifikasi Berkas — {studentName}
            </h3>
          </div>
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
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '0 24px 24px' }}>
                <Step1 registration={registration} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ height: '100%' }}>
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
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '0 24px 24px' }}>
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
          {/* Left side */}
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

          {/* Right side */}
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
                onClick={step === 1 ? () => setStep(2) : handleNextToStep3}
                disabled={step === 2 && !allChecked}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: (step === 2 && !allChecked) ? '#E2E8F0' : (step === 2 && hasBermasalah ? '#D97706' : '#C0182A'),
                  color: (step === 2 && !allChecked) ? '#94A3B8' : '#fff',
                  border: 'none', cursor: (step === 2 && !allChecked) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {step === 1
                  ? <> Langkah Selanjutnya: Periksa Berkas <ChevronRight size={16} /></>
                  : step === 2 && hasBermasalah
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
                  border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isSubmitting
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                  : hasBermasalah
                    ? <><MessageSquare size={16} /> Kirim Permintaan Revisi</>
                    : <><CheckCircle2 size={16} /> Verifikasi & Selesai Setuju</>
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