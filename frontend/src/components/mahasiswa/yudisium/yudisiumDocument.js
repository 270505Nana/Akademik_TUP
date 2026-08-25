export const SECTIONS = {
  WAJIB: "Kelengkapan Dokumen Yudisium",
  JURNAL: "Cumlaude - Publikasi Jurnal",
  PAMERAN: "Cumlaude - Pameran",
  LOMBA: "Cumlaude - Prestasi Lomba",
  HKI: "Cumlaude - HKI/Paten",
  WIRAUSAHA: "Dokumen Kewirausahaan"
};

export const DOCUMENT_CONFIG = {
  [SECTIONS.WAJIB]: [], //api be
  [SECTIONS.JURNAL]: [
    { slug: "loa-publisher", name: "LoA dari Publisher (Wajib)" },
    { slug: "sertifikat-conference", name: "Sertifikat Peserta/Penyaji (Opsional)" },
    { slug: "evidence-jurnal-lainnya", name: "Evidence Pendukung Lainnya (Opsional)" }
  ],
  [SECTIONS.PAMERAN]: [
    { slug: "sertifikat-pameran", name: "Sertifikat Pameran (Wajib)" },
    { slug: "evidence-pameran-lainnya", name: "Evidence Pendukung Lainnya (Opsional)" }
  ],
  [SECTIONS.LOMBA]: [
    { slug: "sertifikat-lomba", name: "Sertifikat / Bukti Jumlah Peserta (Wajib)" },
    { slug: "evidence-lomba-lainnya", name: "Evidence Pendukung Lainnya (Opsional)" }
  ],
  [SECTIONS.HKI]: [
    { slug: "sertifikat-hki", name: "Sertifikat HKI (Wajib)" },
    { slug: "sertifikat-dudi", name: "Sertifikat DUDI / Pendukung Lainnya (Opsional)" }
  ],
  [SECTIONS.WIRAUSAHA]: [
    { slug: "formulir-wirausaha", name: "Formulir Pendaftaran Mahasiswa Berprestasi (Wajib)" }
  ]
};