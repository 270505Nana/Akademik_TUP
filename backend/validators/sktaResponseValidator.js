const { body } = require("express-validator");

const sktaResponseBodyValidator = [
	body("hasUploadedFinalProposal")
		.notEmpty()
		.withMessage("hasUploadedFinalProposal is required")
		.bail()
		.isBoolean()
		.withMessage("hasUploadedFinalProposal must be a boolean")
		.toBoolean(),
	body("hasTakenLanguageTest")
		.notEmpty()
		.withMessage("hasTakenLanguageTest is required")
		.bail()
		.isBoolean()
		.withMessage("hasTakenLanguageTest must be a boolean")
		.toBoolean(),
	body("message").optional({ nullable: true }).isString().withMessage("message must be a string"),
	body("expDate")
		.optional({ nullable: true })
		.isISO8601()
		.withMessage("expDate must be a valid date")
		.toDate(),
	body("academicStaffId")
		.notEmpty()
		.withMessage("academicStaffId is required")
		.bail()
		.isInt()
		.withMessage("academicStaffId must be an integer")
		.toInt(),
	body("sktaRequestId")
		.notEmpty()
		.withMessage("sktaRequestId is required")
		.bail()
		.isInt()
		.withMessage("sktaRequestId must be an integer")
		.toInt(),
	body("sktaFile").custom((value, { req }) => {
		if (!req.file) {
			return true;
		}

		const allowedMimeTypes = ["application/pdf"];

		if (!allowedMimeTypes.includes(req.file.mimetype)) {
			throw new Error("invalid file type");
		}

		return true;
	}),
];

const createSktaResponsetValidator = [...sktaResponseBodyValidator];
const updateSktaResponsetValidator = [...sktaResponseBodyValidator];

module.exports = { createSktaResponsetValidator, updateSktaResponsetValidator };
