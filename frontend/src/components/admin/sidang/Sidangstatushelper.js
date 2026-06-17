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

// determineSidangStatu
/**
 * @param {object|null} registration  - object dari GET /api/sidang-registrations
 * @param {object|null} response      - object dari GET /api/sidang-registration-responses/registration/{id}
 * @param {object|null} period        - object dari GET /api/sidang-periods, di-match by sidangPeriodId
 * klasifikasi statusnya
 * 1. Belum Daftar         : registration null
 * 2. Proses Registrasi    : isDraft=true, response null
 * 3. Dalam Proses         : isDraft=false, response null
 * 4. Perlu Revisi         : response.isEdit not null, registration.submittedAt null
 * 5. Revisi Diperbarui    : response.isEdit not null, registration.submittedAt not null
 * 6. Siap Sidang          : response.isEdit null, period.isOpen === true
 * 7. Pendaftaran Diterima : response.isEdit null, period.isOpen === false (atau period null)
 */
export const determineSidangStatus = (registration, response, period) => {
  //Belum daftar
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  //Proses registrasi (draft, belum submit)
  if (registration.isDraft && !response) return STATUS_SIDANG.PROSES_REGISTRASI;

  //Dalam proses (sudah submit, admin belum respons)
  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  // Ada response, admin pernah set revisi
  if (response.isEdit !== null && response.isEdit !== undefined) {
    return registration.submittedAt
      ? STATUS_SIDANG.REVISI_DIPERBARUI
      : STATUS_SIDANG.PERLU_REVISI;
  }

  //isEdit null → admin approve, cek periode
  if (period) {
    return period.isOpen === true
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  // Response ada tapi belum assign periode (edge case)
  return STATUS_SIDANG.DALAM_PROSES;
};