import express from "express";

const router = express.Router();

import {
  listApprovalRequests,
  findApprovalRequestById,
  approveApprovalRequest,
  rejectApprovalRequest,
  cancelApprovalRequest,
} from "../../controllers/approvalRequestController.js";

import { verifyToken } from "../../middlewares/auth.js";
import { isAdminOrKetuaKKOrKetuaProdi } from "../../middlewares/authorize.js";

/**
 * @swagger
 * tags:
 *   name: Approval Requests
 *   description: Endpoints for reviewing and managing curriculum change requests (Maker-Checker Workflow)
 */

/**
 * @swagger
 * /api/approval-requests:
 *   get:
 *     summary: Get all approval requests with role-based scoping (Admin, Ketua KK, Kaprodi)
 *     tags: [Approval Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or rejection note
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         description: Filter by request status
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [CLO, SUB_CLO, JENIS_ASESMEN]
 *         description: Filter by target entity type
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter by Study Program ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, status, entityType, action]
 *         description: Field name to sort by (default createdAt)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort direction (default desc)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Approval requests retrieved successfully with pagination
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 */
router.get("/", verifyToken, isAdminOrKetuaKKOrKetuaProdi, listApprovalRequests);

/**
 * @swagger
 * /api/approval-requests/{id}:
 *   get:
 *     summary: Get approval request by ID with diff comparison
 *     tags: [Approval Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval request UUID
 *     responses:
 *       200:
 *         description: Approval request data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Approval request not found
 */
router.get("/:id", verifyToken, isAdminOrKetuaKKOrKetuaProdi, findApprovalRequestById);

/**
 * @swagger
 * /api/approval-requests/{id}/approve:
 *   patch:
 *     summary: Approve curriculum change request (Ketua KK or Admin only)
 *     tags: [Approval Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval request UUID
 *     responses:
 *       200:
 *         description: Change request approved and changes applied successfully to active data
 *       400:
 *         description: Request cannot be approved due to invalid status
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Only Ketua KK of the connected study program or Admin)
 *       404:
 *         description: Approval request not found
 */
router.patch("/:id/approve", verifyToken, isAdminOrKetuaKKOrKetuaProdi, approveApprovalRequest);

/**
 * @swagger
 * /api/approval-requests/{id}/reject:
 *   patch:
 *     summary: Reject curriculum change request (Ketua KK or Admin only)
 *     tags: [Approval Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval request UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionNote
 *             properties:
 *               rejectionNote:
 *                 type: string
 *                 example: Deskripsi CLO belum selaras dengan standar CPL program studi.
 *     responses:
 *       200:
 *         description: Change request rejected successfully
 *       400:
 *         description: Validation error or invalid status
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Approval request not found
 */
router.patch("/:id/reject", verifyToken, isAdminOrKetuaKKOrKetuaProdi, rejectApprovalRequest);

/**
 * @swagger
 * /api/approval-requests/{id}/cancel:
 *   patch:
 *     summary: Cancel pending approval request by requester (Kaprodi or Admin)
 *     tags: [Approval Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval request UUID
 *     responses:
 *       200:
 *         description: Change request cancelled successfully
 *       400:
 *         description: Request cannot be cancelled due to invalid status
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Only requester or Admin)
 *       404:
 *         description: Approval request not found
 */
router.patch("/:id/cancel", verifyToken, isAdminOrKetuaKKOrKetuaProdi, cancelApprovalRequest);

export default router;
