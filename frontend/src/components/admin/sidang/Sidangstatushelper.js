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
  // 1. !registration → BELUM_DAFTAR
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  const isEdit =
    registration.isEdit !== undefined && registration.isEdit !== null
      ? registration.isEdit
      : (response ? response.isEdit : null);

  const adminId =
    registration.adminId ||
    (response ? response.adminId : null) ||
    (registration.admin ? registration.admin.id : null) ||
    null;

  const hasEdit = isEdit !== null && isEdit !== undefined && isEdit !== false && isEdit !== '';

  // 2. isDraft === true, isEdit ada isinya → PERLU_REVISI
  if (registration.isDraft && hasEdit) {
    return STATUS_SIDANG.PERLU_REVISI;
  }

  // 3. isDraft === true, isEdit kosong → PROSES_REGISTRASI
  if (registration.isDraft) {
    return STATUS_SIDANG.PROSES_REGISTRASI;
  }

  // 4. isDraft === false, sidangPeriodId ada + period match → SIAP_SIDANG / PENDAFTARAN_DITERIMA
  const matchedPeriod = period || registration.sidangPeriod;
  if (!registration.isDraft && registration.sidangPeriodId && matchedPeriod) {
    return matchedPeriod.isOpen
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  // 5. isDraft === false, adminId ada isinya (dan tidak masuk kondisi 4) → REVISI_DIPERBARUI
  if (!registration.isDraft && adminId) {
    return STATUS_SIDANG.REVISI_DIPERBARUI;
  }

  // 6. isDraft === false, sisanya → DALAM_PROSES
  return STATUS_SIDANG.DALAM_PROSES;
};