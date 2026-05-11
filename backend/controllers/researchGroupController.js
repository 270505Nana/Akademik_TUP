const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// Daftar Semua Kelompok Keahlian
const listResearchGroups = asyncHandler(async (req, res) => {
  const researchGroups = await prisma.researchGroup.findMany();

  res.json({
    data: researchGroups,
  });
});

module.exports = {
  listResearchGroups,
};
