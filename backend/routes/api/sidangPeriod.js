const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const {
  listSidangPeriods,
} = require("../../controllers/sidangPeriodController");

/**
 * @swagger
 * tags:
 *  name: Sidang Period
 *  description: Sidang period endpoints
 */

/**
 * @swagger
 * /api/sidang-periods:
 *  get:
 *    summary: Get all sidang period
 *    tags: [Sidang Period]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Sidang period data retrived successfully
 *      401:
 *        description: Token not found
 *      403:
 *        description: Invalid token
 */
router.get("/", verifyToken, listSidangPeriods);

module.exports = router;
