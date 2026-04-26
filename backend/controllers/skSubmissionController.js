const prisma = require("../prisma/client");

// Create Permohonan SK
const createSkSubmission = async (req, res) => {
  try {
    const {
      proposalTitleId,
      proposalTitleEn,
      attachmentUrl,
      hasUploadedFinalProposal,
      finalProposalDelayReason,
      hasTakenLanguageTest,
      languageTestDelayReason,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    // Cek apakah ada data mahasiswa
    const student = await prisma.student.findFirst({
      where: { id: studentId },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Cek apakah ada data dospem 1
    const dosenPembimbing1 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1)
      return res.status(404).json({ message: "Lecturer 1 not found" });

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2)
      return res.status(404).json({ message: "Lecturer 2 not found" });

    const data = await prisma.skSubmission.create({
      data: {
        proposalTitleId,
        proposalTitleEn,
        attachmentUrl: "-", // sementara
        hasUploadedFinalProposal,
        finalProposalDelayReason,
        hasTakenLanguageTest,
        languageTestDelayReason,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
      },
    });

    res.json({
      message: "SK request submitted successful",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Permohonan SK
const updateSkSubmission = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const skSubmission = await prisma.skSubmission.findFirst({ where: { id } });
    if (!skSubmission)
      return res.status(404).json({ message: "SK submission not found" });

    const {
      proposalTitleId,
      proposalTitleEn,
      attachmentUrl,
      hasUploadedFinalProposal,
      finalProposalDelayReason,
      hasTakenLanguageTest,
      languageTestDelayReason,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    // Cek apakah ada data mahasiswa
    const student = await prisma.student.findFirst({
      where: { id: studentId },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Cek apakah ada data dospem 1
    const dosenPembimbing1 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1)
      return res.status(404).json({ message: "Lecturer 1 not found" });

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2)
      return res.status(404).json({ message: "Lecturer 2 not found" });

    const data = await prisma.skSubmission.update({
      where: { id },
      data: {
        proposalTitleId,
        proposalTitleEn,
        attachmentUrl: "-", // sementara
        hasUploadedFinalProposal,
        finalProposalDelayReason,
        hasTakenLanguageTest,
        languageTestDelayReason,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
      },
    });

    res.json({
      message: "SK request updated successful",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { createSkSubmission, updateSkSubmission };
