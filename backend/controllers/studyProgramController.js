const prisma = require("../prisma/client");

// Daftar Semua Program Studi
const listStudyPrograms = async (req, res) => {
  try {
    const studyPrograms = await prisma.studyProgram.findMany({
      where: { deletedAt: null },
      include: { faculty: true },
    });

    res.json({
      data: studyPrograms,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Buat Program Studi Baru
const createStudyProgram = async (req, res) => {
  try {
    const { name, facultyId } = req.body;

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty || faculty.deletedAt !== null) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const studyProgram = await prisma.studyProgram.create({
      data: {
        name,
        facultyId,
        isPublish: true,
      },
      include: { faculty: true },
    });

    res.status(201).json({
      message: "Study program created successfully",
      data: studyProgram,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Cari Program Studi By ID
const findStudyProgramById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id },
      include: { faculty: true },
    });

    if (!studyProgram || studyProgram.deletedAt !== null) {
      return res.status(404).json({ message: "Study program not found" });
    }

    res.json({ data: studyProgram });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Program Studi
const updateStudyProgram = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, facultyId } = req.body;

    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id },
    });

    if (!studyProgram || studyProgram.deletedAt !== null) {
      return res.status(404).json({ message: "Study program not found" });
    }

    // If facultyId is provided, check if it exists
    if (facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId },
      });

      if (!faculty || faculty.deletedAt !== null) {
        return res.status(404).json({ message: "Faculty not found" });
      }
    }

    const updatedStudyProgram = await prisma.studyProgram.update({
      where: { id },
      data: {
        name: name || studyProgram.name,
        facultyId: facultyId || studyProgram.facultyId,
      },
      include: { faculty: true },
    });

    res.json({
      message: "Study program updated successfully",
      data: updatedStudyProgram,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Soft Delete Program Studi
const deleteStudyProgram = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id },
    });

    if (!studyProgram || studyProgram.deletedAt !== null) {
      return res.status(404).json({ message: "Study program not found" });
    }

    const deletedStudyProgram = await prisma.studyProgram.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { faculty: true },
    });

    res.json({
      message: "Study program deleted successfully",
      data: deletedStudyProgram,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Toggle Publish Status (Hide/Show)
const toggleStudyProgramPublish = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const studyProgram = await prisma.studyProgram.findUnique({
      where: { id },
    });

    if (!studyProgram || studyProgram.deletedAt !== null) {
      return res.status(404).json({ message: "Study program not found" });
    }

    const updatedStudyProgram = await prisma.studyProgram.update({
      where: { id },
      data: { isPublish: !studyProgram.isPublish },
      include: { faculty: true },
    });

    res.json({
      message: `Study program ${
        updatedStudyProgram.isPublish ? "published" : "hidden"
      } successfully`,
      data: updatedStudyProgram,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listStudyPrograms,
  createStudyProgram,
  findStudyProgramById,
  updateStudyProgram,
  deleteStudyProgram,
  toggleStudyProgramPublish,
};
