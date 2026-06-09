/**
 * Menentukan status SK untuk sisi ADMIN.
 *
 * - "dalam-proses"    : sktaResponse null → admin belum pernah memproses
 * - "mengirim-revisi" : admin sudah set isEdit (minta revisi) DAN mahasiswa
 *                       sudah submit ulang (request.updatedAt > isEdit timestamp)
 * - "belum-terbit"    : admin sudah set isEdit tapi mahasiswa belum kirim revisi,
 *                       atau salah satu syarat masih false
 * - "sudah-terbit"    : hasTakenLanguageTest && hasUploadedFinalProposal && ada file SK
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
 * Menentukan status SK untuk sisi ADMIN.
 */
export const determineStatus = (sktaResponse, skUploads = [], sktaRequest = null) => {
  if (!sktaResponse) return 'dalam-proses';

  const hasLang     = sktaResponse.hasTakenLanguageTest     === true;
  const hasProposal = sktaResponse.hasUploadedFinalProposal === true;
  const hasFile     = Array.isArray(skUploads) && skUploads.length > 0;

  if (hasLang && hasProposal && hasFile) return 'sudah-terbit';

  // Cek apakah mahasiswa sudah kirim revisi setelah admin minta perbaikan
  if (sktaResponse.isEdit && sktaRequest?.updatedAt) {
    const isEditTime   = new Date(sktaResponse.isEdit).getTime();
    const requestUpdAt = new Date(sktaRequest.updatedAt).getTime();
    if (requestUpdAt > isEditTime) return 'mengirim-revisi';
  }

  return 'belum-terbit';
};

/**
 * Ambil ID upload SK terbaru
 */
export const getSkUploadId = (skUploads = []) => {
  if (!Array.isArray(skUploads) || skUploads.length === 0) return null;
  return skUploads.sort((a, b) => b.id - a.id)[0]?.id || null;
};