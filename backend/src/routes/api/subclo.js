import express from "express";
import {
  createSubcloProdi,
  getSubcloProdis,
  getSubcloProdiById,
  updateSubcloProdi,
  deleteSubcloProdi,
} from "../../controllers/subCloController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isAdminOrKetuaKKOrKetuaProdi } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listSubcloQuerySchema,
  createSubcloSchema,
  updateSubcloSchema,
} from "../../schemas/subcloSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sub CLO
 *   description: Sub Course Learning Outcomes endpoints
 */

/**
 * @swagger
 * /api/subclo:
 *   get:
 *     summary: Get all Sub CLO data (with filter, sort, and pagination)
 *     tags: [Sub CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by Sub CLO name or description
 *       - in: query
 *         name: cloProdiId
 *         schema:
 *           type: string
 *         description: Filter by Parent CLO ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Sub CLO retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token or access denied
 */
router.get(
  "/",
  verifyToken,
  validate(listSubcloQuerySchema, "query"),
  getSubcloProdis
);

/**
 * @swagger
 * /api/subclo:
 *   post:
 *     summary: Create new Sub CLO (Admin, Ketua KK, atau Ketua Prodi)
 *     tags: [Sub CLO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - cloProdiId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sub CLO 5.1.1
 *               description:
 *                 type: string
 *                 example: Mampu menyusun materi presentasi teknis.
 *               cloProdiId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sub CLO created successfully (Admin / Ketua KK)
 *       202:
 *         description: Approval request submitted successfully (Ketua Prodi)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi prodi sama)
 *       404:
 *         description: CLO tidak ditemukan
 */
router.post(
  "/",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(createSubcloSchema),
  createSubcloProdi
);

/**
 * @swagger
 * /api/subclo/{id}:
 *   get:
 *     summary: Get Sub CLO by ID
 *     tags: [Sub CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sub CLO UUID
 *     responses:
 *       200:
 *         description: Sub CLO retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sub clo tidak ditemukan
 */
router.get("/:id", verifyToken, getSubcloProdiById);

/**
 * @swagger
 * /api/subclo/{id}:
 *   put:
 *     summary: Update Sub CLO (Admin, Ketua KK, atau Ketua Prodi)
 *     tags: [Sub CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sub CLO updated successfully (Admin/Ketua KK) or existing request updated (Ketua Prodi)
 *       202:
 *         description: Approval request submitted successfully (Ketua Prodi)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sub clo tidak ditemukan
 *       409:
 *         description: Pending approval request conflict
 */
router.put(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(updateSubcloSchema),
  updateSubcloProdi
);

/**
 * @swagger
 * /api/subclo/{id}:
 *   delete:
 *     summary: Delete Sub CLO (soft delete) (Admin, Ketua KK, atau Ketua Prodi)
 *     tags: [Sub CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub CLO deleted successfully (Admin/Ketua KK) or existing request updated to delete (Ketua Prodi)
 *       202:
 *         description: Delete approval request submitted successfully (Ketua Prodi)
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sub clo tidak ditemukan
 *       409:
 *         description: Pending approval request conflict
 */
router.delete(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  deleteSubcloProdi
);

export default router;
