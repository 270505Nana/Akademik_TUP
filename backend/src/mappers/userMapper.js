// mapper model user
export const mapUser = (user) => {
  if (!user) return null;
  const { password: _, deletedAt: __, ...cleanUser } = user;
  return cleanUser;
};

// mapper untuk mahasiswa
export const mapMahasiswa = (mahasiswa) => {
  if (!mahasiswa) return null;
  return {
    id: mahasiswa.id,
    nim: mahasiswa.nim || "",
    kelasAsal: mahasiswa.kelasAsal || "",
    tahunAngkatan: mahasiswa.tahunAngkatan,
    sks: mahasiswa.sks,
    ipk: mahasiswa.ipk,
    tak: mahasiswa.tak,
    studyProgramId: mahasiswa.studyProgramId,
    dosenWaliId: mahasiswa.dosenWaliId,
    name: mahasiswa.user?.name || "",
    email: mahasiswa.user?.email || "",
    phone: mahasiswa.user?.phone || null,
    studyProgram: mahasiswa.studyProgram
      ? {
          id: mahasiswa.studyProgram.id,
          name: mahasiswa.studyProgram.name,
          isActive: mahasiswa.studyProgram.isActive,
          facultyId: mahasiswa.studyProgram.facultyId,
        }
      : null,
  };
};

// mapper untuk dosen
export const mapDosen = (dosen) => {
  if (!dosen) return null;
  return {
    id: dosen.id,
    nip: dosen.nip,
    nidn: dosen.nidn,
    kodeDosen: dosen.kodeDosen,
    isKetuaKK: dosen.isKetuaKK,
    researchGroupId: dosen.researchGroupId,
    userId: dosen.userId,
    name: dosen.user?.name || "",
    email: dosen.user?.email || "",
    phone: dosen.user?.phone || null,
    researchGroup: dosen.researchGroup
      ? {
          id: dosen.researchGroup.id,
          name: dosen.researchGroup.name,
          isActive: dosen.researchGroup.isActive,
        }
      : undefined,
  };
};

// mapper untuk admin
export const mapAdmin = (admin) => {
  if (!admin) return null;
  return {
    id: admin.id,
    userId: admin.userId,
    name: admin.user?.name || "",
    email: admin.user?.email || "",
    phone: admin.user?.phone || null,
  };
};
