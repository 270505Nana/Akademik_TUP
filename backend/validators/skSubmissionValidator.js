const { body } = require("express-validator");

const createSkSubmissionValidator = [
  body("proposalTitleId").notEmpty().withMessage("proposalTitleId is required"),
  body("proposalTitleEn").notEmpty().withMessage("proposalTitleEn is required"),
  body("attachmentUrl").optional({ nullable: true }),
  body("hasUploadedFinalProposal")
    .notEmpty()
    .withMessage("hasUploadedFinalProposal is required"),
  body("finalProposalDelayReason").optional({ nullable: true }),
  body("hasTakenLanguageTest")
    .notEmpty()
    .withMessage("hasTakenLanguageTest is required"),
  body("languageTestDelayReason").optional({ nullable: true }),
  body("studentId").notEmpty().withMessage("studentId is required"),
  body("dosenPembimbing1Id")
    .notEmpty()
    .withMessage("dosenPembimbing1Id is required"),
  body("dosenPembimbing2Id")
    .notEmpty()
    .withMessage("dosenPembimbing2Id is required"),
];

const updateSkSubmissionValidator = [
  body("proposalTitleId").optional(),
  body("proposalTitleEn").optional(),
  body("attachmentUrl").optional({ nullable: true }),
  body("hasUploadedFinalProposal").optional(),
  body("finalProposalDelayReason").optional({ nullable: true }),
  body("hasTakenLanguageTest").optional(),
  body("languageTestDelayReason").optional({ nullable: true }),
  body("studentId").optional(),
  body("dosenPembimbing1Id").optional(),
  body("dosenPembimbing2Id").optional(),
];

module.exports = { createSkSubmissionValidator, updateSkSubmissionValidator };
