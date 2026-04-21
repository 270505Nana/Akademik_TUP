const express = require("express");

const router = express.Router();

const {
  createSkSubmission,
  updateSkSubmission,
} = require("../../controllers/skSubmissionController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

const {
  createSkSubmissionValidator,
  updateSkSubmissionValidator,
} = require("../../validators/skSubmissionValidator");

/**
 * @swagger
 * tags:
 *   name: SK Submission
 *   description: SK submission endpoints
 */

/**
 * @swagger
 * /api/sk-submissions:
 *   post:
 *     summary: Create SK submission
 *     tags: [SK Submission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposalTitleId
 *               - proposalTitleEn
 *               - hasUploadedFinalProposal
 *               - hasTakenLanguageTest
 *               - studentId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *             properties:
 *               proposalTitleId:
 *                 type: string
 *                 description: Proposal title in Indonesia
 *                 example: "Pengembangan Sistem Akademik"
 *               proposalTitleEn:
 *                 type: string
 *                 description: Proposal title in English
 *                 example: "Development of Academic System"
 *               attachmentUrl:
 *                 type: string
 *                 nullable: true
 *                 description: Attachment URL (sementara / testing purpose)
 *                 example: "https://example.com/file.pdf"
 *               hasUploadedFinalProposal:
 *                 type: boolean
 *                 description: Whether the final proposal has been uploaded
 *                 example: true
 *               finalProposalDelayReason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for final proposal delay (optional)
 *                 example: null
 *               hasTakenLanguageTest:
 *                 type: boolean
 *                 description: Whether the language test has been taken
 *                 example: false
 *               languageTestDelayReason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for language test delay (optional)
 *                 example: "Test schedule not available"
 *               studentId:
 *                 type: integer
 *                 description: Student ID
 *                 example: 1
 *               dosenPembimbing1Id:
 *                 type: integer
 *                 description: Dosen pembimbing 1 ID
 *                 example: 1
 *               dosenPembimbing2Id:
 *                 type: integer
 *                 description: Dosen pembimbing 2 ID
 *                 example: 3
 *     responses:
 *       200:
 *         description: SK submission created successfully
 *       404:
 *         description: Student or supervisor not found
 *       500:
 *         description: Internal server error
 */

router.post("/", createSkSubmissionValidator, validate, createSkSubmission);

/**
 * @swagger
 * /api/sk-submissions/{id}:
 *   put:
 *     summary: Update SK submission
 *     tags: [SK Submission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SK submission id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               finalProposalDelayReason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for final proposal delay (optional)
 *                 example: null
 *     responses:
 *       200:
 *         description: SK submission created successfully
 *       404:
 *         description: Student or supervisor not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateSkSubmissionValidator, validate, updateSkSubmission);

module.exports = router;
