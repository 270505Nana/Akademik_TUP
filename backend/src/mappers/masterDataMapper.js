import { mapFaculty } from "./facultyMapper.js";

export const mapRuangan = (ruangan) => {
  if (!ruangan) return null;
  return {
    id: ruangan.id,
    name: ruangan.name,
    gedung: ruangan.gedung,
    isActive: ruangan.isActive,
  };
};

export const mapStudyProgram = (prodi) => {
  if (!prodi) return null;
  return {
    id: prodi.id,
    name: prodi.name,
    code: prodi.code,
    facultyId: prodi.facultyId,
    isActive: prodi.isActive,
    faculty: prodi.faculty ? mapFaculty(prodi.faculty) : undefined,
  };
};
