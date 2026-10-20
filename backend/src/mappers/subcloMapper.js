/**
 * Mapper untuk Sub CLO (Sub Course Learning Outcomes)
 */
export const mapSubclo = (subclo) => {
  if (!subclo) return null;

  const result = {
    id: subclo.id,
    name: subclo.name,
    description: subclo.description,
    cloProdiId: subclo.cloProdiId,
    createdAt: subclo.createdAt,
    updatedAt: subclo.updatedAt,
    deletedAt: subclo.deletedAt ?? null,
  };

  if (subclo.cloProdi !== undefined) {
    result.cloProdi = subclo.cloProdi
      ? {
          id: subclo.cloProdi.id,
          name: subclo.cloProdi.name,
          description: subclo.cloProdi.description,
          studyProgramId: subclo.cloProdi.studyProgramId,
          createdAt: subclo.cloProdi.createdAt,
          updatedAt: subclo.cloProdi.updatedAt,
          deletedAt: subclo.cloProdi.deletedAt ?? null,
          ...(subclo.cloProdi.studyProgram !== undefined
            ? { studyProgram: subclo.cloProdi.studyProgram }
            : {}),
        }
      : null;
  }

  return result;
};
