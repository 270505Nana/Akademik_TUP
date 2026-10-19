/**
 * Mapper untuk model Faculty
 */
export const mapFaculty = (faculty) => {
  if (!faculty) return null;

  return {
    id: faculty.id,
    name: faculty.name,
    isActive: faculty.isActive,
    createdAt: faculty.createdAt,
    updatedAt: faculty.updatedAt,
    deletedAt: faculty.deletedAt ?? null,
  };
};
