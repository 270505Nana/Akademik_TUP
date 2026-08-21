/**
 * Menentukan status SK untuk sisi ADMIN.
 * Model: PermohonanSkta (single-table, sama persis dengan yang dipakai sisi mahasiswa).
 *
 * - "dalam-proses"    : belum ada keputusan admin sama sekali, ATAU mahasiswa baru
 *                       resubmit setelah ditolak (lihat catatan wasRejectedBefore di bawah)
 * - "mengirim-revisi" : admin pernah menolak (wasRejectedBefore) DAN mahasiswa sudah
 *                       resubmit (message/isEdit sudah ke-clear oleh BE saat resubmit)
 * - "belum-terbit"    : admin baru saja menolak, mahasiswa BELUM resubmit
 *                       (message dan/atau isEdit masih ada isinya)
 * - "sudah-terbit"    : hasTakenLanguageTest && hasUploadedFinalProposal && ada file SK
 *
 * CATATAN PENTING soal "mengirim-revisi":
 * BE (updatePermohonanSkta) meng-null-kan `message` dan `isEdit` begitu mahasiswa
 * resubmit — sehingga sinyal "ini bekas revisi" hilang kalau hanya mengandalkan
 * kedua field itu. Field `wasRejectedBefore` (boolean) DIBUTUHKAN dari BE untuk
 * mempertahankan sinyal itu: di-set true saat reject, TIDAK di-reset saat resubmit.
 * Selama field itu belum ada di response BE (masih `undefined`), status akan selalu
 * jatuh ke "dalam-proses" biasa untuk kasus resubmit — begitu BE mengirim field ini,
 * behavior "mengirim-revisi" otomatis aktif tanpa perlu ubah kode di sini lagi.
 */

export const ALUR_STEPS = [
  'Data diproses di I-Gracias untuk pengecekan nomor SK',
  'Unduh SK dari I-Gracias',
  'Berikan kop surat resmi',
  'Unggah ulang SK final ke SIMTA',
];

export const unwrapResponse = (raw) => {
  if (!raw) return null;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return raw.data;
  }
  return raw;
};

/**
 * determineStatus
 * @param {object|null} permohonan  row PermohonanSkta lengkap (dari getAllSktaRequests/getSktaRequestById)
 * @returns {'dalam-proses'|'mengirim-revisi'|'belum-terbit'|'sudah-terbit'}
 */
export const determineStatus = (permohonan) => {
  if (!permohonan) return 'dalam-proses';

  const hasLang     = permohonan.hasTakenLanguageTest     === true;
  const hasProposal = permohonan.hasUploadedFinalProposal === true;
  const hasFile      = !!permohonan.sktaUploadPath || !!permohonan.sktaDownloadUrl
    || (Array.isArray(permohonan.sktaResponseUploads) && permohonan.sktaResponseUploads.length > 0);

  if (hasLang && hasProposal && hasFile) return 'sudah-terbit';

  // Admin baru menolak, mahasiswa belum resubmit (message/isEdit masih terisi)
  if (permohonan.message || permohonan.isEdit) return 'belum-terbit';

  // Mahasiswa sudah resubmit setelah ditolak (message/isEdit sudah di-clear BE),
  // tapi masih ada jejak "pernah ditolak" via wasRejectedBefore.
  // [Menunggu field ini tersedia dari BE — lihat catatan di atas]
  if (permohonan.wasRejectedBefore === true) return 'mengirim-revisi';

  return 'dalam-proses';
};

/**
 * Ambil ID upload SK terbaru — pakai createdAt, BUKAN pengurangan numerik id
 * (id sekarang UUID string, "a" - "b" akan selalu NaN dan sorting jadi gak reliable).
 */
export const getSkUploadId = (skUploads = []) => {
  if (!Array.isArray(skUploads) || skUploads.length === 0) return null;
  const sorted = [...skUploads].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
  return sorted[0]?.id || null;
};