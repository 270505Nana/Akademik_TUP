import express from "express";
import prisma from "../../config/prisma.js";

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health and database connectivity check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server and database are healthy and responding
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     responseTimeMs:
 *                       type: number
 *                       example: 4.2
 *       503:
 *         description: Server is degraded or database is disconnected
 */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbError = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "disconnected";
    dbError = err.message;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === "connected";

  const payload = {
    status: isHealthy ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      responseTimeMs,
      ...(dbError ? { error: dbError } : {}),
    },
    memory: {
      rssMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
    },
  };

  res.status(isHealthy ? 200 : 503).json(payload);
});

export default router;
