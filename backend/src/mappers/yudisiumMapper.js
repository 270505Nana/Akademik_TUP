import { mapMahasiswa, mapDosen, mapAdmin } from "./userMapper.js";

export const mapYudisiumRegistrationToFrontend = (item, req) => {
  if (!item) return null;

  const uploads = item.yudisiumRegistrationUploads || [];

  return {
    id: item.id,
    periodId: item.periodId,
    mahasiswaId: item.mahasiswaId,
    program: item.program,
    sks: item.sks,
    ipk: item.ipk,
    tak: item.tak,
    sktaExpDate: item.sktaExpDate,
    tglLulusSidang: item.tglLulusSidang,
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: item.judulTugasAkhirInggris,
    dosenPembimbing1Id: item.dosenPembimbing1Id,
    dosenPembimbing2Id: item.dosenPembimbing2Id,
    dosenWaliId: item.dosenWaliId,
    adminId: item.adminId,
    peminatan: item.peminatan,
    berminatWirausaha: item.berminatWirausaha,
    skemaCumlaude: item.skemaCumlaude,
    isCumlaudeEligible: item.isCumlaudeEligible,
    status: item.status,
    isDraft: item.isDraft,
    submittedAt: item.submittedAt,
    reviewNotes: item.reviewNotes,
    nomorIjazah: item.nomorIjazah,
    nomorSertifikatPendidik: item.nomorSertifikatPendidik,
    nomorSkYudisium: item.nomorSkYudisium,
    tglSkYudisium: item.tglSkYudisium,
    tglWisuda: item.tglWisuda,
    periodeWisuda: item.periodeWisuda,
    nomorSertifikatProfesi: item.nomorSertifikatProfesi,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    mahasiswa: item.mahasiswa ? mapMahasiswa(item.mahasiswa) : null,
    dosenPembimbing1: item.dosenPembimbing1
      ? mapDosen(item.dosenPembimbing1)
      : null,
    dosenPembimbing2: item.dosenPembimbing2
      ? mapDosen(item.dosenPembimbing2)
      : null,
    dosenWali: item.dosenWali ? mapDosen(item.dosenWali) : null,
    admin: item.admin ? mapAdmin(item.admin) : null,
    yudisiumPeriod: item.yudisiumPeriod
      ? {
          id: item.yudisiumPeriod.id,
          name: item.yudisiumPeriod.name,
          startDate: item.yudisiumPeriod.startDate,
          endDate: item.yudisiumPeriod.endDate,
          isActive: item.yudisiumPeriod.isActive,
        }
      : null,
    uploads: uploads.map((u) => ({
      id: u.id,
      category: u.category,
      filename: u.filename,
      originalFilename: u.originalFilename,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/download/${u.id}`,
      previewUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/preview/${u.id}`,
      createdAt: u.createdAt,
    })),
  };
};
