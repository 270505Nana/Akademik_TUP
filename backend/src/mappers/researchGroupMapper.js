/**
 * Mapper untuk model Research Group
 */
export const mapResearchGroup = (rg) => {
  if (!rg) return null;

  const mapped = {
    id: rg.id,
    name: rg.name,
    isActive: rg.isActive,
    createdAt: rg.createdAt,
    updatedAt: rg.updatedAt,
    deletedAt: rg.deletedAt ?? null,
  };

  if (rg.researchGroupStudyPrograms !== undefined) {
    mapped.researchGroupStudyPrograms = rg.researchGroupStudyPrograms.map((rgsp) => ({
      id: rgsp.id,
      createdAt: rgsp.createdAt,
      updatedAt: rgsp.updatedAt,
      deletedAt: rgsp.deletedAt ?? null,
      researchGroupId: rgsp.researchGroupId,
      studyProgramId: rgsp.studyProgramId,
      studyProgram: rgsp.studyProgram
        ? {
            id: rgsp.studyProgram.id,
            name: rgsp.studyProgram.name,
            isActive: rgsp.studyProgram.isActive,
            facultyId: rgsp.studyProgram.facultyId,
          }
        : undefined,
    }));
  }

  return mapped;
};
