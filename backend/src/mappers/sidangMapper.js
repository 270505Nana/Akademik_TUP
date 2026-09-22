import { mapMahasiswa, mapDosen, mapAdmin } from "./userMapper.js";

export const mapSidangRegistrationToFrontend = (item, req) => {
  if (!item) return null;

  const uploads = item.sidangRegistrationUploads || [];

  return {
    id: item.id,
    periodId: item.periodId,
    sidangPeriodId: item.sidangPeriodId,
    isEdit: item.isEdit,
    message: item.message,
    mahasiswaId: item.mahasiswaId,
    program: item.program,
    sks: item.sks,
    ipk: item.ipk,
    tak: item.tak,
    sktaExpDate: item.sktaExpDate,
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: item.judulTugasAkhirInggris,
    dosenPembimbing1Id: item.dosenPembimbing1Id,
    dosenPembimbing2Id: item.dosenPembimbing2Id,
    dosenWaliId: item.dosenWaliId,
    dosenPenguji1Id: item.dosenPenguji1Id,
    dosenPenguji2Id: item.dosenPenguji2Id,
    adminId: item.adminId,
    researchGroupId: item.researchGroupId,
    skemaSidang: item.skemaSidang,
    jalurNonSidang: item.jalurNonSidang,
    lulusTesBahasa: item.lulusTesBahasa,
    skorTesBahasa: item.skorTesBahasa,
    status: item.status,
    isDraft: item.isDraft,
    submittedAt: item.submittedAt,
    reviewNotes: item.reviewNotes,
    tglSidang: item.tglSidang,
    waktuMulai: item.waktuMulai,
    waktuSelesai: item.waktuSelesai,
    ruangan: item.ruangan,
    ruanganId: item.ruanganId,
    linkSidang: item.linkSidang,
    beritaAcaraUrl: item.beritaAcaraUrl,
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
    dosenPenguji1: item.dosenPenguji1 ? mapDosen(item.dosenPenguji1) : null,
    dosenPenguji2: item.dosenPenguji2 ? mapDosen(item.dosenPenguji2) : null,
    admin: item.admin ? mapAdmin(item.admin) : null,
    researchGroup: item.researchGroup
      ? {
          id: item.researchGroup.id,
          name: item.researchGroup.name,
          isActive: item.researchGroup.isActive,
        }
      : null,
    sidangPeriod: item.sidangPeriod
      ? {
          id: item.sidangPeriod.id,
          name: item.sidangPeriod.name,
          startDate: item.sidangPeriod.startDate,
          endDate: item.sidangPeriod.endDate,
          isActive: item.sidangPeriod.isActive,
          isOpen: item.sidangPeriod.isOpen,
        }
      : null,
    sidangRegistrationUploads: uploads.map((u) => ({
      id: u.id,
      name: u.name,
      category: u.category,
      filepath: u.filepath,
      isValid: u.isValid,
      sidangRegistrationId: u.sidangRegistrationId,
      downloadUrl: req
        ? `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${u.id}/download`
        : null,
    })),
  };
};
