/**
 * Konstanta Rubrik CLO (Course Learning Outcome) Penilaian Sidang Tugas Akhir per Program Studi.
 * Struktur rubrik dipetakan berdasarkan nama program studi resmi yang digunakan di sistem SIMTA.
 */

export const RUBRIK_CLO_PRODI = {
  // Rubrik untuk S1 Informatika
  "S1 Informatika": {
    prodiName: "S1 Informatika",
    totalBobot: 100,
    kriteria: [
      {
        id: "if-1",
        clo: "CLO-07-2",
        cloDesc: "Mampu berkomunikasi secara efektif baik lisan maupun tulisan",
        subClo: "Sub-CLO 2",
        subCloDesc: "Mampu mengkomunikasikan dan beragumen solusi/gagasan/desain hasil kajian ilmu pengetahuan/teknologi bidang informatika dan komputer",
        // Multi-baris bullet poin asesmen disimpan sebagai array string
        jenisAsesmen: [
          "Presentasi & Tanya Jawab — Kemampuan komunikasi lisan diskusi TA yang memuat:",
          "Penggunaan Media",
          "Penguasaan Materi",
          "Interpersonal Skills",
          "Sistematis & Logis",
        ],
        bobot: 30,
      },
      {
        id: "if-2",
        clo: "CLO-12-1",
        cloDesc: "Mampu menjelaskan solusi berbasis sistem cerdas dalam menyelesaikan permasalahan di dunia nyata",
        subClo: "Sub-CLO 1",
        subCloDesc: "Mampu membuat karya tulis ilmiah yang mengkaji atau menerapkan konsep ilmu pengetahuan/teknologi bidang informatika dan komputer berdasarkan kaidah, tata cara dan etika ilmiah",
        jenisAsesmen: [
          "Laporan TA — Proses pembimbingan dalam menyusun Laporan TA yang memuat:",
          "Kemampuan Analisis",
          "Sistematika dan Tata Bahasa",
          "Sistem Perujukan",
          "Koherensi Pengerjaan TA",
          "Perancangan TA",
        ],
        bobot: 35,
      },
      {
        id: "if-3",
        clo: "CLO-12-2",
        cloDesc: "Mampu menerapkan teknologi terkini dalam pengembangan solusi berbasis sistem cerdas",
        subClo: "Sub-CLO 3",
        subCloDesc: "Mampu membuat produk atau mengkaji atau menerapkan ilmu pengetahuan/teknologi bidang komputer untuk menghasilkan solusi dari suatu permasalahan",
        jenisAsesmen: [
          "Produk TA — Keandalan atau kualitas produk TA terkait dengan salah satu luaran berikut:",
          "Perangkat Lunak running dengan baik sesuai maksud, tanpa principle bug/error",
          "Prototipe yang memiliki argumen logis dan analisis untuk setiap tahapan dalam proses perancangannya",
          "Model dan simulasi atau konfigurasi sistem berjalan dengan baik",
          "Dokumen hasil riset yang dinyatakan lengkap menurut metode/kerangka kerja yang sudah ditentukan, dan disusun dengan runut",
        ],
        bobot: 35,
      },
    ],
  },

  // Rubrik untuk S1 Sistem Informasi
  "S1 Sistem Informasi": {
    prodiName: "S1 Sistem Informasi",
    totalBobot: 100,
    kriteria: [
      {
        id: "si-1",
        clo: "CLO1",
        cloDesc: "Kemampuan mengidentifikasi dan memformulasikan permasalahan sesuai dengan objek kajian di program studi",
        // Sub CLO tidak diuraikan pada prodi Sistem Informasi
        subClo: null,
        subCloDesc: null,
        jenisAsesmen: "Laporan Tugas Akhir Bab 1",
        bobot: 15,
      },
      {
        id: "si-2",
        clo: "CLO2",
        cloDesc: "Kemampuan memilih teori dan metode serta memformulasikan sistematika penyelesaian masalah sesuai dengan metodologi keilmuan di program studi",
        subClo: null,
        subCloDesc: null,
        jenisAsesmen: "Laporan Tugas Akhir Bab 2-3",
        bobot: 15,
      },
      {
        id: "si-3",
        clo: "CLO3",
        cloDesc: "Kemampuan penyelesaian masalah sesuai teori dan metode yang sesuai serta melakukan analisis, interpretasi, sintesa, implikasi/dampak dari hasil tugas akhir",
        subClo: null,
        subCloDesc: null,
        jenisAsesmen: "Laporan Tugas Akhir Bab 4-5",
        bobot: 40,
      },
      {
        id: "si-4",
        clo: "CLO4",
        cloDesc: "Kemampuan melakukan komunikasi secara tertulis maupun lisan yang terstruktur dan sistematis",
        subClo: null,
        subCloDesc: null,
        jenisAsesmen: "Pemaparan Sidang Tugas Akhir",
        bobot: 20,
      },
      {
        id: "si-5",
        clo: "CLO5",
        cloDesc: "Kemampuan mempelajari teori/model/kerangka standar/software/perangkat baru secara mandiri dalam mendukung pelaksanaan Tugas Akhir",
        subClo: null,
        subCloDesc: null,
        jenisAsesmen: "Tanya Jawab Sidang Tugas Akhir",
        bobot: 10,
      },
    ],
  },

  // TODO: isi rubrik CLO untuk prodi S1 Rekayasa Perangkat Lunak — data sebelumnya ternyata milik prodi lain, menunggu data rubrik RPL yang benar
  "S1 Rekayasa Perangkat Lunak": null,

  // TODO: isi rubrik CLO untuk prodi S1 Sains Data (Data Science)
  "S1 Sains Data (Data Science)": null,

  // TODO: isi rubrik CLO untuk prodi S1 Teknik Industri
  "S1 Teknik Industri": null,

  // TODO: isi rubrik CLO untuk prodi S1 Teknik Telekomunikasi
  "S1 Teknik Telekomunikasi": null,

  // TODO: isi rubrik CLO untuk prodi S1 Teknik Elektro
  "S1 Teknik Elektro": null,

  // TODO: isi rubrik CLO untuk prodi S1 Bisnis Digital
  "S1 Bisnis Digital": null,
};

/**
 * Helper untuk mengambil rubrik CLO berdasarkan nama/alias program studi mahasiswa.
 * Mendukung pencocokan string secara fleksibel.
 */
export const getRubrikCloByProdi = (prodiName) => {
  if (!prodiName) return null;
  const cleanName = String(prodiName).trim().toLowerCase();

  // Pencocokan langsung atau berbasis kata kunci prodi
  if (cleanName.includes('informatika') || cleanName === 'if') {
    return RUBRIK_CLO_PRODI["S1 Informatika"];
  }
  if (cleanName.includes('sistem informasi') || cleanName === 'si') {
    return RUBRIK_CLO_PRODI["S1 Sistem Informasi"];
  }
  if (cleanName.includes('rekayasa perangkat lunak') || cleanName.includes('rpl') || cleanName.includes('software engineering')) {
    return RUBRIK_CLO_PRODI["S1 Rekayasa Perangkat Lunak"];
  }

  // Cek pencocokan key eksak
  for (const [key, value] of Object.entries(RUBRIK_CLO_PRODI)) {
    if (key.toLowerCase() === cleanName) {
      return value;
    }
  }

  return null;
};
