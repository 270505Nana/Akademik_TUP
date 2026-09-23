import express from 'express';

const router = express.Router();

import {
  createSubcloProdi,
  getSubcloProdis,
  getSubcloProdiById,
  updateSubcloProdi,
  deleteSubcloProdi,
} from '../../controllers/subCloController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin } from '../../middlewares/authorize.js';

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
 *     summary: Get all Sub CLO data
 *     tags: [Sub CLO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: cloProdiId
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Sub CLO retrieved successfully
 */
router.get("/", verifyToken, getSubcloProdis);

/**
 * @swagger
 * /api/subclo:
 *   post:
 *     summary: Create new Sub CLO
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
 *               cloProdiId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sub CLO created successfully
 */
router.post("/", verifyToken, isAdmin, createSubcloProdi);

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
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id", verifyToken, getSubcloProdiById);

/**
 * @swagger
 * /api/subclo/{id}:
 *   put:
 *     summary: Update Sub CLO
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
 *         description: Updated successfully
 */
router.put("/:id", verifyToken, isAdmin, updateSubcloProdi);

/**
 * @swagger
 * /api/subclo/{id}:
 *   delete:
 *     summary: Delete Sub CLO
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
 *         description: Deleted successfully
 */
router.delete("/:id", verifyToken, isAdmin, deleteSubcloProdi);

export default router;