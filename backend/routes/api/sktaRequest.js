const express = require("express");

const router = express.Router();

const {
  listSktaRequests,
  createSktaRequest,
} = require("../../controllers/sktaRequestController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");

const {
  createSktaRequestValidator,
} = require("../../validators/sktaRequestValidator");

/**
 * @swagger
 * tags:
 *   name: SKTA Request
 *   description: SKTA request endpoints
 */

router.get("/", verifyToken, listSktaRequests);
router.post(
  "/",
  verifyToken,
  upload("skta-evidence").single("evidence"),
  createSktaRequestValidator,
  validate,
  createSktaRequest,
);

module.exports = router;
