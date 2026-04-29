const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));

router.use("/academic-staff", require("./academicStaff"));

router.use("/research-groups", require("./researchGroup"));
router.use("/lecturers", require("./lecturer"));

router.use("/faculties", require("./faculty"));
router.use("/study-programs", require("./studyProgram"));
router.use("/students", require("./student"));

router.use("/skta-requests", require("./sktaRequest"));
router.use("/skta-responses", require("./sktaResponse"));
router.use("/templates", require("./templateUpload"));

module.exports = router;
