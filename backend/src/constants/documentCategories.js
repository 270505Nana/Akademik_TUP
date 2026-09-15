export const DOCUMENT_CATEGORIES = Object.freeze({
  // Kategori Sidang
  SIDANG_WAJIB: "Sidang - Berkas Wajib",
  SIDANG_BAHASA_SUDAH: "Sidang - Berkas Bahasa Sudah Lulus",
  SIDANG_BAHASA_BELUM: "Sidang - Berkas Bahasa Belum Lulus",

  // Kategori Yudisium
  YUDISIUM_WAJIB: "Yudisium - Berkas Wajib",
  YUDISIUM_WIRAUSAHA: "Yudisium - Evidence Wirausaha",
});

export const NON_SIDANG_CATEGORY_MAP = Object.freeze({
  "Publikasi Jurnal": "Sidang - Evidence Non Sidang Publikasi Jurnal",
  "Proceeding International":
    "Sidang - Evidence Non Sidang Proceeding International",
  HKI: "Sidang - Evidence Non Sidang HKI",
});

export const CUMLAUDE_CATEGORY_MAP = Object.freeze({
  "Publikasi Jurnal": "Yudisium - Evidence Cumlaude Publikasi Jurnal",
  Pameran: "Yudisium - Evidence Cumlaude Pameran",
  Lomba: "Yudisium - Evidence Cumlaude Lomba",
  HKI: "Yudisium - Evidence Cumlaude HKI",
});
