// buat nyimpen semua nama berkas yang dibutuhin buat masing" skema
export const SECTIONS = {
  WAJIB: "WAJIB",
  JURNAL: "Publikasi Jurnal",
  PROCEEDING: "Proceeding International",
  HKI: "HKI",
  TEST_BAHASA_SUDAH: "Test Bahasa",
  TEST_BAHASA_BELUM: "Test Bahasa (Belum Memenuhi)",
};

export const REQUIRED_SLUGS = [
  "sidang-berkas-wajib-berkasformvalidasidosenwali",
  "sidang-berkas-wajib-berkasrekomendasisidangpembimbing",
  "sidang-berkas-wajib-berkasscanpernyataanbiodataijazahbermaterai",
  "sidang-berkas-wajib-berkasdummyijazahbermaterai",
  "sidang-berkas-wajib-scan-akta-kelahiran",
  "sidang-berkas-wajib-scan-ijazah-terakhir",
  "sidang-berkas-wajib-berkasscankhsdenganttddoswalkaprodi",
  "sidang-berkas-wajib-berkaslogbimbingan",
  "sidang-berkas-wajib-berkassertifikattak",
  "sidang-berkas-wajib-berkas-evidence-ta-pa-igracias",
  "sidang-berkas-wajib-template-surat-ta",
];

export const NON_SIDANG_SLUGS = {
  "Publikasi Jurnal": [
    "berkas-loa-jurnal",
    "berkas-persetujuan-publikasi-ta-sebagai-pengganti-sidang-jurnal",
    "berkas-camera-ready-paper-yang-sudah-terbit",
    "berkas-camera-ready-paper-jurnal",
    "berkas-riwayat-review-oleh-reviewers",
    "berkas-response-jurnal",
  ],
  "Proceeding International": [
    "berkas-loa-proceeding",
    "berkas-persetujuan-publikasi-ta-sebagai-pengganti-sidang-proceeding",
    "berkas-camera-ready-paper-proceeding",
    "berkas-pakta-integritas",
    "berkas-response-proceeding",
  ],
  HKI: [
    "sertifikat-hki",
    "sertifikat-dari-mitra-dudi",
    "sertifikat-pendukung-lainnya",
  ],
};

const REQUIRED_DOCUMENTS = [
  {
    slug: "sidang-berkas-wajib-berkasformvalidasidosenwali",
    name: "Berkas Form Validasi Dosen Wali",
  },
  {
    slug: "sidang-berkas-wajib-berkasrekomendasisidangpembimbing",
    name: "Berkas Rekomendasi Sidang Pembimbing",
  },
  {
    slug: "sidang-berkas-wajib-berkasscanpernyataanbiodataijazahbermaterai",
    name: "Berkas Scan Pernyataan Biodata Ijazah Bermaterai",
  },
  {
    slug: "sidang-berkas-wajib-berkasdummyijazahbermaterai",
    name: "Berkas Dummy Ijazah Bermaterai",
  },
  { slug: "sidang-berkas-wajib-scan-akta-kelahiran", name: "Berkas Scan Akta Kelahiran" },
  { slug: "sidang-berkas-wajib-scan-ijazah-terakhir", name: "Berkas Scan Ijazah Terakhir" },
  {
    slug: "sidang-berkas-wajib-berkasscankhsdenganttddoswalkaprodi",
    name: "Berkas Scan KHS dengan TTD Doswal/Kaprodi",
  },
  { slug: "sidang-berkas-wajib-berkaslogbimbingan", name: "Berkas Log Bimbingan" },
  { slug: "sidang-berkas-wajib-berkassertifikattak", name: "Berkas Sertifikat TAK" },
  {
    slug: "sidang-berkas-wajib-berkas-evidence-ta-pa-igracias",
    name: "Berkas Rekomendasi Evidence TA/PA iGracias Pembimbing",
  },
  {
    slug: "sidang-berkas-wajib-template-surat-ta",
    name: "Upload Draft Buku TA Siap Sidang",
  },
];

const JURNAL_DOCUMENTS = [
  { slug: "berkas-loa-jurnal", name: "Berkas LoA Jurnal" },
  {
    slug: "berkas-persetujuan-publikasi-ta-sebagai-pengganti-sidang-jurnal",
    name: "Berkas Persetujuan Publikasi TA Pengganti Sidang (Jurnal)",
  },
  {
    slug: "berkas-camera-ready-paper-yang-sudah-terbit",
    name: "Berkas Camera Ready Paper (Sudah Terbit)",
  },
  {
    slug: "berkas-camera-ready-paper-jurnal",
    name: "Berkas Camera Ready Paper (Jurnal)",
  },
  {
    slug: "berkas-riwayat-review-oleh-reviewers",
    name: "Berkas Riwayat Review oleh Reviewers",
  },
  { slug: "berkas-response-jurnal", name: "Berkas Response Jurnal" },
];

const PROCEEDING_DOCUMENTS = [
  { slug: "berkas-loa-proceeding", name: "Berkas LoA Proceeding" },
  {
    slug: "berkas-persetujuan-publikasi-ta-sebagai-pengganti-sidang-proceeding",
    name: "Berkas Persetujuan Publikasi TA Pengganti Sidang (Proceeding)",
  },
  {
    slug: "berkas-camera-ready-paper-proceeding",
    name: "Berkas Camera Ready Paper Proceeding",
  },
  { slug: "berkas-pakta-integritas", name: "Berkas Pakta Integritas" },
  { slug: "berkas-response-proceeding", name: "Berkas Response Proceeding" },
];

const HKI_DOCUMENTS = [
  { slug: "sertifikat-hki", name: "Sertifikat HKI" },
  { slug: "sertifikat-dari-mitra-dudi", name: "Sertifikat dari Mitra DUDI" },
  { slug: "sertifikat-pendukung-lainnya", name: "Sertifikat Pendukung Lainnya" },
];

export const DOCUMENT_CONFIG = {
  [SECTIONS.WAJIB]: REQUIRED_DOCUMENTS,
  [SECTIONS.JURNAL]: JURNAL_DOCUMENTS,
  [SECTIONS.PROCEEDING]: PROCEEDING_DOCUMENTS,
  [SECTIONS.HKI]: HKI_DOCUMENTS,
  [SECTIONS.TEST_BAHASA_SUDAH]: [],
  [SECTIONS.TEST_BAHASA_BELUM]: [],
};

// Map display names to keys used in data.jalurNonSidang
export const PATH_MAP = {
  "Publikasi Jurnal": SECTIONS.JURNAL,
  "Proceeding International": SECTIONS.PROCEEDING,
  HKI: SECTIONS.HKI,
};

// Konfigurasi section yang mengambil daftar dokumen/template secara dinamis dari backend
export const DYNAMIC_SECTION_CATEGORY_MAP = {
  [SECTIONS.WAJIB]: "Sidang - Berkas Wajib",
  [SECTIONS.TEST_BAHASA_SUDAH]: "Sidang - Berkas Tes Bahasa (Sudah)",
  [SECTIONS.TEST_BAHASA_BELUM]: "Sidang - Berkas Tes Bahasa (Belum)",
};

