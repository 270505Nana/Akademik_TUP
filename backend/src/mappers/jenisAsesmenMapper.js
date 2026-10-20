/**
 * Mapper untuk Jenis Asesmen CLO
 */
export const mapJenisAsesmen = (item) => {
  if (!item) return null;

  const result = {
    id: item.id,
    content: item.content,
    bobot: item.bobot,
    cloProdiId: item.cloProdiId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt ?? null,
  };

  if (item.cloProdi !== undefined) {
    result.cloProdi = item.cloProdi
      ? {
          id: item.cloProdi.id,
          name: item.cloProdi.name,
          description: item.cloProdi.description,
          studyProgramId: item.cloProdi.studyProgramId,
          createdAt: item.cloProdi.createdAt,
          updatedAt: item.cloProdi.updatedAt,
          deletedAt: item.cloProdi.deletedAt ?? null,
          ...(item.cloProdi.studyProgram !== undefined
            ? { studyProgram: item.cloProdi.studyProgram }
            : {}),
        }
      : null;
  }

  return result;
};
