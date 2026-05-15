const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// Daftar Semua Fakultas
const listFaculties = asyncHandler(async (req, res) => {
  const faculties = await prisma.faculty.findMany({
    where: { deletedAt: null },
  });

  res.json({
    data: faculties,
  });
});

// Buat Fakultas Baru
const createFaculty = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Faculty name is required");
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
});

// Cari Fakultas By ID
const findFacultyById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const faculty = await prisma.faculty.findUnique({
    where: { id },
  });

  if (!faculty || faculty.deletedAt != null) {
    res.status(404);
    throw new Error("Faculty not found");
  }

  res.json({ data: faculty });
});

// Update Fakultas
const updateFaculty = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;

  const faculty = await prisma.faculty.findUnique({ where: { id } });

  if (!faculty || faculty.deletedAt != null) {
    res.status(404);
    throw new Error("Faculty not found");
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
});

// Soft Delete Fakultas
const deleteFaculty = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const faculty = await prisma.faculty.findUnique({ where: { id } });

  if (!faculty || faculty.deletedAt != null) {
    res.status(404);
    throw new Error("Faculty not found");
  }

  const deletedFaculty = await prisma.faculty.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Faculty deleted successfully",
    data: deletedFaculty,
  });
});

// Toggle Publish Status (Hide/Show)
const toggleFacultyPublish = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const faculty = await prisma.faculty.findUnique({ where: { id } });

  if (!faculty || faculty.deletedAt != null) {
    res.status(404);
    throw new Error("Faculty not found");
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
});

module.exports = {
  listFaculties,
  createFaculty,
  findFacultyById,
  updateFaculty,
  deleteFaculty,
  toggleFacultyPublish,
};
