const prisma = require("../client");

const templateUploads = [
  {
    name: "Berkas Form Validasi Dosen Wali",
    slug: "berkasFormValidasiDosenWaliPlus",
  },
  {
    name: "Berkas Rekomendasi Sidang Pembimbing",
    slug: "berkasRekomendasiSidangPembimbingPlus",
  },
  {
    name: "Berkas Scan Pernyataan Biodata Ijazah Bermaterai",
    slug: "berkasScanPernyataanBiodataIjazahBermateraiPlus",
  },
  {
    name: "Berkas Dummy Ijazah Bermaterai",
    slug: "berkasDummyIjazahBermateraiPlus",
  },
  {
    name: "Berkas Scan Akta Kelahiran",
    slug: "berkasScanAktaKelahiran",
  },
  {
    name: "Berkas Scan Ijazah Terakhir",
    slug: "berkasScanIjazahTerakhir",
  },
  {
    name: "Berkas Scan KHS Dengan TTD Doswal Kaprodi",
    slug: "berkasScanKhsDenganTtdDoswalKaprodiPlus",
  },
  {
    name: "Berkas Log Bimbingan",
    slug: "berkasLogBimbinganPlus",
  },
  {
    name: "Berkas Test Bahasa",
    slug: "berkasTestBahasaPlusPlus",
  },
  {
    name: "Berkas Pemakluman Test Bahasa",
    slug: "berkasPemaklumanTestBahasaPlusPlus",
  },
  {
    name: "Berkas Sertifikat Tak",
    slug: "berkasSertifikatTakPlus",
  },
  {
    name: "Berkas Rekomendasi Berkas Evidence TA PA Igracias Pembimbing",
    slug: "berkasRekomendasiBerkasEvidenceTaPaIgraciasPembimbingPlus",
  },
  {
    name: "Upload Draft Buku TA Siap Sidang",
    slug: "uploadDraftBukuTaSiapSidang",
  },
  {
    name: "Berkas Loa Jurnal",
    slug: "berkasLoaJurnalPlus",
  },
  {
    name: "Berkas Persetujuan Publikasi TA Sebagai Pengganti Sidang Jurnal",
    slug: "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangJurnalPlus",
  },
  {
    name: "Berkas Camera Ready Paper Yang Sudah Terbit",
    slug: "berkasCameraReadyPaperYangSudahTerbitPlus",
  },
  {
    name: "Berkas Camera Ready Paper Jurnal",
    slug: "berkasCameraReadyPaperJurnalPlus",
  },
  {
    name: "Berkas Riwayat Review Oleh Reviewers",
    slug: "berkasRiwayatReviewOlehReviewersPlus",
  },
  {
    name: "Berkas Response Jurnal",
    slug: "berkasResponseJurnalPlus",
  },
  {
    name: "Berkas Loa Proceeding",
    slug: "berkasLoaProceeding",
  },
  {
    name: "Berkas Persetujuan Publikasi TA Sebagai Pengganti Sidang Proceeding",
    slug: "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangProceeding",
  },
  {
    name: "Berkas Camera Ready Paper Proceeding",
    slug: "berkasCameraReadyPaperProceeding",
  },
  {
    name: "Berkas Pakta Integritas",
    slug: "berkasPaktaIntegritas",
  },
  {
    name: "Berkas Response Proceeding",
    slug: "berkasResponseProceeding",
  },
  {
    name: "Sertifikat Hki",
    slug: "sertifikatHkiPlus",
  },
  {
    name: "Sertifikat Dari Mitra Dudi",
    slug: "sertifikatDariMitraDudi",
  },
  {
    name: "Sertifikat Pendukung Lainnya",
    slug: "sertifikatPendukungLainnyaPlus",
  },
];

async function seedTemplateUpload() {
  console.log("- Seeding template uploads...");

  await prisma.templateUpload.createMany({
    data: templateUploads.map((item) => ({
      name: item.name,
      slug: item.slug,
      filename: "dummy.pdf",
      path: "dummy/path/dummy.pdf",
      isPublish: true,
    })),
    skipDuplicates: true,
  });

  console.log("- Template uploads seeded successful");
}

module.exports = { seedTemplateUpload };
