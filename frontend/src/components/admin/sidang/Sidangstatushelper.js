/**
 * SidangStatusHelper.js
 *
 * Alur status (dari sudut pandang admin):
 *
 *   DALAM_PROSES
 *     ↓ (admin set revisi → response.isEdit = timestamp, registration.isDraft = true)
 *   PERLU_REVISI          (isDraft=true, response ada dengan isEdit not null, submittedAt null)
 *     ↓ (mahasiswa resubmit → BE clear isEdit jadi null, submittedAt terisi, isDraft = false)
 *   REVISI_DIPERBARUI     (submittedAt not null — cukup untuk deteksi, isEdit sudah di-clear BE)
 *     ↓ (admin approve semua dok → sidangPeriodId terisi di registration)
 *   SIAP_SIDANG           (sidangPeriod.isOpen === true)
 *   PENDAFTARAN_DITERIMA  (sidangPeriod.isOpen === false)
 *

 */


export const STATUS_SIDANG = {
  BELUM_DAFTAR         : 'belum-daftar',
  PROSES_REGISTRASI    : 'proses-registrasi',
  DALAM_PROSES         : 'dalam-proses',
  PERLU_REVISI         : 'perlu-revisi',
  REVISI_DIPERBARUI    : 'revisi-diperbarui',
  SIAP_SIDANG          : 'siap-sidang',
  PENDAFTARAN_DITERIMA : 'pendaftaran-diterima',
};


export const SIDANG_STATUS_CONFIG = {
  [STATUS_SIDANG.BELUM_DAFTAR]: {
    label       : 'Belum Daftar',
    badgeBg     : '#F1F5F9',
    badgeColor  : '#475569',
    borderColor : '#CBD5E1',
  },
  [STATUS_SIDANG.PROSES_REGISTRASI]: {
    label       : 'Proses Registrasi',
    badgeBg     : '#EFF6FF',
    badgeColor  : '#1D4ED8',
    borderColor : '#BFDBFE',
  },
  [STATUS_SIDANG.DALAM_PROSES]: {
    label       : 'Dalam Proses',
    badgeBg     : '#FEF3C7',
    badgeColor  : '#92400E',
    borderColor : '#FDE68A',
  },
  [STATUS_SIDANG.PERLU_REVISI]: {
    label       : 'Perlu Revisi',
    badgeBg     : '#FEF2F2',
    badgeColor  : '#991B1B',
    borderColor : '#FECACA',
  },
  [STATUS_SIDANG.REVISI_DIPERBARUI]: {
    label       : 'Revisi Diperbarui',
    badgeBg     : '#F0FDF4',
    badgeColor  : '#166534',
    borderColor : '#BBF7D0',
  },
  [STATUS_SIDANG.SIAP_SIDANG]: {
    label       : 'Siap Sidang',
    badgeBg     : '#DCFCE7',
    badgeColor  : '#166534',
    borderColor : '#86EFAC',
  },
  [STATUS_SIDANG.PENDAFTARAN_DITERIMA]: {
    label       : 'Pendaftaran Diterima',
    badgeBg     : '#EDE9FE',
    badgeColor  : '#5B21B6',
    borderColor : '#DDD6FE',
  },
};


export const determineSidangStatus = (registration, response, period) => {

  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  if (registration.isDraft && !response) return STATUS_SIDANG.PROSES_REGISTRASI;

  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  if (response && response.isEdit !== null && response.isEdit !== undefined) {
    return STATUS_SIDANG.PERLU_REVISI;
  }

  if (registration.sidangPeriodId && period) {
    const now       = new Date();
    const startDate = new Date(period.startDate);
    const endDate   = new Date(period.endDate);
    const isActive  = now >= startDate && now <= endDate;
    return isActive
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  if (registration.submittedAt && response) return STATUS_SIDANG.REVISI_DIPERBARUI;

  return STATUS_SIDANG.DALAM_PROSES;
};