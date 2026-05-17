// buat nyimpen semua nama berkas yang dibutuhin buat masing" skema
export const SECTIONS = {
  WAJIB: "WAJIB",
  JURNAL: "Publikasi Jurnal",
  PROCEEDING: "Proceeding International",
  HKI: "HKI",
};

export const REQUIRED_SLUGS = [
  "berkasFormValidasiDosenWali",
  "berkasRekomendasiSidangPembimbing",
  "berkasScanPernyataanBiodataIjazahBermaterai",
  "berkasDummyIjazahBermaterai",
  "berkasScanAktaKelahiran",
  "berkasScanIjazahTerakhir",
  "berkasScanKhsDenganTtdDoswalKaprodi",
  "berkasLogBimbingan",
  "berkasSertifikatTak",
  "berkasRekomendasiBerkasEvidenceTaPaIgraciasPembimbing",
  "uploadDraftBukuTaSiapSidang",
];

export const NON_SIDANG_SLUGS = {
  "Publikasi Jurnal": [
    "berkasLoaJurnal",
    "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangJurnal",
    "berkasCameraReadyPaperYangSudahTerbit",
    "berkasCameraReadyPaperJurnal",
    "berkasRiwayatReviewOlehReviewers",
    "berkasResponseJurnal",
  ],
  "Proceeding International": [
    "berkasLoaProceeding",
    "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangProceeding",
    "berkasCameraReadyPaperProceeding",
    "berkasPaktaIntegritas",
    "berkasResponseProceeding",
  ],
  HKI: [
    "sertifikatHki",
    "sertifikatDariMitraDudi",
    "sertifikatPendukungLainnya",
  ],
};

const REQUIRED_DOCUMENTS = [
  {
    slug: "berkasFormValidasiDosenWali",
    name: "Berkas Form Validasi Dosen Wali",
  },
  {
    slug: "berkasRekomendasiSidangPembimbing",
    name: "Berkas Rekomendasi Sidang Pembimbing",
  },
  {
    slug: "berkasScanPernyataanBiodataIjazahBermaterai",
    name: "Berkas Scan Pernyataan Biodata Ijazah Bermaterai",
  },
  {
    slug: "berkasDummyIjazahBermaterai",
    name: "Berkas Dummy Ijazah Bermaterai",
  },
  { slug: "berkasScanAktaKelahiran", name: "Berkas Scan Akta Kelahiran" },
  { slug: "berkasScanIjazahTerakhir", name: "Berkas Scan Ijazah Terakhir" },
  {
    slug: "berkasScanKhsDenganTtdDoswalKaprodi",
    name: "Berkas Scan KHS dengan TTD Doswal/Kaprodi",
  },
  { slug: "berkasLogBimbingan", name: "Berkas Log Bimbingan" },
  { slug: "berkasSertifikatTak", name: "Berkas Sertifikat TAK" },
  {
    slug: "berkasRekomendasiBerkasEvidenceTaPaIgraciasPembimbing",
    name: "Berkas Rekomendasi Evidence TA/PA iGracias Pembimbing",
  },
  {
    slug: "uploadDraftBukuTaSiapSidang",
    name: "Upload Draft Buku TA Siap Sidang",
  },
];

const JURNAL_DOCUMENTS = [
  { slug: "berkasLoaJurnal", name: "Berkas LoA Jurnal" },
  {
    slug: "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangJurnal",
    name: "Berkas Persetujuan Publikasi TA Pengganti Sidang (Jurnal)",
  },
  {
    slug: "berkasCameraReadyPaperYangSudahTerbit",
    name: "Berkas Camera Ready Paper (Sudah Terbit)",
  },
  {
    slug: "berkasCameraReadyPaperJurnal",
    name: "Berkas Camera Ready Paper (Jurnal)",
  },
  {
    slug: "berkasRiwayatReviewOlehReviewers",
    name: "Berkas Riwayat Review oleh Reviewers",
  },
  { slug: "berkasResponseJurnal", name: "Berkas Response Jurnal" },
];

const PROCEEDING_DOCUMENTS = [
  { slug: "berkasLoaProceeding", name: "Berkas LoA Proceeding" },
  {
    slug: "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangProceeding",
    name: "Berkas Persetujuan Publikasi TA Pengganti Sidang (Proceeding)",
  },
  {
    slug: "berkasCameraReadyPaperProceeding",
    name: "Berkas Camera Ready Paper Proceeding",
  },
  { slug: "berkasPaktaIntegritas", name: "Berkas Pakta Integritas" },
  { slug: "berkasResponseProceeding", name: "Berkas Response Proceeding" },
];

const HKI_DOCUMENTS = [
  { slug: "sertifikatHki", name: "Sertifikat HKI" },
  { slug: "sertifikatDariMitraDudi", name: "Sertifikat dari Mitra DUDI" },
  { slug: "sertifikatPendukungLainnya", name: "Sertifikat Pendukung Lainnya" },
];

export const DOCUMENT_CONFIG = {
  [SECTIONS.WAJIB]: REQUIRED_DOCUMENTS,
  [SECTIONS.JURNAL]: JURNAL_DOCUMENTS,
  [SECTIONS.PROCEEDING]: PROCEEDING_DOCUMENTS,
  [SECTIONS.HKI]: HKI_DOCUMENTS,
};

// Map display names to keys used in data.jalurNonSidang
export const PATH_MAP = {
  "Publikasi Jurnal": SECTIONS.JURNAL,
  "Proceeding International": SECTIONS.PROCEEDING,
  HKI: SECTIONS.HKI,
};
