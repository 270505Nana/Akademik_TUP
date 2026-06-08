// Sisi admin dan mhs dashboard
// status registrasi sidang

export const STATUS_SIDANG = {
  BELUM_REGISTRASI    : 'belum-registrasi',
  PROSES_REGISTRASI   : 'proses-registrasi',
  DALAM_PROSES        : 'dalam-proses',
  REVISI              : 'revisi',
  REVISI_DIPERBARUI   : 'revisi-diperbarui',   //  mahasiswa sudah reupload, belum diverifikasi ulang
  SIAP_SIDANG         : 'siap-sidang',
  PENDAFTARAN_DITERIMA: 'pendaftaran-diterima',
};

export const SIDANG_STATUS_CONFIG = {
  [STATUS_SIDANG.BELUM_REGISTRASI]: {
    label      : 'Belum Registrasi',
    badgeBg    : '#F1F5F9',
    badgeColor : '#475569',
    borderColor: '#CBD5E1',
    desc       : 'Mahasiswa belum mengisi form pendaftaran sidang.',
  },
  [STATUS_SIDANG.PROSES_REGISTRASI]: {
    label      : 'Proses Registrasi',
    badgeBg    : '#EFF6FF',
    badgeColor : '#1D4ED8',
    borderColor: '#BFDBFE',
    desc       : 'Mahasiswa sedang mengisi form, belum disubmit.',
  },
  [STATUS_SIDANG.DALAM_PROSES]: {
    label      : 'Dalam Proses',
    badgeBg    : '#FEF9C3',
    badgeColor : '#854D0E',
    borderColor: '#FDE68A',
    desc       : 'Pendaftaran sudah disubmit, menunggu verifikasi admin.',
  },
  [STATUS_SIDANG.REVISI]: {
    label      : 'Revisi',
    badgeBg    : '#FEF2F2',
    badgeColor : '#DC2626',
    borderColor: '#FECACA',
    desc       : 'Admin menemukan berkas bermasalah. Menunggu perbaikan dari mahasiswa.',
  },
  [STATUS_SIDANG.REVISI_DIPERBARUI]: {
    label      : 'Revisi Diperbarui',
    badgeBg    : '#FFF7ED',
    badgeColor : '#C2410C',
    borderColor: '#FDBA74',
    desc       : 'Mahasiswa sudah mengirim ulang berkas revisi. Menunggu verifikasi ulang admin.',
  },
  [STATUS_SIDANG.SIAP_SIDANG]: {
    label      : 'Siap Sidang',
    badgeBg    : '#DCFCE7',
    badgeColor : '#16A34A',
    borderColor: '#BBF7D0',
    desc       : 'Berkas disetujui. Mahasiswa terdaftar di periode sidang yang sedang aktif.',
  },
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA]: {
    label      : 'Pendaftaran Diterima',
    badgeBg    : '#F0FDF4',
    badgeColor : '#15803D',
    borderColor: '#86EFAC',
    desc       : 'Berkas disetujui. Mahasiswa terdaftar di periode sidang (belum aktif).',
  },
};

//  Internal helper: deteksi resubmit 
/**
 * Cek apakah mahasiswa sudah reupload minimal satu file setelah admin set revisi.
 *
 * Indikator per upload:
 *   - isValid === null   → file sudah diganti (BE reset null saat reupload)
 *   - updatedAt > createdAt → row ini pernah di-update (bukan file pertama kali diupload)
 *
 * Kedua kondisi harus terpenuhi sekaligus supaya tidak false-positive:
 *   - isValid null saja bisa berarti file baru yang belum pernah diverifikasi
 *   - updatedAt > createdAt saja bisa berarti admin pernah update isValid sebelumnya

 */
const _hasResubmittedFile = (uploads) => {
  if (!Array.isArray(uploads) || uploads.length === 0) return false;
  return uploads.some(u => {
    if (u.isValid !== null && u.isValid !== undefined) return false;
    const created = new Date(u.createdAt);
    const updated = new Date(u.updatedAt);
    return updated > created;
  });
};

// JGN DIHAPUS YA GENGS
// determineSidangStatus 
/**
 * 1. Tidak ada registration                         : BELUM_REGISTRASI
 * 2. isDraft = true                                 : PROSES_REGISTRASI
 * 3. isDraft = false, tidak ada response            : DALAM_PROSES
 * 4. response ada, isEdit not null:
 *    a. Ada file reupload (isValid null + updatedAt > createdAt) : REVISI_DIPERBARUI
 *    b. Belum ada reupload                          : REVISI
 * 5. response ada, isEdit null, sidangPeriodId ada:
 *    - period.isOpen = true                         : SIAP_SIDANG
 *    - period.isOpen = false / period null          : PENDAFTARAN_DITERIMA
 * 6. response ada, isEdit null, sidangPeriodId null
 *    (BE belum assign periode / on process)         : DALAM_PROSES
 */
export const determineSidangStatus = (registration, response, period, uploads = []) => {

  if (!registration) return STATUS_SIDANG.BELUM_REGISTRASI;
  if (registration.isDraft === true) return STATUS_SIDANG.PROSES_REGISTRASI;
  if (!response) return STATUS_SIDANG.DALAM_PROSES;
  if (response.isEdit !== null && response.isEdit !== undefined) {
    return _hasResubmittedFile(uploads)
      ? STATUS_SIDANG.REVISI_DIPERBARUI
      : STATUS_SIDANG.REVISI;
  }

  if (response.sidangPeriodId) {
    if (!period) return STATUS_SIDANG.PENDAFTARAN_DITERIMA; 
    return period.isOpen === true
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  return STATUS_SIDANG.DALAM_PROSES;
};

export const getUploadSummary = (uploads = []) => {
  const safe = Array.isArray(uploads) ? uploads : [];
  return {
    total    : safe.length,
    valid    : safe.filter(u => u.isValid === true).length,
    invalid  : safe.filter(u => u.isValid === false).length,
    unchecked: safe.filter(u => u.isValid === null || u.isValid === undefined).length,
  };
};

/**
 * semua berkas sudah diverifikasi admin (tidak ada yang null)? enable/disable tombol "Lanjut" di step 2 modal.
 */
export const allUploadsChecked = (uploads = []) => {
  const safe = Array.isArray(uploads) ? uploads : [];
  if (safe.length === 0) return false;
  return safe.every(u => u.isValid === true || u.isValid === false);
};

/**
 * ada berkas yang invalid (isValid = false)?
 */
export const hasInvalidUploads = (uploads = []) =>
  Array.isArray(uploads) && uploads.some(u => u.isValid === false);

/**
 * mahasiswa sudah reupload setelah revisi?.
 */
export const hasResubmittedFiles = (uploads = []) => _hasResubmittedFile(uploads);

export const isAdminVerifiable = (status) =>
  ![STATUS_SIDANG.BELUM_REGISTRASI, STATUS_SIDANG.PROSES_REGISTRASI].includes(status);

export const isRegistrationEditable = (status) =>
  [STATUS_SIDANG.REVISI, STATUS_SIDANG.REVISI_DIPERBARUI, STATUS_SIDANG.PROSES_REGISTRASI].includes(status);