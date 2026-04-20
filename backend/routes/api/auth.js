const express = require("express");

const router = express.Router();

const {
  register,
  login,
  getUser,
} = require("../../controllers/authController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

const {
  registerValidator,
  loginValidator,
} = require("../../validators/authValidator");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, confirmPassword]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               phone:
 *                 type: string
 *                 nullable: true
 *               role:
 *                 type: string
 *                 enum: [STUDENT, LECTURER, ACADEMIC_STAFF]
 *     responses:
 *       201:
 *         description: Registration successful
 *       422:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.post("/register", registerValidator, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", loginValidator, validate, login);

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/user", verifyToken, getUser);

module.exports = router;
