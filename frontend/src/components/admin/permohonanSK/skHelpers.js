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
 * Menentukan status SK.
 *
 * - "dalam-proses" : sktaResponse null → admin belum memproses
 * - "belum-terbit" : salah satu boolean masih false
 * - "sudah-terbit" : hasTakenLanguageTest && hasUploadedFinalProposal && ada file SK
 */
export const determineStatus = (sktaResponse, skUploads = []) => {
  if (!sktaResponse) return 'dalam-proses';

  const hasLang     = sktaResponse.hasTakenLanguageTest     === true;
  const hasProposal = sktaResponse.hasUploadedFinalProposal === true;
  const hasFile     = Array.isArray(skUploads) && skUploads.length > 0;

  if (hasLang && hasProposal && hasFile) return 'sudah-terbit';
  return 'belum-terbit';
};