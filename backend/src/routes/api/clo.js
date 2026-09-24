import express from 'express';

const router = express.Router();

import {
  createCloProdi,
  getCloProdis,
  getCloProdiById,
  updateCloProdi,
  deleteCloProdi,
} from '../../controllers/cloController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin } from '../../middlewares/authorize.js';

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
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: CLO data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, getCloProdis);

/**
 * @swagger
 * /api/clo:
 *   post:
 *     summary: Create new CLO
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
 *         description: CLO created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 */
router.post("/", verifyToken, isAdmin, createCloProdi); 

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
 *       404:
 *         description: CLO not found
 */
router.get("/:id", verifyToken, getCloProdiById);

/**
 * @swagger
 * /api/clo/{id}:
 *   put:
 *     summary: Update CLO
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
 *         description: CLO updated successfully
 *       404:
 *         description: CLO not found
 */
router.put("/:id", verifyToken, isAdmin, updateCloProdi); 

/**
 * @swagger
 * /api/clo/{id}:
 *   delete:
 *     summary: Delete CLO (soft delete)
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
 *         description: CLO deleted successfully
 *       404:
 *         description: CLO not found
 */
router.delete("/:id", verifyToken, isAdmin, deleteCloProdi); 

export default router;