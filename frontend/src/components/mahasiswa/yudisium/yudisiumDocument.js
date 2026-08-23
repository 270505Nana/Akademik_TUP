export const SECTIONS = {
  WAJIB: "Dokumen Kelengkapan Yudisium",
  CUMLAUDE: "Dokumen Cumlaude / Summa Cumlaude",
  WIRAUSAHA: "Dokumen Kewirausahaan"
};

export const DOCUMENT_CONFIG = {
  [SECTIONS.WAJIB]: [
    { slug: "lembar-revisi", name: "Lembar Revisi" },
    { slug: "lembar-pengesahan", name: "Lembar Pengesahan Tugas Akhir" },
    { slug: "surat-bebas-pustaka", name: "Surat Bebas Kewajiban Pustaka" },
    { slug: "bukti-bayar-wisuda", name: "Scan Bukti Pembayaran Wisuda" },
    { slug: "foto-basila", name: "Bukti Unggah Foto Basila" },
    { slug: "tak-terbaik", name: "Bukti Unggah 5 TAK Terbaik" },
    { slug: "skpi-approve", name: "SKPI Sudah Approve BK" },
    { slug: "upload-openlibrary", name: "Bukti Upload OpenLibrary" },
    { slug: "bukti-similarity", name: "Bukti Similarity" }
  ],
  [SECTIONS.CUMLAUDE]: [
    { slug: "bukti-cumlaude", name: "Bukti Sertifikat / Jurnal (Cumlaude)" }
  ],
  [SECTIONS.WIRAUSAHA]: [
    { slug: "formulir-wirausaha", name: "FORMULIR PENDAFTARAN MAHASISWA BERPRESTASI BIDANG INOVASI & KEWIRAUSAHAAN" }
  ]
};

export const REQUIRED_SLUGS = [
  "lembar-revisi", "lembar-pengesahan", "surat-bebas-pustaka",
  "bukti-bayar-wisuda", "foto-basila", "tak-terbaik",
  "skpi-approve", "upload-openlibrary", "bukti-similarity"
];