export const mapPermohonanToFrontend = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    category: item.category,
    mahasiswaId: item.mahasiswaId,
    judulProposalIndonesia: item.judulProposalIndonesia,
    judulProposalInggris: item.judulProposalInggris,
    dosenPembimbing1Id: item.dosenPembimbing1Id,
    dosenPembimbing2Id: item.dosenPembimbing2Id,
    researchGroupId: item.researchGroupId,
    adminId: item.adminId,
    hasUploadedFinalProposal: item.hasUploadedFinalProposal,
    hasTakenLanguageTest: item.hasTakenLanguageTest,
    expDate: item.expDate,
    wasRejectedBefore: item.wasRejectedBefore ?? false,
    message: item.message,
    isEdit: item.isEdit,
    evidenceUploadPath: item.evidenceUploadPath,
    sktaUploadPath: item.sktaUploadPath,
    mahasiswa: item.mahasiswa
      ? {
          id: item.mahasiswa.id,
          nim: item.mahasiswa.nim || "",
          kelasAsal: item.mahasiswa.kelasAsal || "",
          tahunAngkatan: item.mahasiswa.tahunAngkatan,
          sks: item.mahasiswa.sks,
          ipk: item.mahasiswa.ipk,
          tak: item.mahasiswa.tak,
          studyProgramId: item.mahasiswa.studyProgramId,
          dosenWaliId: item.mahasiswa.dosenWaliId,
          name: item.mahasiswa.user?.name || "",
          email: item.mahasiswa.user?.email || "",
          phone: item.mahasiswa.user?.phone || null,
          studyProgram: item.mahasiswa.studyProgram
            ? {
                id: item.mahasiswa.studyProgram.id,
                name: item.mahasiswa.studyProgram.name,
                isActive: item.mahasiswa.studyProgram.isActive,
                facultyId: item.mahasiswa.studyProgram.facultyId,
              }
            : null,
        }
      : null,
    dosenPembimbing1: item.dosenPembimbing1
      ? {
          id: item.dosenPembimbing1.id,
          nip: item.dosenPembimbing1.nip,
          nidn: item.dosenPembimbing1.nidn,
          kodeDosen: item.dosenPembimbing1.kodeDosen,
          researchGroupId: item.dosenPembimbing1.researchGroupId,
          userId: item.dosenPembimbing1.userId,
          name: item.dosenPembimbing1.user?.name || "",
          email: item.dosenPembimbing1.user?.email || "",
          phone: item.dosenPembimbing1.user?.phone || null,
        }
      : null,
    dosenPembimbing2: item.dosenPembimbing2
      ? {
          id: item.dosenPembimbing2.id,
          nip: item.dosenPembimbing2.nip,
          nidn: item.dosenPembimbing2.nidn,
          kodeDosen: item.dosenPembimbing2.kodeDosen,
          researchGroupId: item.dosenPembimbing2.researchGroupId,
          userId: item.dosenPembimbing2.userId,
          name: item.dosenPembimbing2.user?.name || "",
          email: item.dosenPembimbing2.user?.email || "",
          phone: item.dosenPembimbing2.user?.phone || null,
        }
      : null,
    researchGroup: item.researchGroup
      ? {
          id: item.researchGroup.id,
          name: item.researchGroup.name,
          isActive: item.researchGroup.isActive,
        }
      : null,
    admin: item.admin
      ? {
          id: item.admin.id,
          userId: item.admin.userId,
          name: item.admin.user?.name || "",
          email: item.admin.user?.email || "",
          phone: item.admin.user?.phone || null,
        }
      : null,
    evidenceDownloadUrl: item.evidenceUploadPath
      ? `${req.protocol}://${req.get("host")}/api/permohonan-skta/${item.id}/download/evidence`
      : null,
    sktaDownloadUrl: item.sktaUploadPath
      ? `${req.protocol}://${req.get("host")}/api/permohonan-skta/${item.id}/download/skta`
      : null,
  };
};
