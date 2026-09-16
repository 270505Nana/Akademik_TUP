/**
 * Mapping data mahasiswa untuk mahasiswa bimbingan:
 * - sks, ipk, tak diambil dari pendaftaran sidang (sidang registration)
 * - tanpa studyProgramId dan dosenWaliId
 */
export const mapMahasiswaBimbinganStudent = (mahasiswa, reg = {}) => {
  if (!mahasiswa) return null;
  return {
    id: mahasiswa.id,
    nim: mahasiswa.nim || "",
    name: mahasiswa.user?.name || "",
    email: mahasiswa.user?.email || "",
    phone: mahasiswa.user?.phone || null,
    kelasAsal: mahasiswa.kelasAsal || "",
    tahunAngkatan: mahasiswa.tahunAngkatan,
    sks: reg.sks !== undefined ? reg.sks : (mahasiswa.sks ?? null),
    ipk: reg.ipk !== undefined ? reg.ipk : (mahasiswa.ipk ?? null),
    tak: reg.tak !== undefined ? reg.tak : (mahasiswa.tak ?? null),
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

/**
 * Menghitung status dinamis mahasiswa bimbingan:
 * - Kadaluarsa: jika sktaExpDate <= now
 * - Mengirim Revisi: jika isEdit !== null
 * - Dalam Proses: sudah submit pendaftaran sidang tapi belum di approve
 * - SK Terbit: jika SKTA sudah diterbitkan
 * - SK Belum Terbit: jika SKTA belum diterbitkan
 */
export const determineBimbinganStatus = (reg) => {
  const latestSkta = reg.mahasiswa?.permohonanSkta?.[0];
  const now = new Date();
  const expDate = reg.sktaExpDate || latestSkta?.expDate;

  // 1. Kadaluarsa jika sktaExpDate <= now
  if (expDate && new Date(expDate) <= now) {
    return "Kadaluarsa";
  }

  // 2. Mengirim Revisi jika isEdit !== null
  if (reg.isEdit !== null && reg.isEdit !== undefined) {
    return "Mengirim Revisi";
  }

  // 3. Dalam Proses: sudah submit pendaftaran sidang tapi belum di approve
  if ((!reg.isDraft || reg.submittedAt !== null) && !reg.sidangPeriodId) {
    return "Dalam Proses";
  }

  // 4. SK Terbit vs SK Belum Terbit
  const hasSkta = Boolean(latestSkta?.sktaUploadPath);
  if (hasSkta) {
    return "SK Terbit";
  }

  return "SK Belum Terbit";
};

/**
 * Mapping data pendaftaran sidang mahasiswa bimbingan ke format response API
 */
export const mapMahasiswaBimbinganToFrontend = (reg, req) => {
  if (!reg) return null;

  const latestSkta = reg.mahasiswa?.permohonanSkta?.[0];
  const sktaDownloadUrl = latestSkta?.sktaUploadPath
    ? `${req.protocol}://${req.get("host")}/api/permohonan-skta/${latestSkta.id}/download/skta`
    : null;

  return {
    id: reg.id,
    createdAt: reg.createdAt,
    updatedAt: reg.updatedAt,
    mahasiswa: mapMahasiswaBimbinganStudent(reg.mahasiswa, reg),
    judulTugasAkhirIndonesia: reg.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: reg.judulTugasAkhirInggris,
    status: determineBimbinganStatus(reg),
    sktaDownloadUrl,
  };
};
