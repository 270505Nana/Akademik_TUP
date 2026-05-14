const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");
const {
  listYudisiumRegistrations,
  getYudisiumRegistrationById,
  getYudisiumRegistrationByStudentId,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  deleteYudisiumRegistration,
  uploadYudisiumRegistrationFile,
  getYudisiumRegistrationFiles,
  downloadYudisiumRegistrationFile,
} = require("../../controllers/yudisiumRegistrationController");
const {
  saveYudisiumRegistrationValidator,
  submitYudisiumRegistrationValidator,
} = require("../../validators/yudisiumRegistrationValidator");
const { isStudent, isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Yudisium Registration
 *   description: Yudisium registration endpoints
 */

/**
 * @swagger
 * /api/yudisium-registrations:
 *   get:
 *     summary: Get all yudisium registrations
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yudisium registrations data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listYudisiumRegistrations);

/**
 * @swagger
 * /api/yudisium-registrations/{id}:
 *   get:
 *     summary: Get yudisium registration by ID
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yudisium registration ID
 *     responses:
 *       200:
 *         description: Yudisium registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 */
router.get("/:id", verifyToken, getYudisiumRegistrationById);

/**
 * @swagger
 * /api/yudisium-registrations/student/{studentId}:
 *   get:
 *     summary: Get yudisium registration by student ID
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Yudisium registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 */
router.get(
  "/student/:studentId",
  verifyToken,
  getYudisiumRegistrationByStudentId,
);

/**
 * @swagger
 * /api/yudisium-registrations/save:
 *   post:
 *     summary: Save draft yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Yudisium registration saved as draft successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/save",
  verifyToken,
  isStudent,
  saveYudisiumRegistrationValidator,
  validate,
  saveYudisiumRegistration,
);

/**
 * @swagger
 * /api/yudisium-registrations/submit:
 *   post:
 *     summary: Submit yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Yudisium registration submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/submit",
  verifyToken,
  isStudent,
  submitYudisiumRegistrationValidator,
  validate,
  submitYudisiumRegistration,
);

/**
 * @swagger
 * /api/yudisium-registrations/{id}:
 *   delete:
 *     summary: Delete yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yudisium registration ID
 *     responses:
 *       200:
 *         description: Yudisium registration deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAcademicStaff, deleteYudisiumRegistration);

/**
 * @swagger
 * /api/yudisium-registrations/{id}/uploads:
 *   post:
 *     summary: Upload a file for a yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yudisium registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - slug
 *               - name
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               slug:
 *                 type: string
 *                 description: The unique identifier for this file type
 *               name:
 *                 type: string
 *                 description: Human readable name of the file
 *     responses:
 *       200:
 *         description: File uploaded/updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Yudisium registration not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/uploads",
  verifyToken,
  isStudent,
  upload("yudisium-requirements").single("file"),
  uploadYudisiumRegistrationFile,
);

/**
 * @swagger
 * /api/yudisium-registrations/{id}/uploads:
 *   get:
 *     summary: Get uploaded files for a yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yudisium registration ID
 *     responses:
 *       200:
 *         description: Uploaded files retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 */
router.get("/:id/uploads", verifyToken, getYudisiumRegistrationFiles);

/**
 * @swagger
 * /api/yudisium-registrations/uploads/{uploadId}/download:
 *   get:
 *     summary: Download yudisium registration upload by ID
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Upload ID
 *     responses:
 *       200:
 *         description: File download
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Upload not found
 */
router.get(
  "/uploads/:uploadId/download",
  verifyToken,
  downloadYudisiumRegistrationFile,
);

module.exports = router;
