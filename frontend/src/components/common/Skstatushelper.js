// Set status ADMIN permohonansk & MHS pengajuanSK

export const STATUS_SK = {
  DALAM_PROSES : 'dalam-proses',  // Admin belum memproses sama sekali
  BELUM_TERBIT : 'belum-terbit',  // Salah satu syarat belum terpenuhi
  SUDAH_TERBIT : 'sudah-terbit',  // Semua syarat terpenuhi
  EXPIRED      : 'expired',       // SK sudah terbit tapi expDate lewat
};

// VerifikasiModal admin 
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
 *
 * - 'dalam-proses' : sktaResponse null → admin belum memproses
 * - 'belum-terbit' : salah satu boolean masih false, atau file SK belum ada
 * - 'sudah-terbit' : hasTakenLanguageTest === true
 *                    DAN hasUploadedFinalProposal === true
 *                    DAN skUploads.length > 0 (file SK sudah diupload admin)

 *
 * @param {object|null} sktaResponse 
 * @param {Array}       skUploads    
 * @returns {string}
 */
export const determineStatus = (sktaResponse, skUploads = []) => {
  if (!sktaResponse) return STATUS_SK.DALAM_PROSES;

  const hasLang     = sktaResponse.hasTakenLanguageTest     === true;
  const hasProposal = sktaResponse.hasUploadedFinalProposal === true;
  const hasFile     = Array.isArray(skUploads) && skUploads.length > 0;

  if (hasLang && hasProposal && hasFile) return STATUS_SK.SUDAH_TERBIT;
  return STATUS_SK.BELUM_TERBIT;
};

/**
 * determineSkStatus —  untuk mahasiswa (pengajuanSK.jsx)
 *  'expired' (perlu resubmit) vs 'sudah-terbit'.
 *
 * @param {object|null} sktaResponse 
 * @param {Array}       skUploads    
 * @returns {string}
 */
export const determineSkStatus = (sktaResponse, skUploads = []) => {

  const baseStatus = determineStatus(sktaResponse, skUploads);

  if (baseStatus === STATUS_SK.SUDAH_TERBIT && sktaResponse?.expDate) {
    const exp = new Date(sktaResponse.expDate);
    if (exp < new Date()) return STATUS_SK.EXPIRED;
  }

  return baseStatus;
};

/**
 * isSkEditable
 * true jika BELUM_TERBIT atau EXPIRED.
 */
export const isSkEditable = (status) =>
  status === STATUS_SK.BELUM_TERBIT || status === STATUS_SK.EXPIRED;

/**
 * getSkFileUrl
 * Ambil URL download file SK dari skUploads (SktaResponseUpload).
 */
export const getSkFileUrl = (skUploads = []) =>
  Array.isArray(skUploads) && skUploads.length > 0
    ? skUploads[0].downloadUrl ?? null
    : null;