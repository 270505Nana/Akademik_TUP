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
 * 4. Perlu Revisi         : response ada, response.isEdit not null
 *                           (isDraft=true saat ini — admin sudah set revisi)
 * 5. Siap Sidang / Pendaftaran Diterima : sidangPeriodId ada (admin sudah
 *                           approve & assign periode). Dicek SEBELUM
 *                           submittedAt karena submittedAt tidak pernah
 *                           di-clear lagi setelah resubmit — kalau dicek
 *                           duluan, status bakal permanen stuck di
 *                           REVISI_DIPERBARUI walau admin sudah approve
 *                           ulang di siklus verifikasi berikutnya.
 * 6. Revisi Diperbarui    : registration.submittedAt not null, response ada,
 *                           TAPI sidangPeriodId belum di-assign
 *                           (BE sudah clear isEdit saat mahasiswa resubmit,
 *                           admin belum sempat approve ulang)
 */
export const determineSidangStatus = (registration, response, period) => {
  // 1. Belum daftar
  if (!registration) return STATUS_SIDANG.BELUM_DAFTAR;

  // 2. Proses registrasi (draft murni, belum pernah submit, belum ada response)
  if (registration.isDraft && !response) return STATUS_SIDANG.PROSES_REGISTRASI;

  // 3. Dalam proses (sudah submit pertama kali, admin belum respons)
  if (!registration.isDraft && !response) return STATUS_SIDANG.DALAM_PROSES;

  // 4. Perlu Revisi — ada response dengan isEdit (admin sudah set deadline revisi)
  //    isDraft=true karena BE set ulang saat admin beri revisi
  if (response && response.isEdit !== null && response.isEdit !== undefined) {
    return STATUS_SIDANG.PERLU_REVISI;
  }

  // 5. sidangPeriodId ada → admin sudah approve (baik di verifikasi pertama
  //    maupun setelah siklus revisi). Ini dicek LEBIH DULU daripada
  //    submittedAt supaya proses approval ulang pasca-revisi tidak nyantol
  //    di status REVISI_DIPERBARUI.
  if (registration.sidangPeriodId && period) {
    const now       = new Date();
    const startDate = new Date(period.startDate);
    const endDate   = new Date(period.endDate);
    // isOpen di DB tidak auto-update, gunakan rentang tanggal sebagai sumber kebenaran
    const isActive  = now >= startDate && now <= endDate;
    return isActive
      ? STATUS_SIDANG.SIAP_SIDANG
      : STATUS_SIDANG.PENDAFTARAN_DITERIMA;
  }

  // 6. Revisi Diperbarui — mahasiswa sudah resubmit setelah revisi
  //    (submittedAt terisi, isEdit sudah di-clear BE) TAPI admin belum
  //    approve ulang (sidangPeriodId belum di-assign).
  if (registration.submittedAt && response) return STATUS_SIDANG.REVISI_DIPERBARUI;

  // Response ada tapi belum masuk kategori manapun di atas (edge case)
  return STATUS_SIDANG.DALAM_PROSES;
};