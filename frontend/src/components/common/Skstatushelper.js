export const STATUS_SK = {
  DALAM_PROSES : 'dalam-proses',  // Admin belum memproses / belum ambil keputusan
  BELUM_TERBIT : 'belum-terbit',  // Admin reject, ada message + isEdit (deadline revisi)
  SUDAH_TERBIT : 'sudah-terbit',  // Semua syarat terpenuhi, file SK sudah ada
  EXPIRED      : 'expired',       // SK sudah terbit tapi expDate lewat
  DRAFT        : 'draft',         // Mahasiswa menyimpan form tanpa bukti (khusus Perubahan)
};

export const SKTA_CATEGORY = {
  PERMOHONAN_BARU             : 'Permohonan Baru',
  PERPANJANGAN_SK             : 'Perpanjangan SK',
  PERUBAHAN_JUDUL             : 'Perubahan Judul',
  PERUBAHAN_DOSEN_PEMBIMBING  : 'Perubahan Dosen Pembimbing',
  PERUBAHAN_JUDUL_DAN_DOSEN   : 'Perubahan Judul dan Dosen Pembimbing',
};

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

export const determineStatus = (permohonan) => {
  if (!permohonan) return STATUS_SK.DALAM_PROSES;

  // 1. CEK REVISI TERLEBIH DAHULU
  if (permohonan.message || permohonan.isEdit) {
    return STATUS_SK.BELUM_TERBIT; 
  }

  // 2. CEK DRAFT (Khusus Kategori Perubahan)
  const draftCategories = [
    SKTA_CATEGORY.PERUBAHAN_JUDUL,
    SKTA_CATEGORY.PERUBAHAN_DOSEN_PEMBIMBING,
    SKTA_CATEGORY.PERUBAHAN_JUDUL_DAN_DOSEN
  ];
  if (permohonan.isDraft === true && draftCategories.includes(permohonan.category)) {
    return STATUS_SK.DRAFT;
  }

  // 3. CEK SUDAH TERBIT
  const hasLang     = permohonan.hasTakenLanguageTest     === true;
  const hasProposal = permohonan.hasUploadedFinalProposal === true;
  const hasFile     = !!permohonan.sktaUploadPath || !!permohonan.sktaDownloadUrl
    || (Array.isArray(permohonan.sktaResponseUploads) && permohonan.sktaResponseUploads.length > 0);

  if (hasLang && hasProposal && hasFile) return STATUS_SK.SUDAH_TERBIT;

  return STATUS_SK.DALAM_PROSES;
};

export const determineSkStatus = (permohonan) => {
  const baseStatus = determineStatus(permohonan);

  if (baseStatus === STATUS_SK.SUDAH_TERBIT && permohonan?.expDate) {
    const exp = new Date(permohonan.expDate);
    exp.setHours(23, 59, 59, 999);
    if (exp < new Date()) return STATUS_SK.EXPIRED;
  }

  return baseStatus;
};

export const isSkEditable = (status, permohonan = null) => {
  if (status === STATUS_SK.EXPIRED) return true;
  if (status === STATUS_SK.BELUM_TERBIT) {
    if (!permohonan?.isEdit) return false;
    const deadline = new Date(permohonan.isEdit);
    deadline.setHours(23, 59, 59, 999); 
    return deadline > new Date();
  }
  if (status === STATUS_SK.DRAFT) return true;
  return false;
};

const MAIN_PAGE_CATEGORIES = [SKTA_CATEGORY.PERMOHONAN_BARU, SKTA_CATEGORY.PERPANJANGAN_SK];

export const getSubmissionMode = (permohonan) => {
  if (!permohonan) return 'create-baru';
  
  const status = determineSkStatus(permohonan);
  
  if (status === STATUS_SK.EXPIRED) return 'create-perpanjangan';
  if (!MAIN_PAGE_CATEGORIES.includes(permohonan.category)) return 'blocked';

  if (status === STATUS_SK.BELUM_TERBIT) return 'patch-revisi';
  
  return 'blocked';
};

export const getSkFileUrl = (permohonan) => {
  if (!permohonan) return null;
  if (permohonan.sktaDownloadUrl) return permohonan.sktaDownloadUrl;
  if (Array.isArray(permohonan.sktaResponseUploads) && permohonan.sktaResponseUploads.length > 0) {
    return permohonan.sktaResponseUploads[0].downloadUrl ?? null;
  }
  return null;
};

export const isMainPageCategory = (permohonan) => {
  if (!permohonan) return true; 
  return MAIN_PAGE_CATEGORIES.includes(permohonan.category);
};