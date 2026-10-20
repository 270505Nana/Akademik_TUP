import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Approval Requests (GET /api/approval-requests)
 */
export const listApprovalRequestQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.toUpperCase().trim() : val),
    z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"], {
      error: "status harus salah satu dari: PENDING, APPROVED, REJECTED, CANCELLED",
    }).optional()
  ),
  entityType: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.toUpperCase().trim() : val),
    z.enum(["CLO", "SUB_CLO", "JENIS_ASESMEN"], {
      error: "entityType harus salah satu dari: CLO, SUB_CLO, JENIS_ASESMEN",
    }).optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "status", "entityType", "action"], {
      error: "sortBy harus salah satu dari: createdAt, updatedAt, title, status, entityType, action",
    })
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      error: "sortOrder harus salah satu dari: asc, desc",
    })
    .optional()
    .default("desc"),
  page: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).optional()
  ),
  limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(100).optional()
  ),
});

/**
 * Schema untuk Reject Approval Request (PATCH /api/approval-requests/:id/reject)
 */
export const rejectApprovalRequestSchema = z.object({
  rejectionNote: z
    .string({ required_error: "Alasan penolakan wajib diisi" })
    .trim()
    .min(1, "Alasan penolakan wajib diisi"),
});
