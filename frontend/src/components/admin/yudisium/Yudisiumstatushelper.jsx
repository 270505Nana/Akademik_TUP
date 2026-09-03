/**
 * Yudisiumstatushelper.js
 *
 * Alur status (dari sudut pandang admin):
 *   DALAM_PROSES
 *     ↓ (admin set revisi → response.isEdit = timestamp, registration.isDraft = true)
 *   PERLU_REVISI          (isDraft=true, isEdit not null, submittedAt null)
 *     ↓ (mahasiswa resubmit → BE clear isEdit jadi null, submittedAt terisi, isDraft = false)
 *   REVISI_DIPERBARUI     (submittedAt not null, isEdit sudah di-clear BE)
 *     ↓ (admin approve semua dok → yudisiumPeriodId terisi di registration)
 *   SIAP_YUDISIUM         (yudisiumPeriod.isOpen === true)
 *   PENDAFTARAN_DITERIMA  (yudisiumPeriod.isOpen === false)
 */

export const STATUS_YUDISIUM = {
  BELUM_DAFTAR         : 'belum-daftar',
  PROSES_REGISTRASI    : 'proses-registrasi',
  DALAM_PROSES         : 'dalam-proses',
  PERLU_REVISI         : 'perlu-revisi',
  REVISI_DIPERBARUI    : 'revisi-diperbarui',
  SIAP_YUDISIUM        : 'siap-yudisium',
  PENDAFTARAN_DITERIMA : 'pendaftaran-diterima',
};

export const YUDISIUM_STATUS_CONFIG = {
  [STATUS_YUDISIUM.BELUM_DAFTAR]: {
    label       : 'Belum Daftar',
    badgeBg     : '#F1F5F9',
    badgeColor  : '#475569',
    borderColor : '#CBD5E1',
  },
  [STATUS_YUDISIUM.PROSES_REGISTRASI]: {
    label       : 'Proses Registrasi',
    badgeBg     : '#EFF6FF',
    badgeColor  : '#1D4ED8',
    borderColor : '#BFDBFE',
  },
  [STATUS_YUDISIUM.DALAM_PROSES]: {
    label       : 'Dalam Proses',
    badgeBg     : '#FEF3C7',
    badgeColor  : '#92400E',
    borderColor : '#FDE68A',
  },
  [STATUS_YUDISIUM.PERLU_REVISI]: {
    label       : 'Perlu Revisi',
    badgeBg     : '#FEF2F2',
    badgeColor  : '#991B1B',
    borderColor : '#FECACA',
  },
  [STATUS_YUDISIUM.REVISI_DIPERBARUI]: {
    label       : 'Revisi Diperbarui',
    badgeBg     : '#F0FDF4',
    badgeColor  : '#166534',
    borderColor : '#BBF7D0',
  },
  [STATUS_YUDISIUM.SIAP_YUDISIUM]: {
    label       : 'Siap Yudisium',
    badgeBg     : '#DCFCE7',
    badgeColor  : '#166534',
    borderColor : '#86EFAC',
  },
  [STATUS_YUDISIUM.PENDAFTARAN_DITERIMA]: {
    label       : 'Pendaftaran Diterima',
    badgeBg     : '#EDE9FE',
    badgeColor  : '#5B21B6',
    borderColor : '#DDD6FE',
  },
};

export const determineYudisiumStatus = (registration, response, period) => {
  if (!registration) return STATUS_YUDISIUM.BELUM_DAFTAR;

  const isEdit = registration.isEdit !== undefined && registration.isEdit !== null
    ? registration.isEdit
    : (response ? response.isEdit : null);

  if (registration.isDraft && !isEdit) return STATUS_YUDISIUM.PROSES_REGISTRASI;

  if (!registration.isDraft && !isEdit && !registration.yudisiumPeriodId) return STATUS_YUDISIUM.DALAM_PROSES;

  if (isEdit !== null && isEdit !== undefined) {
    return STATUS_YUDISIUM.PERLU_REVISI;
  }

  if (registration.yudisiumPeriodId && period) {
    const now       = new Date();
    const startDate = new Date(period.startDate);
    const endDate   = new Date(period.endDate);
    const isActive  = now >= startDate && now <= endDate;
    return isActive
      ? STATUS_YUDISIUM.SIAP_YUDISIUM
      : STATUS_YUDISIUM.PENDAFTARAN_DITERIMA;
  }

  if (registration.submittedAt && isEdit) return STATUS_YUDISIUM.REVISI_DIPERBARUI;

  return STATUS_YUDISIUM.DALAM_PROSES;
};