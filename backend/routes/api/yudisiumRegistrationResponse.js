const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listYudisiumRegistrationResponses,
  getYudisiumRegistrationResponseById,
  getYudisiumRegistrationResponseByYudisiumRegistrationId,
  createYudisiumRegistrationResponse,
  updateYudisiumRegistrationResponse,
  deleteYudisiumRegistrationResponse,
} = require("../../controllers/yudisiumRegistrationResponseController");
const {
  createYudisiumRegistrationResponseValidator,
  updateYudisiumRegistrationResponseValidator,
} = require("../../validators/yudisiumRegistrationResponseValidator");
const { isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Yudisium Registration Response
 *   description: Yudisium registration response endpoints
 */

/**
 * @swagger
 * /api/yudisium-registration-responses:
 *   get:
 *     summary: Get all yudisium registration responses
 *     tags: [Yudisium Registration Response]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yudisium registration responses retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listYudisiumRegistrationResponses);

/**
 * @swagger
 * /api/yudisium-registration-responses/{id}:
 *   get:
 *     summary: Get yudisium registration response by ID
 *     tags: [Yudisium Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Yudisium registration response retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response not found
 */
router.get("/:id", verifyToken, getYudisiumRegistrationResponseById);

/**
 * @swagger
 * /api/yudisium-registration-responses/registration/{yudisiumRegistrationId}:
 *   get:
 *     summary: Get yudisium registration response by yudisium registration ID
 *     tags: [Yudisium Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: yudisiumRegistrationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yudisium Registration ID
 *     responses:
 *       200:
 *         description: Yudisium registration response retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response not found
 */
router.get(
  "/registration/:yudisiumRegistrationId",
  verifyToken,
  getYudisiumRegistrationResponseByYudisiumRegistrationId,
);

/**
 * @swagger
 * /api/yudisium-registration-responses:
 *   post:
 *     summary: Create new yudisium registration response
 *     tags: [Yudisium Registration Response]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - yudisiumRegistrationId
 *               - academicStaffId
 *             properties:
 *               yudisiumRegistrationId:
 *                 type: integer
 *                 example: 1
 *               academicStaffId:
 *                 type: integer
 *                 example: 1
 *               message:
 *                 type: string
 *                 nullable: true
 *                 example: "Persetujuan dengan revisi minor"
 *               isEdit:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-06-07T23:59:59Z"
 *     responses:
 *       201:
 *         description: Yudisium registration response created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration or academic staff not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAcademicStaff,
  createYudisiumRegistrationResponseValidator,
  validate,
  createYudisiumRegistrationResponse,
);

/**
 * @swagger
 * /api/yudisium-registration-responses/{id}:
 *   put:
 *     summary: Update yudisium registration response
 *     tags: [Yudisium Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 nullable: true
 *               isEdit:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               academicStaffId:
 *                 type: integer
 *               yudisiumRegistrationId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Yudisium registration response updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response or reference data not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  verifyToken,
  isAcademicStaff,
  updateYudisiumRegistrationResponseValidator,
  validate,
  updateYudisiumRegistrationResponse,
);

/**
 * @swagger
 * /api/yudisium-registration-responses/{id}:
 *   delete:
 *     summary: Delete yudisium registration response
 *     tags: [Yudisium Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Yudisium registration response deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  verifyToken,
  isAcademicStaff,
  deleteYudisiumRegistrationResponse,
);

module.exports = router;
