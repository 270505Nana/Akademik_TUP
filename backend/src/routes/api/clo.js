import express from "express";
import {
  createCloProdi,
  getCloProdis,
  getCloProdiById,
  updateCloProdi,
  deleteCloProdi,
} from "../../controllers/cloController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isAdminOrKetuaKKOrKetuaProdi } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listCloQuerySchema,
  createCloSchema,
  updateCloSchema,
} from "../../schemas/cloSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: CLO
 *   description: Course Learning Outcomes endpoints
 */

/**
 * @swagger
 * /api/clo:
 *   get:
 *     summary: Get all CLO data (with filter, sort, and pagination)
 *     tags: [CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by CLO name or description
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter CLO by Study Program ID
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
 *         description: CLO data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token or access denied
 */
router.get("/", verifyToken, validate(listCloQuerySchema, "query"), getCloProdis);

/**
 * @swagger
 * /api/clo:
 *   post:
 *     summary: Create new CLO (Admin, Ketua KK, atau Ketua Prodi)
 *     tags: [CLO]
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
 *               - studyProgramId
 *             properties:
 *               name:
 *                 type: string
 *                 example: CLO 5.1
 *               description:
 *                 type: string
 *                 example: Mampu menerapkan komunikasi secara efektif.
 *               studyProgramId:
 *                 type: string
 *     responses:
 *       201:
 *         description: CLO created successfully (Admin / Ketua KK)
 *       202:
 *         description: Approval request submitted successfully (Ketua Prodi)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi prodi sama)
 *       404:
 *         description: Program Studi tidak ditemukan
 */
router.post(
  "/",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(createCloSchema),
  createCloProdi
);

/**
 * @swagger
 * /api/clo/{id}:
 *   get:
 *     summary: Get CLO by ID
 *     tags: [CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: CLO UUID
 *     responses:
 *       200:
 *         description: CLO data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: CLO not found
 */
router.get("/:id", verifyToken, getCloProdiById);

/**
 * @swagger
 * /api/clo/{id}:
 *   put:
 *     summary: Update CLO (Admin, Ketua KK, atau Ketua Prodi)
 *     tags: [CLO]
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
 *         description: CLO updated successfully (Admin/Ketua KK) or existing request updated (Ketua Prodi)
 *       202:
 *         description: Approval request submitted successfully (Ketua Prodi)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: CLO not found
 *       409:
 *         description: Pending approval request conflict
 */
router.put(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(updateCloSchema),
  updateCloProdi
);

/**
 * @swagger
 * /api/clo/{id}:
 *   delete:
 *     summary: Delete CLO (soft delete) (Admin, Ketua KK, atau Ketua Prodi)
 *     tags: [CLO]
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
 *         description: CLO deleted successfully (Admin/Ketua KK) or existing request updated to delete (Ketua Prodi)
 *       202:
 *         description: Delete approval request submitted successfully (Ketua Prodi)
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: CLO not found
 *       409:
 *         description: Pending approval request conflict
 */
router.delete(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  deleteCloProdi
);

export default router;
