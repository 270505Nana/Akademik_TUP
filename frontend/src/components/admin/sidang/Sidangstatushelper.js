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

/**
 * Urutan pengecekan:
 * 1. Belum Daftar         : registration null
 * 2. Proses Registrasi    : isDraft=true, response null
 * 3. Dalam Proses         : isDraft=false, response null
 * 4. Perlu Revisi         : response ada, response.isEdit not null, submittedAt null
 *                           (isDraft=true saat ini  admin sudah set revisi)
 * 5. Revisi Diperbarui    : registration.submittedAt not null
 *                           (BE  clear isEdit saat mahasiswa resubmit)
 * 6. Siap Sidang          : sidangPeriodId ada, period.isOpen === true
 * 7. Pendaftaran Diterima : sidangPeriodId ada, period.isOpen === false
 */
export const determineSidangStatus = (registration, response, period) => {
  // Belum daftar
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  //Revisi Diperbarui
  //    Mahasiswa sudah resubmit setelah revisi (BE clear isEdit, set isDraft=false, submittedAt terisi)
  if (registration.submittedAt && response) return STATUS_SIDANG.REVISI_DIPERBARUI;

  // Proses registrasi (draft, belum pernah submit sama sekali, belum ada response)
  if (registration.isDraft && !response) return STATUS_SIDANG.PROSES_REGISTRASI;

  //Dalam proses (sudah submit pertama kali, admin belum respons)
  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  // Perlu Revisi — ada response dengan isEdit (admin sudah set deadline revisi)
  //    isDraft=true karena BE set ulang saat admin beri revisi
  if (response && response.isEdit !== null && response.isEdit !== undefined) {
    return STATUS_SIDANG.PERLU_REVISI;
  }

  // isEdit null dan ada sidangPeriodId → admin approve, cek periode
  if (period) {
    return period.isOpen === true
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  // Response ada tapi sidangPeriodId belum di-assign (edge case)
  return STATUS_SIDANG.DALAM_PROSES;
};