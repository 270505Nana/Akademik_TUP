/**
 * Mapper untuk Approval Change Request
 */
export const mapApprovalRequest = (item) => {
  if (!item) return null;

  const result = {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt ?? null,
    entityType: item.entityType,
    action: item.action,
    targetId: item.targetId ?? null,
    title: item.title ?? null,
    payload: item.payload,
    oldData: item.oldData ?? null,
    status: item.status,
    rejectionNote: item.rejectionNote ?? null,
    studyProgramId: item.studyProgramId,
    requestedById: item.requestedById,
    approvedById: item.approvedById ?? null,
  };

  if (item.studyProgram !== undefined) {
    result.studyProgram = item.studyProgram;
  }
  if (item.requestedBy !== undefined) {
    result.requestedBy = item.requestedBy;
  }
  if (item.approvedBy !== undefined) {
    result.approvedBy = item.approvedBy;
  }

  return result;
};
