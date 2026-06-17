/**
 * Alur status:
 *   BELUM_DAFTAR → DRAFT → DALAM_PROSES → PERLU_REVISI → REVISI_DIPERBARUI
 *                                        ↘ PENDAFTARAN_DITERIMA
 *                                                        → SIAP_SIDANG
 */

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
/**
 * Alur status:
 *   BELUM_DAFTAR → DRAFT → DALAM_PROSES → PERLU_REVISI → REVISI_DIPERBARUI
 *                                        ↓ (admin approve + assign periode)
 *                                   PENDAFTARAN_DITERIMA (isOpen=false)
 *                                        ↓ (periode isOpen=true)
 *                                     SIAP_SIDANG
 *
 * Sumber data per field:
 *   registration  → GET /api/sidang-registrations
 *                   field: isDraft
 *   uploads       → registration.sidangRegistrationUploads[]
 *                   field: updatedAt, createdAt  (untuk deteksi resubmit)
 *   response      → GET /api/sidang-registration-responses/registration/{registrationId}
 *                   field: isEdit, message, sidangPeriod (nested object)
 *   assignedPeriod→ response.sidangPeriod ?? response.sidangPeriodData
 *                   field: isOpen
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

/**
 * isAdminVerifiable
 * Menerima status string — tombol "Verifikasi" ditampilkan hanya untuk status
 * yang masih perlu tindakan admin (bukan yang sudah selesai/terverifikasi).
 * Sumber: hasil determineSidangStatus()
 */
export const isAdminVerifiable = (status) => {
  return (
    status === STATUS_SIDANG.DALAM_PROSES    ||
    status === STATUS_SIDANG.PERLU_REVISI    ||
    status === STATUS_SIDANG.REVISI_DIPERBARUI
  );
};

export const isRegistrationEditable = (registration) => {
  if (!registration) return false;
  return registration.isDraft === true;
};

/**
 * determineSidangStatus
 *
 * Tabel kondisi:
 * | isDraft | response | isEdit   | upload updatedAt>createdAt | assignedPeriod | isOpen | Status               |
 * |---------|----------|----------|----------------------------|----------------|--------|----------------------|
 * | —       | —        | —        | —                          | —              | —      | BELUM_DAFTAR (reg=null) |
 * | true    | null     | —        | —                          | —              | —      | DRAFT                |
 * | false   | null     | —        | ada/tidak                  | —              | —      | DALAM_PROSES         |
 * | false   | not null | not null | tidak ada                  | —              | —      | PERLU_REVISI         |
 * | false   | not null | not null | ada                        | —              | —      | REVISI_DIPERBARUI    |
 * | false   | not null | null     | —                          | null           | —      | DALAM_PROSES         |
 * | false   | not null | null     | —                          | ada            | true   | SIAP_SIDANG          |
 * | false   | not null | null     | —                          | ada            | false  | PENDAFTARAN_DITERIMA |
 *
 * @param {object|null} registration - data dari GET /api/sidang-registrations
 * @param {object|null} response     - data dari GET /api/sidang-registration-responses/registration/{id}
 * @param {object|null} _period      - unused, kept for signature compat
 * @param {array}       uploads      - registration.sidangRegistrationUploads[]
 */
export const determineSidangStatus = (
  registration,
  response,
  _period,
  uploads = [],
) => {
  // 1. Belum pernah registrasi
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  // 2. Draft — belum disubmit, belum ada response
  if (registration.isDraft && !response) return STATUS_SIDANG.DRAFT;

  // 3. Sudah submit tapi admin belum beri response sama sekali
  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  // 4. Response ada → cek isEdit (admin beri catatan revisi)
  if (response?.isEdit != null) {
    // isEdit not null = admin sudah kirim permintaan revisi
    return hasResubmittedFiles(uploads)
      ? STATUS_SIDANG.REVISI_DIPERBARUI   // mahasiswa sudah reupload
      : STATUS_SIDANG.PERLU_REVISI;       // mahasiswa belum reupload
  }

  // 5. Response ada, isEdit null → admin approve, cek apakah sudah assign periode
  const assignedPeriod = response?.sidangPeriod ?? response?.sidangPeriodData ?? null;

  if (!assignedPeriod) {
    // Response sudah dibuat tapi periode belum di-assign → masih dalam proses verifikasi admin
    return STATUS_SIDANG.DALAM_PROSES;
  }

  // 6. Periode sudah di-assign → cek isOpen
  return assignedPeriod.isOpen === true
    ? STATUS_SIDANG.SIAP_SIDANG
    : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
};