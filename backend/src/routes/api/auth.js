import express from "express";
import { register, login, user } from "../../controllers/authController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.js";
import { registerSchema, loginSchema } from "../../schemas/index.js";

const router = express.Router();

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
 *             required: [email, password, confirmPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 description: Must use student.telkomuniversity.ac.id or telkomuniversity.ac.id email domain. Username will be derived automatically from the email prefix.
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               phone:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Registration successful
 *       422:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.post("/register", authRateLimiter, validate(registerSchema), register);

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
router.post("/login", authRateLimiter, validate(loginSchema), login);

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
router.get("/user", verifyToken, user);

export default router;
