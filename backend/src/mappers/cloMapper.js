import { mapStudyProgram } from "./studyProgramMapper.js";

/**
 * Mapper untuk Sub CLO
 */
export const mapSubclo = (subclo) => {
  if (!subclo) return null;

  return {
    id: subclo.id,
    name: subclo.name,
    description: subclo.description,
    cloProdiId: subclo.cloProdiId,
    createdAt: subclo.createdAt,
    updatedAt: subclo.updatedAt,
    deletedAt: subclo.deletedAt ?? null,
  };
};

/**
 * Mapper untuk CLO (Course Learning Outcomes)
 */
export const mapClo = (clo) => {
  if (!clo) return null;

  const result = {
    id: clo.id,
    name: clo.name,
    description: clo.description,
    studyProgramId: clo.studyProgramId,
    createdAt: clo.createdAt,
    updatedAt: clo.updatedAt,
    deletedAt: clo.deletedAt ?? null,
  };

  if (clo.studyProgram !== undefined) {
    result.studyProgram = clo.studyProgram ? mapStudyProgram(clo.studyProgram) : null;
  }

  if (clo.subcloProdi !== undefined) {
    result.subcloProdi = Array.isArray(clo.subcloProdi)
      ? clo.subcloProdi.map(mapSubclo)
      : [];
  }

  return result;
};
