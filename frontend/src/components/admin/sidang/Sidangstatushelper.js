/**
 * Alur status:
 *   BELUM_DAFTAR → DRAFT → DALAM_PROSES → PERLU_REVISI → REVISI_DIPERBARUI
 *                                        ↘ PENDAFTARAN_DITERIMA
 *                                                        → SIAP_SIDANG
 */

export const STATUS_SIDANG = {
  BELUM_DAFTAR         : 'belum-daftar',
  DRAFT                : 'draft',
  DALAM_PROSES         : 'dalam-proses',
  PERLU_REVISI         : 'perlu-revisi',
  REVISI_DIPERBARUI    : 'revisi-diperbarui',
  PENDAFTARAN_DITERIMA : 'pendaftaran-diterima', // dijadwalkan, periode BELUM/SUDAH aktif
  SIAP_SIDANG          : 'siap-sidang',          // dijadwalkan, periode SEDANG aktif
};

export const SIDANG_STATUS_CONFIG = {
  [STATUS_SIDANG.BELUM_DAFTAR]: {
    label  : 'Belum Daftar',
    bg     : '#F1F5F9',
    color  : '#475569',
    border : '#CBD5E1',
  },
  [STATUS_SIDANG.DRAFT]: {
    label  : 'Proses Registrasi',
    bg     : '#EFF6FF',
    color  : '#1D4ED8',
    border : '#BFDBFE',
  },
  [STATUS_SIDANG.DALAM_PROSES]: {
    label  : 'Dalam Proses',
    bg     : '#FEF3C7',
    color  : '#92400E',
    border : '#FDE68A',
  },
  [STATUS_SIDANG.PERLU_REVISI]: {
    label  : 'Perlu Revisi',
    bg     : '#FEF2F2',
    color  : '#991B1B',
    border : '#FECACA',
  },
  [STATUS_SIDANG.REVISI_DIPERBARUI]: {
    label  : 'Revisi Diperbarui',
    bg     : '#F0FDF4',
    color  : '#166534',
    border : '#BBF7D0',
  },
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA]: {
    label  : 'Pendaftaran Diterima',
    bg     : '#EDE9FE',
    color  : '#5B21B6',
    border : '#DDD6FE',
  },
  [STATUS_SIDANG.SIAP_SIDANG]: {
    label  : 'Siap Sidang',
    bg     : '#DCFCE7',
    color  : '#166534',
    border : '#86EFAC',
  },
};

export const getUploadSummary = (uploads = []) => {
  if (!Array.isArray(uploads)) return { checked: 0, total: 0, valid: 0, invalid: 0 };
  const total   = uploads.length;
  const valid   = uploads.filter(u => u.isValid === true).length;
  const invalid = uploads.filter(u => u.isValid === false).length;
  const checked = valid + invalid;
  return { checked, total, valid, invalid };
};

export const allUploadsChecked = (uploads = []) => {
  if (!Array.isArray(uploads) || uploads.length === 0) return false;
  return uploads.every(u => u.isValid !== null);
};

export const hasInvalidUploads = (uploads = []) => {
  if (!Array.isArray(uploads)) return false;
  return uploads.some(u => u.isValid === false);
};

export const hasResubmittedFiles = (uploads = []) => {
  if (!Array.isArray(uploads) || uploads.length === 0) return false;
  return uploads.some(u => new Date(u.updatedAt) > new Date(u.createdAt));
};

export const isAdminVerifiable = (registration) => {
  if (!registration) return false;
  return registration.isDraft === false;
};

export const isRegistrationEditable = (registration) => {
  if (!registration) return false;
  return registration.isDraft === true;
};

/**
 * determineSidangStatus
 *  1. BELUM_DAFTAR         : registration null
 *  2. DRAFT                : isDraft=true, belum ada response
 *  3. PERLU_REVISI         : response ada, isEdit not null, belum reupload
 *  4. REVISI_DIPERBARUI    : response ada, isEdit not null, sudah reupload
 *  5. DALAM_PROSES         : isDraft=false, belum ada response
 *  6. SIAP_SIDANG          : response ada, isEdit null, sidangPeriod ada & isOpen=true
 *  7. PENDAFTARAN_DITERIMA : response ada, isEdit null, sidangPeriod ada & isOpen=false
 */
export const determineSidangStatus = (
  registration,
  response,
  _period,
  uploads = [],
) => {
  //Belum pernah registrasi
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  // Draft
  if (registration.isDraft && !response) return STATUS_SIDANG.DRAFT;

  //Admin beri catatan revisi
  if (response?.isEdit) {
    return hasResubmittedFiles(uploads)
      ? STATUS_SIDANG.REVISI_DIPERBARUI
      : STATUS_SIDANG.PERLU_REVISI;
  }

  // Submit tapi admin belum respons
  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  // Response ada, isEdit null → berkas valid
  // Cek admin sudah assign periode sidang?
  const assignedPeriod = response?.sidangPeriod ?? response?.sidangPeriodData ?? null;

  if (assignedPeriod) {
    // Periode yang dipilihkan admin sedang aktif → Siap Sidang
    if (assignedPeriod.isOpen === true) return STATUS_SIDANG.SIAP_SIDANG;
    // Periode ada tapi belum/sudah aktif → Pendaftaran Diterima
    return STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }
  return STATUS_SIDANG.PENDAFTARAN_DITERIMA;
};