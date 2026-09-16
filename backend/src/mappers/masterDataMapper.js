export const mapRuangan = (ruangan) => {
  if (!ruangan) return null;
  return {
    id: ruangan.id,
    name: ruangan.name,
    gedung: ruangan.gedung,
    isActive: ruangan.isActive,
  };
};

export const mapFaculty = (faculty) => {
  if (!faculty) return null;
  return {
    id: faculty.id,
    name: faculty.name,
    code: faculty.code,
    isActive: faculty.isActive,
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

export const mapResearchGroup = (rg) => {
  if (!rg) return null;
  return {
    id: rg.id,
    name: rg.name,
    isActive: rg.isActive,
  };
};
