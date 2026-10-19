import { mapFaculty } from "./facultyMapper.js";

/**
 * Mapper untuk model Study Program
 */
export const mapStudyProgram = (prodi) => {
  if (!prodi) return null;

  return {
    id: prodi.id,
    name: prodi.name,
    isActive: prodi.isActive,
    facultyId: prodi.facultyId,
    createdAt: prodi.createdAt,
    updatedAt: prodi.updatedAt,
    deletedAt: prodi.deletedAt ?? null,
    faculty: prodi.faculty ? mapFaculty(prodi.faculty) : undefined,
  };
};
