const prisma = require("../prisma/client");
const fs = require("fs");

// Membuat Permohonan SKTA
const listSktaRequests = async (req, res) => {
  try {
    const data = await prisma.sktaRequest.findMany();

    res.json({
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Membuat Permohonan SKTA
const createSktaRequest = async (req, res) => {
  try {
    const {
      proposalTitleId,
      proposalTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
      evidence,
    } = req.body;

    const file = req.file;

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
      return res.status(404).json({ message: "Dosen pembimbing 1 not found" });

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2)
      return res.status(404).json({ message: "Dosen pembimbing 2 not found" });

    const data = await prisma.sktaRequest.create({
      data: {
        proposalTitleId,
        proposalTitleEn,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,

        sktaRequestUploads: {
          create: {
            name: `Evidence_SKTA_${student?.nim}_${student?.name}`,
            filename: file.filename,
            path: file.path,
          },
        },
      },
    });

    res.json({
      message: "SKTA request submitted successful",
      data,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Permohonan SKTA
const updateSktaRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sktaRequest = await prisma.sktaRequest.findFirst({ where: { id } });
    if (!sktaRequest)
      return res.status(404).json({ message: "SKTA request not found" });

    const {
      proposalTitleId,
      proposalTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
      evidence,
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

    const data = await prisma.sktaRequest.update({
      where: { id },
      data: {
        proposalTitleId,
        proposalTitleEn,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
      },
    });

    res.json({
      message: "SKTA request updated successful",
      data,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { listSktaRequests, createSktaRequest, updateSktaRequest };
