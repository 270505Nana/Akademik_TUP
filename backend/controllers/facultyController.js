const prisma = require("../prisma/client");

// Daftar Semua Fakultas
const listFaculties = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany({
      where: { deletedAt: null },
    });

    res.json({
      data: faculties,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Buat Fakultas Baru
const createFaculty = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Faculty name is required" });
    }

    const faculty = await prisma.faculty.create({
      data: {
        name,
        isPublish: true,
      },
    });

    res.status(201).json({
      message: "Faculty created successfully",
      data: faculty,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Cari Fakultas By ID
const findFacultyById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const faculty = await prisma.faculty.findUnique({
      where: { id },
    });

    if (!faculty || faculty.deletedAt !== null) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ data: faculty });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Fakultas
const updateFaculty = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name } = req.body;

    const faculty = await prisma.faculty.findUnique({ where: { id } });

    if (!faculty || faculty.deletedAt !== null) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const updatedFaculty = await prisma.faculty.update({
      where: { id },
      data: {
        name: name || faculty.name,
      },
    });

    res.json({
      message: "Faculty updated successfully",
      data: updatedFaculty,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Soft Delete Fakultas
const deleteFaculty = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const faculty = await prisma.faculty.findUnique({ where: { id } });

    if (!faculty || faculty.deletedAt !== null) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const deletedFaculty = await prisma.faculty.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({
      message: "Faculty deleted successfully",
      data: deletedFaculty,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Toggle Publish Status (Hide/Show)
const toggleFacultyPublish = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const faculty = await prisma.faculty.findUnique({ where: { id } });

    if (!faculty || faculty.deletedAt !== null) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const updatedFaculty = await prisma.faculty.update({
      where: { id },
      data: { isPublish: !faculty.isPublish },
    });

    res.json({
      message: `Faculty ${
        updatedFaculty.isPublish ? "published" : "hidden"
      } successfully`,
      data: updatedFaculty,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listFaculties,
  createFaculty,
  findFacultyById,
  updateFaculty,
  deleteFaculty,
  toggleFacultyPublish,
};
