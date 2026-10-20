/**
 * Mapper untuk Skema Penilai Prodi
 */
export const mapSkemaPenilai = (item) => {
  if (!item) return null;

  const result = {
    id: item.id,
    type: item.type,
    bobot: item.bobot,
    studyProgramId: item.studyProgramId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt ?? null,
  };

  if (item.studyProgram !== undefined) {
    result.studyProgram = item.studyProgram
      ? {
          id: item.studyProgram.id,
          name: item.studyProgram.name,
          facultyId: item.studyProgram.facultyId,
          isActive: item.studyProgram.isActive,
          createdAt: item.studyProgram.createdAt,
          updatedAt: item.studyProgram.updatedAt,
          deletedAt: item.studyProgram.deletedAt ?? null,
        }
      : null;
  }

  return result;
};
