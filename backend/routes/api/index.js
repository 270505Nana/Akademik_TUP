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

router.use("/sidang-periods", require("./sidangPeriod"));
router.use(
  "/sidang-registration-periods",
  require("./sidangRegsitrationPeriod"),
);
router.use("/sidang-registrations", require("./sidangRegistration"));
router.use(
  "/sidang-registration-responses",
  require("./sidangRegistrationResponse"),
);

router.use("/yudisium-periods", require("./yudisiumPeriod"));
router.use(
  "/yudisium-registration-periods",
  require("./yudisiumRegsitrationPeriod"),
);
router.use("/yudisium-registrations", require("./yudisiumRegistration"));
router.use(
  "/yudisium-registration-responses",
  require("./yudisiumRegistrationResponse"),
);

module.exports = router;
