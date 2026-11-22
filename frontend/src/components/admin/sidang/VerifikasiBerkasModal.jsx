import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, XCircle, User, Hash, BookOpen, GraduationCap, FileText, Calendar, MessageSquare, Clock, Check, Loader, AlertTriangle, Download, Languages, Link as LinkIcon, ExternalLink, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { downloadSidangRegistrationUpload, getSidangRegistrationById, approveSidangRegistration, rejectSidangRegistration, getTemplatesByCategory, adminEditSidangRegistration } from '../../../service/api';
import { DOCUMENT_CONFIG, SECTIONS, getEffectiveSidangSchemeAndJalur } from '../../../requirement/sidangDocument';
import { humanizeDocName } from '../../../utils/textHelper';

const isLinkPaperUpload = (u) => {
  if (!u) return false;
  const slug = (u.category || u.templateCode || u.slug || '').toLowerCase();
  const name = (u.officialName || u.name || '').toLowerCase();
  return slug.includes('lampiran-link-paper') || name.includes('link paper');
};

const BERKAS_STATUS = { SESUAI: 'sesuai', BERMASALAH: 'bermasalah', UNCHECKED: 'unchecked' };

const SKEMA_OPTIONS = [
  { value: 'Sidang Reguler', label: 'Sidang Reguler', desc: 'Sidang presentasi tugas akhir secara reguler' },
  { value: 'Non Sidang', label: 'Non Sidang', desc: 'Jalur kelulusan alternatif (Publikasi / HKI)' },
];

const JALUR_NON_SIDANG_OPTIONS = [
  'Publikasi Jurnal',
  'Proceeding International',
  'HKI',
];

const SLUG_TO_NAME = Object.values(DOCUMENT_CONFIG)
  .flat()
  .reduce((acc, doc) => { acc[doc.slug] = doc.name; return acc; }, {});

const getBerkasName = (upload, templateMap = {}) => {
  if (!upload) return 'Berkas';
  const cat = upload.category || upload.slug;
  if (templateMap && cat && templateMap[cat]) {
    return templateMap[cat];
  }
  if (cat && SLUG_TO_NAME[cat]) {
    return humanizeDocName(SLUG_TO_NAME[cat]);
  }
  if (cat) {
    return humanizeDocName(cat);
  }
  return upload.name || upload.filename || 'Berkas';
};

const CLR = {
  red: '#C0182A',
  green: '#16A34A',
  orange: '#D97706',
  border: '#E2E8F0',
  muted: '#94A3B8',
  text: '#1E293B',
  sub: '#64748B',
};

const STEPS = [
  { n: 1, label: 'Data Diri & Akademik' },
  { n: 2, label: 'Periksa Berkas & Dokumen' },
  { n: 3, label: 'Finalisasi' },
];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '0 0 28px 0' }}>
    {STEPS.map((s, i) => {
      const done = s.n < current;
      const active = s.n === current;
      return (
        <React.Fragment key={s.n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? CLR.green : active ? CLR.red : '#E5E7EB', color: done || active ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease' }}>
              {done ? <Check size={16} /> : s.n}
            </div>
            <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: done ? CLR.green : active ? CLR.red : '#9CA3AF', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div style={{ height: 2, width: 80, background: done ? CLR.green : CLR.border, margin: '0 8px', marginBottom: 22, transition: 'background 0.3s ease' }} />}
        </React.Fragment>
      );
    })}
  </div>
);

