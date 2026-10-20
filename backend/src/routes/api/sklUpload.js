import express from "express";
import {
  listSklUploads,
  getSklUploadById,
  createSklUpload,
  updateSklUpload,
  deleteSklUpload,
  downloadSklUpload,
} from "../../controllers/sklUploadController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { upload } from "../../middlewares/upload.js";
import { isAdmin } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listSklQuerySchema,
  createSklSchema,
  updateSklSchema,
} from "../../schemas/sklSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SKL Upload
 *   description: SKL upload and management endpoints
 */

/**
 * @swagger
 * /api/skl:
 *   get:
 *     summary: Retrieve list of SKL uploads (paginated, filterable, sortable)
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mahasiswaId
 *         schema:
 *           type: string
 *         description: Filter by Mahasiswa ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword by file name, student name, or NIM
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: List of SKL uploads retrieved successfully with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, validate(listSklQuerySchema, "query"), listSklUploads);

/**
 * @swagger
 * /api/skl/uploads/{id}/download:
 *   get:
 *     summary: Download an SKL upload file by SKL upload ID or Mahasiswa ID
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKL upload ID or Mahasiswa ID (UUID)
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: SKL upload file not found
 *       500:
 *         description: Internal server error
 */
router.get("/uploads/:id/download", verifyToken, downloadSklUpload);

/**
 * @swagger
 * /api/skl/{id}:
 *   get:
 *     summary: Get details of an SKL upload by SKL upload ID or Mahasiswa ID
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKL upload ID or Mahasiswa ID (UUID)
 *     responses:
 *       200:
 *         description: SKL upload details retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: SKL upload not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getSklUploadById);

/**
 * @swagger
 * /api/skl:
 *   post:
 *     summary: Upload a new SKL
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mahasiswaId
 *               - sklFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Surat Keterangan Lulus (SKL)
 *               mahasiswaId:
 *                 type: string
 *                 description: Required student ID (only academic staff can upload).
 *                 example: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
 *               sklFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the SKL
 *     responses:
 *       200:
 *         description: SKL updated successfully (existing replaced)
 *       201:
 *         description: SKL uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token or Access denied (Admin only)
 *       404:
 *         description: Mahasiswa not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload("skl").single("sklFile"),
  validate(createSklSchema),
  createSklUpload
);

/**
 * @swagger
 * /api/skl/{id}:
 *   patch:
 *     summary: Update an existing SKL upload
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKL upload ID or Mahasiswa ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated SKL Name
 *               mahasiswaId:
 *                 type: string
 *                 description: Target student ID if updating owner.
 *                 example: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
 *               sklFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the new SKL to replace the old one
 *     responses:
 *       200:
 *         description: SKL updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Admin only)
 *       404:
 *         description: SKL upload or Mahasiswa not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAdmin,
  upload("skl").single("sklFile"),
  validate(updateSklSchema),
  updateSklUpload
);

/**
 * @swagger
 * /api/skl/{id}:
 *   delete:
 *     summary: Soft-delete an SKL upload
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKL upload ID or Mahasiswa ID (UUID)
 *     responses:
 *       200:
 *         description: SKL deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Admin only)
 *       404:
 *         description: SKL upload not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAdmin, deleteSklUpload);

export default router;
