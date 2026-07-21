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
 * Catatan penting:
 * - Saat admin set revisi, BE mengubah isDraft=true. List page harus
 *   menyertakan registrasi ini meski isDraft=true jika punya response.
 * - submittedAt cukup untuk membedakan PERLU_REVISI vs REVISI_DIPERBARUI
 *   karena BE sudah clear isEdit saat mahasiswa resubmit.
 * - sidangPeriodId tersimpan di tabel SidangRegistration (bukan di response).
 * - `period` di-pass terpisah karena sidangPeriod tidak nested di response.
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

//  determineSidangStatus 
/**
 * @param {object|null} registration  - object dari GET /api/sidang-registrations
 * @param {object|null} response      - object dari GET /api/sidang-registration-responses/registration/{id}
 * @param {object|null} period        - object dari GET /api/sidang-periods, di-match by registration.sidangPeriodId
 *
 * Urutan pengecekan:
 * 1. Belum Daftar         : registration null
 * 2. Proses Registrasi    : isDraft=true, response null
 * 3. Dalam Proses         : isDraft=false, response null
 * 4. Perlu Revisi         : response ada, response.isEdit not null, submittedAt null
 *                           (isDraft=true saat ini — admin sudah set revisi)
 * 5. Revisi Diperbarui    : registration.submittedAt not null
 *                           (BE sudah clear isEdit saat mahasiswa resubmit)
 * 6. Siap Sidang          : sidangPeriodId ada, period.isOpen === true
 * 7. Pendaftaran Diterima : sidangPeriodId ada, period.isOpen === false
 */
export const determineSidangStatus = (registration, response, period) => {
  // 1. Belum daftar
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  // 5. Revisi Diperbarui — cek duluan karena submittedAt paling definitif
  //    Mahasiswa sudah resubmit setelah revisi (BE clear isEdit, submittedAt terisi)
  if (registration.submittedAt && response) return STATUS_SIDANG.REVISI_DIPERBARUI;

  // 2. Proses registrasi (draft murni, belum pernah submit, belum ada response)
  if (registration.isDraft && !response) return STATUS_SIDANG.PROSES_REGISTRASI;

  // 3. Dalam proses (sudah submit pertama kali, admin belum respons)
  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  // 4. Perlu Revisi — ada response dengan isEdit (admin sudah set deadline revisi)
  //    isDraft=true karena BE set ulang saat admin beri revisi
  if (response && response.isEdit !== null && response.isEdit !== undefined) {
    return STATUS_SIDANG.PERLU_REVISI;
  }

  // 6 & 7. isEdit null → admin approve, cek periode sidang
  if (period) {
    const now       = new Date();
    const startDate = new Date(period.startDate);
    const endDate   = new Date(period.endDate);
    // isOpen di DB tidak auto-update, gunakan rentang tanggal sebagai sumber kebenaran
    const isActive  = now >= startDate && now <= endDate;
    return isActive
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  // Response ada tapi sidangPeriodId belum di-assign (edge case)
  return STATUS_SIDANG.DALAM_PROSES;
};