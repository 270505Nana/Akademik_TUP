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
  "berkas-form-validasi-dosen-wali",
  "berkas-rekomendasi-sidang-pembimbing",
  "berkas-scan-pernyataan-biodata-ijazah-bermaterai",
  "berkas-dummy-ijazah-bermaterai",
  "berkas-scan-akta-kelahiran",
  "berkas-scan-ijazah-terakhir",
  "berkas-scan-khs-dengan-ttd-doswal-kaprodi",
  "berkas-log-bimbingan",
  "berkas-sertifikat-tak",
  "berkas-rekomendasi-berkas-evidence-ta-pa-igracias-pembimbing",
  "upload-draft-buku-ta-siap-sidang",
];

/*
 * DAFTAR SLUG DOKUMEN TEST BAHASA:
 * Digunakan untuk validasi kelengkapan berkas di Step 2 sesuai pilihan radio mahasiswa:
 * - TEST_BAHASA_SUDAH_SLUGS: 1 berkas sertifikat (skor >= 450)
 * - TEST_BAHASA_BELUM_SLUGS: 3 berkas sertifikat retake/tes terpisah + 1 surat pemakluman
 */
export const TEST_BAHASA_SUDAH_SLUGS = [
  "berkas-sertifikat-test-bahasa",
];

export const TEST_BAHASA_BELUM_SLUGS = [
  "berkas-sertifikat-test-bahasa-1",
  "berkas-sertifikat-test-bahasa-2",
  "berkas-sertifikat-test-bahasa-3",
  "berkas-surat-pemakluman-test-bahasa",
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
    slug: "berkas-form-validasi-dosen-wali",
    name: "Berkas Form Validasi Dosen Wali",
  },
  {
    slug: "berkas-rekomendasi-sidang-pembimbing",
    name: "Berkas Rekomendasi Sidang Pembimbing",
  },
  {
    slug: "berkas-scan-pernyataan-biodata-ijazah-bermaterai",
    name: "Berkas Scan Pernyataan Biodata Ijazah Bermaterai",
  },
  {
    slug: "berkas-dummy-ijazah-bermaterai",
    name: "Berkas Dummy Ijazah Bermaterai",
  },
  { slug: "berkas-scan-akta-kelahiran", name: "Berkas Scan Akta Kelahiran" },
  { slug: "berkas-scan-ijazah-terakhir", name: "Berkas Scan Ijazah Terakhir" },
  {
    slug: "berkas-scan-khs-dengan-ttd-doswal-kaprodi",
    name: "Berkas Scan KHS dengan TTD Doswal/Kaprodi",
  },
  { slug: "berkas-log-bimbingan", name: "Berkas Log Bimbingan" },
  { slug: "berkas-sertifikat-tak", name: "Berkas Sertifikat TAK" },
  {
    slug: "berkas-rekomendasi-berkas-evidence-ta-pa-igracias-pembimbing",
    name: "Berkas Rekomendasi Evidence TA/PA iGracias Pembimbing",
  },
  {
    slug: "upload-draft-buku-ta-siap-sidang",
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

/*
 * KONFIGURASI DOKUMEN TEST BAHASA:
 * - TEST_BAHASA_SUDAH_DOCUMENTS: Jalur bagi mahasiswa yang sudah memenuhi skor minimum >= 450 (1 dokumen).
 * - TEST_BAHASA_BELUM_DOCUMENTS: Jalur bagi mahasiswa yang belum memenuhi skor (3 sertifikat tes + 1 surat pemakluman).
 *   Surat pemakluman mendukung preview/download formulir template via slug-nya.
 */
const TEST_BAHASA_SUDAH_DOCUMENTS = [
  {
    slug: "berkas-sertifikat-test-bahasa",
    name: "Berkas Sertifikat Test Bahasa (Skor ≥ 450)",
  },
];

const TEST_BAHASA_BELUM_DOCUMENTS = [
  {
    slug: "berkas-sertifikat-test-bahasa-1",
    name: "Berkas Sertifikat Test Bahasa 1",
  },
  {
    slug: "berkas-sertifikat-test-bahasa-2",
    name: "Berkas Sertifikat Test Bahasa 2",
  },
  {
    slug: "berkas-sertifikat-test-bahasa-3",
    name: "Berkas Sertifikat Test Bahasa 3",
  },
  {
    slug: "berkas-surat-pemakluman-test-bahasa",
    name: "Berkas Surat Pemakluman Test Bahasa",
  },
];

export const DOCUMENT_CONFIG = {
  [SECTIONS.WAJIB]: REQUIRED_DOCUMENTS,
  [SECTIONS.JURNAL]: JURNAL_DOCUMENTS,
  [SECTIONS.PROCEEDING]: PROCEEDING_DOCUMENTS,
  [SECTIONS.HKI]: HKI_DOCUMENTS,
  [SECTIONS.TEST_BAHASA_SUDAH]: TEST_BAHASA_SUDAH_DOCUMENTS,
  [SECTIONS.TEST_BAHASA_BELUM]: TEST_BAHASA_BELUM_DOCUMENTS,
};

// Map display names to keys used in data.jalurNonSidang
export const PATH_MAP = {
  "Publikasi Jurnal": SECTIONS.JURNAL,
  "Proceeding International": SECTIONS.PROCEEDING,
  HKI: SECTIONS.HKI,
};
