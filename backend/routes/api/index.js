const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
// router.use('/students', require('./student'))
// router.use('/lecturers', require('./lecturer'))
router.use("/academic-staff", require("./academicStaff"));

module.exports = router;
