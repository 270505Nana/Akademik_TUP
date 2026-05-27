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
 * - EXPIRED        → selalu bisa edit (perbarui SK kadaluarsa)
 * - BELUM_TERBIT   → hanya bisa edit jika admin udh set isEdit (ada deadline)
 */
export const isSkEditable = (status, sktaResponse = null) => {
  if (status === STATUS_SK.EXPIRED) return true;
  if (status === STATUS_SK.BELUM_TERBIT) return !!sktaResponse?.isEdit;
  return false;
};


export const getSkFileUrl = (skUploads = []) => {
  if (!Array.isArray(skUploads) || skUploads.length === 0) return null;
  const upload = skUploads[0];
  if (upload.downloadUrl) return upload.downloadUrl;
  if (upload.id) {
    const base = import.meta.env?.VITE_API_URL || '';
    return `${base}/api/skta-responses/uploads/${upload.id}/download`;
  }
  return null;
};

const LS_REVISED_UPDATED_AT = (reqId) => `skta_revised_updatedAt_${reqId}`;

/**
 *
 * @param {string|number} reqId
 * @param {string}        updatedAt  
 */
export const markRevisedWithTimestamp = (reqId, updatedAt) => {
  localStorage.setItem(LS_REVISED_UPDATED_AT(reqId), updatedAt ?? new Date().toISOString());
};

export const clearRevisedFlag = (reqId) => {
  localStorage.removeItem(LS_REVISED_UPDATED_AT(reqId));
};

// cek apakah dokumen udah di revisi/blm
export const isAlreadyRevised = (reqId, serverUpdatedAt) => {
  const storedUpdatedAt = localStorage.getItem(LS_REVISED_UPDATED_AT(reqId));
  if (!storedUpdatedAt) return false;

  // Cek timestamp: kl server punya updatedAt yang LEBIH BARU dari yang udh disimpan saat mahasiswa submit → berarti admin sudah mengubah data → hapus flag
  const storedTime = new Date(storedUpdatedAt).getTime();
  const serverTime = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0;

  if (serverTime > storedTime) {
    clearRevisedFlag(reqId);
    return false;
  }

  return true;
};