const InfoCard = ({ label, value, icon: Icon, highlight }) => (
  <div style={{ background: '#F8FAFC', border: `1px solid ${CLR.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={CLR.red} />
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? CLR.red : CLR.text, lineHeight: 1.4 }}>{value || '-'}</div>
    </div>
  </div>
);

const Step1 = ({ registration, prodiName, onEditSaved }) => {
  const s = registration?.mahasiswa || registration?.student || {};
  const r = registration || {};
  const dosenInfo = [r.dosenPembimbing1?.name, r.dosenPembimbing2?.name].filter(Boolean).join(' & ') || '-';

  // Format Skema dan Jalur Non-Sidang (prioritaskan keputusan final admin)
  const { scheme: resolvedScheme, jalur: resolvedJalur } = getEffectiveSidangSchemeAndJalur(r);
  const rawScheme = resolvedScheme || 'Sidang Reguler';
  const isNonSidang = rawScheme.toLowerCase().includes('non');
  const jalurList = isNonSidang && resolvedJalur.length > 0
    ? ` (${resolvedJalur.join(', ')})`
    : '';
  const schemeDisplay = `${rawScheme}${jalurList}`;
  const judulIndonesia = r.judulTugasAkhirIndonesia || r.thesisTitleId || '-';
  const judulInggris = r.judulTugasAkhirInggris || r.thesisTitleEn || '';

  // --- Edit state ---
  const [isEditing, setIsEditing] = useState(false);
  const [editProgram, setEditProgram] = useState('');
  const [editJudulId, setEditJudulId] = useState('');
  const [editJudulEn, setEditJudulEn] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    setEditProgram(r.program || '');
    setEditJudulId(r.judulTugasAkhirIndonesia || r.thesisTitleId || '');
    setEditJudulEn(r.judulTugasAkhirInggris || r.thesisTitleEn || '');
    setIsEditing(false);
    setEditError(null);
    setEditSuccess(false);
  }, [registration]);

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const originalProgram = r.program || '';
      const originalJudulId = r.judulTugasAkhirIndonesia || r.thesisTitleId || '';
      const originalJudulEn = r.judulTugasAkhirInggris || r.thesisTitleEn || '';

      const payload = {};
      if (editProgram !== originalProgram) payload.program = editProgram || null;
      if (editJudulId !== originalJudulId) payload.judulTugasAkhirIndonesia = editJudulId || null;
      if (editJudulEn !== originalJudulEn) payload.judulTugasAkhirInggris = editJudulEn || null;

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const updated = await adminEditSidangRegistration(r.id, payload);
      setIsEditing(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
      if (onEditSaved) onEditSaved(updated);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan perubahan. Silakan coba lagi.';
      setEditError(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div>
      {/* Header Tahap 1 + tombol Edit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 20, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={16} color={CLR.red} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tahap 1: Informasi Mahasiswa</span>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1.5px solid #FECACA', background: '#fff', color: '#B91C1C', cursor: 'pointer' }}
          >
            <Pencil size={12} /> Edit Data
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <InfoCard label="Dosen Wali" icon={User} value={s.dosenWali?.name || r.dosenWali?.name || '-'} />
        <InfoCard label="Nomor Telepon Mahasiswa" icon={Hash} value={s.phone || '-'} />
        <InfoCard label="Program Studi Terdaftar" icon={BookOpen} value={prodiName} />

        {/* Program — editable */}
        {isEditing ? (
          <div style={{ background: '#F8FAFC', border: `1px solid ${CLR.red}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Program</div>
            <select
              value={editProgram}
              onChange={e => setEditProgram(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: CLR.text }}
            >
              <option value="">— Pilih Program —</option>
              <option value="Reguler">Reguler</option>
              <option value="Alih Jenjang">Alih Jenjang</option>
            </select>
          </div>
        ) : (
          <InfoCard label="Program" icon={GraduationCap} value={r.program || '-'} />
        )}

        <InfoCard label="Skema / Jalur Tugas Akhir" icon={GraduationCap} value={schemeDisplay} />

        <InfoCard
          label="Status Test Bahasa"
          icon={Languages}
          value={
            r.lulusTesBahasa === true
              ? "Sudah Memenuhi (≥450)"
              : r.lulusTesBahasa === false
                ? "Belum Memenuhi"
                : "Belum Dipilih"
          }
        />
        <InfoCard
          label="Batas Akhir SKTA"
          icon={Calendar}
          value={r.sktaExpDate ? new Date(r.sktaExpDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        />
        <InfoCard label="Total SKS" icon={Hash} value={r.sks != null ? `${r.sks} SKS` : '-'} />

        {/* Judul Indonesia — editable */}
        {isEditing ? (
          <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', border: `1px solid ${CLR.red}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Judul Tugas Akhir (Indonesia)</div>
            <textarea
              value={editJudulId}
              onChange={e => setEditJudulId(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: CLR.text, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <InfoCard label="Judul Tugas Akhir (Indonesia)" icon={FileText} value={judulIndonesia} highlight />
          </div>
        )}

        {/* Judul Inggris — editable (selalu tampil saat edit agar bisa diisi) */}
        {isEditing ? (
          <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', border: `1px solid ${CLR.red}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Judul Tugas Akhir (Inggris)</div>
            <textarea
              value={editJudulEn}
              onChange={e => setEditJudulEn(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: CLR.text, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        ) : judulInggris ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <InfoCard label="Judul Tugas Akhir (Inggris)" icon={FileText} value={judulInggris} />
          </div>
        ) : null}

        <div style={{ gridColumn: '1 / -1' }}>
          <InfoCard label="Dosen Pembimbing" icon={User} value={dosenInfo} />
        </div>
      </div>

      {/* Tombol Simpan/Batal + error saat mode edit */}
      {isEditing && (
        <div style={{ marginTop: 16 }}>
          {editError && (
            <div style={{ marginBottom: 10, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
              {editError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setIsEditing(false); setEditError(null); }}
              disabled={isSavingEdit}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #CBD5E1', background: '#fff', color: '#374151', cursor: 'pointer' }}
            >
              Batal
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', background: CLR.red, color: '#fff', cursor: isSavingEdit ? 'not-allowed' : 'pointer', opacity: isSavingEdit ? 0.7 : 1 }}
            >
              {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Notifikasi sukses setelah simpan */}
      {editSuccess && !isEditing && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={15} /> Data berhasil diperbarui.
        </div>
      )}
    </div>
  );
};

const VerifButton = ({ active, onClick, color, label, disabled = false }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      border: `1.5px solid ${disabled ? '#E2E8F0' : active ? color : '#D1D5DB'}`,
      background: disabled ? '#F8FAFC' : active ? (color === CLR.green ? '#DCFCE7' : '#FEE2E2') : '#fff',
      color: disabled ? '#94A3B8' : active ? color : '#6B7280',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.15s',
    }}
  >
    <div style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, background: disabled ? 'transparent' : active ? color : 'transparent', border: `2px solid ${disabled ? '#CBD5E1' : active ? color : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!disabled && active && <Check size={8} color="#fff" strokeWidth={3} />}
    </div>
    {label}
  </button>
);

const NavBtn = ({ onClick, disabled, children, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{ width: 24, height: 24, borderRadius: 5, border: `1px solid ${CLR.border}`, background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? '#D1D5DB' : '#374151', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
    {children}
  </button>
);

const Step2 = ({ uploads, berkasStatuses, onToggle, previewFile, onPreview, onDownload, loadingFileId, loadingUploads, fileError, templateMap }) => {
  const currentIdx = uploads.findIndex(u => u.id === previewFile?.id);
  const currentStatus = berkasStatuses[previewFile?.id];

  return (
    <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${CLR.border}`, overflowY: 'auto', padding: '10px 0', height: '100%' }}>
        <div style={{ padding: '0 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Lampiran Berkas ({uploads.length})</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: '#DCFCE7', color: CLR.green }}>{Object.values(berkasStatuses).filter(v => v === BERKAS_STATUS.SESUAI).length} Sesuai</span>
        </div>
        {loadingUploads ? (
          <div style={{ padding: '20px 10px', fontSize: 12, color: '#9CA3AF', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Memuat...
          </div>
        ) : uploads.length === 0 ? (
          <div style={{ padding: '20px 10px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>Tidak ada berkas diunggah</div>
        ) : null}
        {uploads.map((upload, idx) => {
          const status = berkasStatuses[upload.id] || BERKAS_STATUS.UNCHECKED;
          const isActive = previewFile?.id === upload.id;
          const berkasName = getBerkasName(upload, templateMap);
          const isUploaded = upload.isUploaded !== false;
          const isLink = isLinkPaperUpload(upload);
          return (
            <div key={upload.id} onClick={() => onPreview(upload)} style={{ padding: '8px 10px', cursor: 'pointer', background: isActive ? '#FEF2F2' : 'transparent', borderLeft: isActive ? `3px solid ${CLR.red}` : '3px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', lineHeight: 1.3, marginBottom: 2 }}>{idx + 1}. {berkasName}</div>
                  {!isUploaded ? (
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: isLink ? '#2563EB' : '#94A3B8' }}>
                      {isLink ? 'OPSIONAL (BELUM DIISI)' : 'BELUM DIUNGGAH'}
                    </div>
                  ) : status !== BERKAS_STATUS.UNCHECKED && (
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: status === BERKAS_STATUS.SESUAI ? CLR.green : '#DC2626' }}>
                      {status === BERKAS_STATUS.SESUAI ? 'SESUAI' : 'BERMASALAH'}
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {status === BERKAS_STATUS.SESUAI ? (
                    <CheckCircle2 size={14} color={CLR.green} />
                  ) : status === BERKAS_STATUS.BERMASALAH ? (
                    <XCircle size={14} color="#DC2626" />
                  ) : !isUploaded ? (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: isLink ? '1.5px dashed #93C5FD' : '1.5px dashed #CBD5E1' }} title={isLink ? "Opsional (belum diisi mahasiswa)" : "Belum diunggah mahasiswa"} />
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #D1D5DB' }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: '100%' }}>
        {previewFile ? (
          <>
            <div style={{ padding: '8px 14px', borderBottom: `1px solid ${CLR.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                {isLinkPaperUpload(previewFile) ? (
                  <LinkIcon size={13} color={CLR.red} style={{ flexShrink: 0 }} />
                ) : (
                  <FileText size={13} color={CLR.red} style={{ flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getBerkasName(previewFile, templateMap)}</span>
              </div>
              <button onClick={() => previewFile.isUploaded !== false && onDownload(previewFile)} disabled={previewFile.isUploaded === false || loadingFileId === previewFile.id} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fff', border: `1px solid ${CLR.border}`, cursor: previewFile.isUploaded === false ? 'not-allowed' : 'pointer', opacity: previewFile.isUploaded === false ? 0.5 : 1, color: '#374151' }}>
                {loadingFileId === previewFile.id ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />} Unduh
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: '#F8FAFC', overflow: 'auto', position: 'relative' }}>
              {previewFile.isUploaded === false ? (
                isLinkPaperUpload(previewFile) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24, textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                      <LinkIcon size={26} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>
                        Link Paper Belum Diisi (Opsional)
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', maxWidth: 340, lineHeight: 1.5 }}>
                        Mahasiswa belum mengisi link paper publikasi. Berkas ini bersifat opsional apabila publikasi paper belum terbit daring.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24, textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      <FileText size={26} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        Berkas Belum Diunggah
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', maxWidth: 320, lineHeight: 1.5 }}>
                        Mahasiswa belum mengunggah dokumen <strong>{getBerkasName(previewFile, templateMap)}</strong>.
                      </div>
                    </div>
                  </div>
                )
              ) : fileError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>File Tidak Ditemukan.</span>
                </div>
              ) : isLinkPaperUpload(previewFile) ? (
                previewFile.paperUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32, boxSizing: 'border-box' }}>
                    <div style={{ maxWidth: 540, width: '100%', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '24px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <LinkIcon size={24} />
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        Tautan Paper Publikasi
                      </h4>
                      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748B' }}>
                        Tautan yang dilampirkan oleh mahasiswa untuk publikasi tugas akhir:
                      </p>
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', marginBottom: 18, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12, color: '#0F172A', textAlign: 'left', maxHeight: 90, overflowY: 'auto' }}>
                        {previewFile.paperUrl}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const target = previewFile.paperUrl.startsWith('http://') || previewFile.paperUrl.startsWith('https://')
                            ? previewFile.paperUrl
                            : `https://${previewFile.paperUrl}`;
                          window.open(target, '_blank', 'noopener,noreferrer');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#2563EB')}
                      >
                        <ExternalLink size={14} /> Buka Link Paper
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#9CA3AF' }}>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 12 }}>Memuat tautan...</span>
                  </div>
                )
              ) : previewFile.blobUrl ? (
                previewFile.type === 'pdf' ? <iframe src={previewFile.blobUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title="Preview" /> : <img src={previewFile.blobUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', margin: 'auto', display: 'block', padding: 12 }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#9CA3AF' }}><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 12 }}>Memuat berkas...</span></div>
              )}
            </div>
            <div style={{ flexShrink: 0, padding: '6px 12px', borderTop: `1px solid ${CLR.border}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 -2px 6px rgba(0,0,0,0.04)' }}>
              <NavBtn onClick={() => currentIdx > 0 && onPreview(uploads[currentIdx - 1])} disabled={currentIdx <= 0} title="Berkas sebelumnya">←</NavBtn>
              <NavBtn onClick={() => currentIdx < uploads.length - 1 && onPreview(uploads[currentIdx + 1])} disabled={currentIdx >= uploads.length - 1} title="Berkas selanjutnya">→</NavBtn>
              <div style={{ width: 1, height: 16, background: CLR.border, margin: '0 2px' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Verifikasi:</span>
              <VerifButton active={currentStatus === BERKAS_STATUS.SESUAI} onClick={() => previewFile.isUploaded !== false && onToggle(previewFile.id, BERKAS_STATUS.SESUAI)} color={CLR.green} label="Sesuai / Valid" disabled={previewFile.isUploaded === false} />
              <VerifButton active={currentStatus === BERKAS_STATUS.BERMASALAH} onClick={() => onToggle(previewFile.id, BERKAS_STATUS.BERMASALAH)} color="#DC2626" label="Bermasalah" />
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{currentIdx + 1} / {uploads.length}</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#9CA3AF' }}><FileText size={32} strokeWidth={1} /><span style={{ fontSize: 13 }}>Pilih berkas dari daftar kiri untuk memeriksa</span></div>
        )}
      </div>
    </div>
  );
};

const Step3Revisi = ({ berkasStatuses, uploads, dueDate, setDueDate, message, setMessage, templateMap }) => {
  const bermasalah = uploads.filter(u => berkasStatuses[u.id] === BERKAS_STATUS.BERMASALAH);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, marginBottom: 20 }}>
        <AlertTriangle size={16} color={CLR.orange} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Ditemukan {bermasalah.length} berkas bermasalah — mahasiswa perlu melakukan perbaikan</span>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: CLR.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Berkas Perlu Diperbaiki</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bermasalah.map((u, i) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8 }}>
              <XCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>{i + 1}. {getBerkasName(u, templateMap)}</span>
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
          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
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
          onBlur={e => e.target.style.borderColor = '#CBD5E1'}
        />
      </div>
    </div>
  );
};

const Step3Approve = ({
  periods,
  selectedPeriodId,
  onSelectPeriod,
  uploads,
  schemeFinal,
  onSelectScheme,
  jalurNonSidangFinal,
  onToggleJalur,
}) => {
  const isNonSidang = String(schemeFinal || '').toLowerCase().includes('non');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 20 }}>
        <CheckCircle2 size={16} color={CLR.green} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Semua {uploads.length} berkas telah diverifikasi sesuai - tentukan skema final dan pilih periode sidang untuk mahasiswa ini</span>
      </div>

      {/* Pilihan Skema Sidang Final */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          <GraduationCap size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Skema Sidang Final *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SKEMA_OPTIONS.map((opt) => {
            const isSelected = schemeFinal === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => onSelectScheme(opt.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: `2px solid ${isSelected ? CLR.red : CLR.border}`,
                  background: isSelected ? '#FEF2F2' : '#fff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: 1,
                  border: `2px solid ${isSelected ? CLR.red : '#D1D5DB'}`,
                  background: isSelected ? CLR.red : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? CLR.red : CLR.text }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 11, color: CLR.sub, marginTop: 2, lineHeight: 1.3 }}>
                    {opt.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Jalur Non-Sidang (jika skema Non Sidang) */}
        {isNonSidang && (
          <div style={{
            marginTop: 12,
            padding: '12px 14px',
            background: '#F8FAFC',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
          }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: CLR.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Jalur Non-Sidang Final *
            </label>
            <div style={{ fontSize: 11, color: CLR.sub, marginBottom: 10 }}>
              Pilih opsi jalur publikasi/HKI yang disetujui (dapat memilih lebih dari satu)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {JALUR_NON_SIDANG_OPTIONS.map((opt) => {
                const isChecked = Array.isArray(jalurNonSidangFinal) && jalurNonSidangFinal.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => onToggleJalur(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1.5px solid ${isChecked ? CLR.red : '#CBD5E1'}`,
                      background: isChecked ? '#FEF2F2' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${isChecked ? CLR.red : '#94A3B8'}`,
                      background: isChecked ? CLR.red : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isChecked && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: isChecked ? 700 : 500,
                      color: isChecked ? CLR.red : CLR.text,
                    }}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}><Calendar size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Periode Sidang *</label>
        {periods.length === 0 ? (
          <div style={{ padding: '16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} /> Belum ada periode sidang yang tersedia. Buat periode terlebih dahulu di menu Atur Periode.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {periods
              .filter(p => new Date(p.endDate) >= new Date())
              .map(p => {
                const now = new Date();
                const start = new Date(p.startDate);
                const end = new Date(p.endDate);
                const status = now >= start && now <= end ? 'Aktif'
                  : now < start ? 'Mendatang'
                    : 'Selesai';
                const statusColor = status === 'Aktif' ? CLR.green : status === 'Mendatang' ? '#1D4ED8' : CLR.sub;
                const statusBg = status === 'Aktif' ? '#DCFCE7' : status === 'Mendatang' ? '#DBEAFE' : '#F1F5F9';
                const isSelected = selectedPeriodId === p.id;
                const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

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
};

//  VerifikasiBerkasModal (Main) 

const getInitialScheme = (reg) => {
  const raw = reg?.skemaSidangFinal || reg?.skemaSidang || reg?.sidangScheme || 'Sidang Reguler';
  if (String(raw).toLowerCase().includes('non')) {
    return 'Non Sidang';
  }
  return 'Sidang Reguler';
};

const getInitialJalur = (reg) => {
  if (Array.isArray(reg?.jalurNonSidangFinal) && reg.jalurNonSidangFinal.length > 0) {
    return reg.jalurNonSidangFinal;
  }
  if (typeof reg?.jalurNonSidangFinal === 'string' && reg.jalurNonSidangFinal.trim()) {
    return reg.jalurNonSidangFinal.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(reg?.jalurNonSidang) && reg.jalurNonSidang.length > 0) {
    return reg.jalurNonSidang;
  }
  return [];
};

const VerifikasiBerkasModal = ({
  registration,
  academicStaffId,
  adminId,
  periodMap,
  onClose,
  onSaved,
}) => {
  const [step, setStep] = useState(1);
  const [berkasStatuses, setBerkasStatuses] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [loadingFileId, setLoadingFileId] = useState(null);
  // Ref untuk menandai bahwa berkas pertama belum di-auto-preview untuk registration saat ini
  const initialPreviewDoneRef = React.useRef(false);
  const [schemeFinal, setSchemeFinal] = useState(() => getInitialScheme(registration));
  const [jalurNonSidangFinal, setJalurNonSidangFinal] = useState(() => getInitialJalur(registration));
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [existingResponseId, setExistingResponseId] = useState(null);
  const [rawUploads, setRawUploads] = useState([]);
  const [activeTemplates, setActiveTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [templateMap, setTemplateMap] = useState({});
  // localRegistration: salinan lokal yang diperbarui saat admin edit Step1
  const [localRegistration, setLocalRegistration] = useState(registration);

  useEffect(() => {
    setLocalRegistration(registration);
  }, [registration]);

  const handleStep1EditSaved = (updatedReg) => {
    setLocalRegistration(updatedReg);
  };

  const m = localRegistration?.mahasiswa || localRegistration?.student;
  const prodiName = m?.studyProgram?.name ?? '-';
  const periods = Object.values(periodMap ?? {}).filter(p => p?.category === 'pelaksanaan');

  // Fetch daftar template berkas wajib, test bahasa, dan non-sidang aktif dari backend
  const [decision, setDecision] = useState(null); // null | 'approve' | 'reject'

  // Inisialisasi otomatis sebagai SARAN awal (bukan pemaksaan), supaya tetap membantu admin:
  useEffect(() => {
    if (step === 3 && decision === null) {
      setDecision(hasBermasalah ? 'reject' : 'approve');
    }
  }, [step]);
  useEffect(() => {
    let isMounted = true;
    setLoadingTemplates(true);

    const categoriesToFetch = ["Sidang - Berkas Wajib"];
    if (registration?.lulusTesBahasa === true) {
      categoriesToFetch.push("Sidang - Berkas Tes Bahasa (Sudah)");
    } else if (registration?.lulusTesBahasa === false) {
      categoriesToFetch.push("Sidang - Berkas Tes Bahasa (Belum)");
    }

    const { scheme: effectiveScheme, jalur: effectiveJalur } = getEffectiveSidangSchemeAndJalur(registration);
    const isNonSidang = String(effectiveScheme || "").toLowerCase().includes("non");

    if (isNonSidang && Array.isArray(effectiveJalur)) {
      effectiveJalur.forEach((jalur) => {
        if (jalur === "Publikasi Jurnal") categoriesToFetch.push("Sidang - Evidence Non Sidang Publikasi Jurnal");
        else if (jalur === "Proceeding International") categoriesToFetch.push("Sidang - Evidence Non Sidang Proceeding International");
        else if (jalur === "HKI") categoriesToFetch.push("Sidang - Evidence Non Sidang HKI");
      });
    }

    Promise.all(
      categoriesToFetch.map((cat) => getTemplatesByCategory(cat).catch(() => []))
    )
      .then((results) => {
        if (!isMounted) return;
        const list = results.flat().filter(Boolean);
        setActiveTemplates(list);
        const map = {};
        list.forEach((t) => {
          map[t.code] = humanizeDocName(t.name);
        });
        setTemplateMap(map);
      })
      .catch((err) => {
        console.error("Gagal memuat template berkas di modal admin:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingTemplates(false);
      });
    return () => { isMounted = false; };
  }, [
    registration?.lulusTesBahasa,
    registration?.skemaSidang,
    registration?.skemaSidangFinal,
    registration?.jalurNonSidang,
    registration?.jalurNonSidangFinal,
  ]);

  // Fetch raw uploads dari registrasi sidang mahasiswa
  useEffect(() => {
    const initial = registration?.sidangRegistrationUploads;
    if (initial && initial.length > 0) { setRawUploads(initial); return; }
    if (!registration?.id) return;
    setLoadingUploads(true);
    getSidangRegistrationById(registration.id)
      .then(detail => setRawUploads(detail?.sidangRegistrationUploads ?? []))
      .catch(() => setRawUploads([]))
      .finally(() => setLoadingUploads(false));
  }, [registration?.id]);

  useEffect(() => {
    if (loadingTemplates) return;
    if (activeTemplates.length === 0 && rawUploads.length === 0) return;

    if (activeTemplates.length > 0) {
      const uploadsByCode = {};
      rawUploads.forEach((u) => {
        const code = u.category;
        if (!code) return;
        const existing = uploadsByCode[code];
        if (!existing || new Date(u.createdAt) > new Date(existing.createdAt)) {
          uploadsByCode[code] = u;
        }
      });

      const displayItems = activeTemplates.map((tpl) => {
        const match = uploadsByCode[tpl.code];
        if (match) {
          return {
            ...match,
            templateCode: tpl.code,
            officialName: humanizeDocName(tpl.name),
            isUploaded: true,
          };
        }
        return {
          id: `unuploaded-${tpl.code}`,
          category: tpl.code,
          templateCode: tpl.code,
          officialName: humanizeDocName(tpl.name),
          name: "",
          filename: "",
          filepath: null,
          isUploaded: false,
          isValid: null,
        };
      });

      setUploads(displayItems);

      // Inisialisasi/restore berkasStatuses untuk dokumen yang relevan saja
      const restored = {};
      displayItems.forEach((u) => {
        if (!u.isUploaded) {
          restored[u.id] = BERKAS_STATUS.UNCHECKED;
        } else if (u.isValid === true) {
          restored[u.id] = BERKAS_STATUS.SESUAI;
        } else if (u.isValid === false) {
          restored[u.id] = BERKAS_STATUS.BERMASALAH;
        } else {
          restored[u.id] = BERKAS_STATUS.UNCHECKED;
        }
      });
      setBerkasStatuses(restored);
    } else {
      setUploads(rawUploads);
    }
  }, [activeTemplates, rawUploads]);

  useEffect(() => {
    if (!registration) return;
    if (registration.isEdit) {
      const localDateString = new Date(registration.isEdit)
        .toLocaleDateString('en-CA');
      setDueDate(localDateString);
    }
    if (registration.message) setMessage(registration.message);
    const pId = registration.sidangPeriodId ?? null;
    if (pId) setSelectedPeriodId(pId);
    setSchemeFinal(getInitialScheme(registration));
    setJalurNonSidangFinal(getInitialJalur(registration));
  }, [registration]);

  // Reset previewFile ke berkas pertama setiap kali registration berubah (modal dibuka untuk mahasiswa baru)
  useEffect(() => {
    setPreviewFile(null);
    initialPreviewDoneRef.current = false;
  }, [registration?.id]);

  useEffect(() => {
    if (loadingUploads || loadingTemplates) return;
    if (uploads.length > 0 && !initialPreviewDoneRef.current) {
      initialPreviewDoneRef.current = true;
      handlePreview(uploads[0]);
    }
  }, [uploads, loadingUploads, loadingTemplates]);

  //  Derived values 
  const hasBermasalah = Object.values(berkasStatuses).some(v => v === BERKAS_STATUS.BERMASALAH);
  const allChecked = uploads.length > 0 && uploads.every(u => {
    // Berkas link paper bersifat opsional, jika belum diunggah mahasiswa tidak perlu memblokir admin
    if (!u.isUploaded && isLinkPaperUpload(u)) return true;
    return berkasStatuses[u.id] === BERKAS_STATUS.SESUAI || berkasStatuses[u.id] === BERKAS_STATUS.BERMASALAH;
  });
  const uncheckedCount = uploads.filter(u => {
    if (!u.isUploaded && isLinkPaperUpload(u)) return false;
    return !berkasStatuses[u.id] || berkasStatuses[u.id] === BERKAS_STATUS.UNCHECKED;
  }).length;

  const handleToggle = (uploadId, status) => {
    setBerkasStatuses(prev => ({
      ...prev,
      [uploadId]: prev[uploadId] === status ? BERKAS_STATUS.UNCHECKED : status,
    }));
  };

  const handleToggleJalurFinal = (opt) => {
    setJalurNonSidangFinal(prev => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.includes(opt)) {
        return list.filter(item => item !== opt);
      }
      return [...list, opt];
    });
  };

  const handlePreview = useCallback(async (upload) => {
    setPreviewFile(prev => prev?.id === upload.id ? prev : upload);
    setFileError(null);
    if (!upload.isUploaded || upload.blobUrl || upload.paperUrl) return;

    setLoadingFileId(upload.id);
    try {
      const blob = await downloadSidangRegistrationUpload(upload.id);
      const isLink = isLinkPaperUpload(upload);
      if (isLink) {
        const text = await blob.text();
        const paperUrl = (text || '').trim();
        const enriched = { ...upload, paperUrl, isLinkPaper: true, type: 'link' };
        setPreviewFile(enriched);
        setUploads(prev => prev.map(u => u.id === upload.id ? enriched : u));
      } else {
        const isPdf = blob.type.includes('pdf') || (upload.filename || '').toLowerCase().endsWith('.pdf');
        const blobUrl = URL.createObjectURL(blob);
        const enriched = { ...upload, blobUrl, type: isPdf ? 'pdf' : 'image' };
        setPreviewFile(enriched);
        setUploads(prev => prev.map(u => u.id === upload.id ? enriched : u));
      }
    } catch (err) {
      console.error('Preview error:', err);
      setFileError('File Tidak Ditemukan.');
    } finally {
      setLoadingFileId(null);
    }
  }, []);

  const handleDownload = useCallback(async (upload) => {
    if (!upload.isUploaded) return;
    setLoadingFileId(upload.id);
    try {
      const blob = await downloadSidangRegistrationUpload(upload.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
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

    // Gunakan profile.id (admin entity UUID) sebagai adminId.
    // Fallback ke academicStaffId jika adminId tidak tersedia.
    const currentAdminId = adminId || academicStaffId;
    if (!currentAdminId) {
      setSubmitError('ID staf akademik tidak ditemukan. Silakan logout dan login ulang.');
      return;
    }

    // Validasi format UUID sebelum mengirim ke BE agar error terjadi di FE dengan pesan yang jelas
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const LEGACY_INT_REGEX = /^\d+$/;
    const idString = String(currentAdminId);
    if (!UUID_REGEX.test(idString) && !LEGACY_INT_REGEX.test(idString)) {
      setSubmitError('ID staf akademik tidak valid. Pastikan data profil sudah dimuat — silakan logout dan login ulang.');
      return;
    }

    if (hasBermasalah) {
      if (!dueDate) { setSubmitError('Batas waktu perbaikan wajib diisi.'); return; }
      if (!message.trim()) { setSubmitError('Catatan perbaikan untuk mahasiswa wajib diisi.'); return; }
    } else {
      if (!schemeFinal) { setSubmitError('Pilih skema sidang final terlebih dahulu.'); return; }
      const isNonSidangFinal = String(schemeFinal || '').toLowerCase().includes('non');
      if (isNonSidangFinal && (!jalurNonSidangFinal || jalurNonSidangFinal.length === 0)) {
        setSubmitError('Pilih minimal satu jalur non-sidang final.');
        return;
      }
      if (!selectedPeriodId) { setSubmitError('Pilih periode sidang terlebih dahulu.'); return; }
    }

    const validUploadIds = uploads
      .filter(u => u.isUploaded && berkasStatuses[u.id] === BERKAS_STATUS.SESUAI)
      .map(u => u.id);

    setIsSubmitting(true);
    try {
      if (hasBermasalah) {
        const isEditDeadline = `${dueDate}T23:59:59+07:00`;
        await rejectSidangRegistration(registration.id, {
          adminId: currentAdminId,
          message: message.trim(),
          isEdit: isEditDeadline,
          sidangRegistrationUploadIds: validUploadIds,
        });
      } else {
        const isNonSidangFinal = String(schemeFinal || '').toLowerCase().includes('non');
        await approveSidangRegistration(registration.id, {
          adminId: currentAdminId,
          sidangPeriodId: selectedPeriodId,
          skemaSidangFinal: schemeFinal,
          jalurNonSidangFinal: isNonSidangFinal ? jalurNonSidangFinal.join(', ') : '',
          sidangRegistrationUploadIds: validUploadIds,
        });
      }
      onSaved?.();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentName = m?.name || 'Mahasiswa';
  const nim = m?.nim || '';

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        left: 'var(--sidebar-width, 260px)',
        zIndex: 1000,
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
          background: '#fff', borderRadius: 16, width: '100%',
          maxWidth: step === 2 ? 1100 : 720,
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
            Verifikasi Berkas - {studentName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: CLR.sub, background: '#F1F5F9', padding: '4px 12px', borderRadius: 9999 }}>NIM {nim}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: CLR.sub }}><X size={20} /></button>
          </div>
        </div>
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <StepIndicator current={step} />
        </div>
        <div style={{ flex: 1, overflow: step === 2 ? 'hidden' : 'auto', padding: step === 2 ? 0 : '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '0 24px 24px' }}>
                <Step1 registration={localRegistration} prodiName={prodiName} onEditSaved={handleStep1EditSaved} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                <Step2 uploads={uploads} loadingUploads={loadingUploads || loadingTemplates} berkasStatuses={berkasStatuses} onToggle={handleToggle} previewFile={previewFile} onPreview={handlePreview} onDownload={handleDownload} loadingFileId={loadingFileId} fileError={fileError} templateMap={templateMap} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '0 24px 24px' }}>
                {hasBermasalah ? (
                  <Step3Revisi berkasStatuses={berkasStatuses} uploads={uploads} dueDate={dueDate} setDueDate={setDueDate} message={message} setMessage={setMessage} templateMap={templateMap} />
                ) : (
                  <Step3Approve
                    periods={periods}
                    selectedPeriodId={selectedPeriodId}
                    onSelectPeriod={setSelectedPeriodId}
                    uploads={uploads}
                    schemeFinal={schemeFinal}
                    onSelectScheme={setSchemeFinal}
                    jalurNonSidangFinal={jalurNonSidangFinal}
                    onToggleJalur={handleToggleJalurFinal}
                  />
                )}
                {submitError && <div style={{ marginTop: 16, padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={15} />{submitError}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${CLR.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, background: '#FAFAFA' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {step === 2 && uncheckedCount > 0 && <span style={{ fontSize: 11, color: CLR.orange, fontWeight: 600 }}>{uncheckedCount} berkas belum diverifikasi</span>}
            {step > 1 && <button onClick={() => setStep(s => s - 1)} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: `1px solid ${CLR.border}`, background: '#fff', color: '#374151', cursor: 'pointer' }}><ChevronLeft size={16} /> Kembali</button>}
            {step < 3 ? (
              <button onClick={step === 1 ? () => setStep(2) : () => { if (allChecked) setStep(3); }} disabled={step === 2 && !allChecked} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: step === 2 && !allChecked ? '#E2E8F0' : step === 2 && hasBermasalah ? CLR.orange : CLR.red, color: step === 2 && !allChecked ? '#94A3B8' : '#fff', border: 'none', cursor: step === 2 && !allChecked ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {step === 1 ? <> Langkah Selanjutnya: Periksa Berkas <ChevronRight size={16} /></> : hasBermasalah ? <> Lanjut: Set Revisi <ChevronRight size={16} /></> : <> Lanjut: Pilih Periode <ChevronRight size={16} /></>}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: isSubmitting ? '#E2E8F0' : hasBermasalah ? CLR.orange : CLR.green, color: isSubmitting ? '#94A3B8' : '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {isSubmitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : hasBermasalah ? <><MessageSquare size={16} /> Kirim Permintaan Revisi</> : <><CheckCircle2 size={16} /> Verifikasi & Setujui</>}
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
