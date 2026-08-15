import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";

// Daftar Semua Kelompok Keahlian
const listResearchGroups = asyncHandler(async (req, res) => {
  const researchGroups = await prisma.researchGroup.findMany();

  res.json({
    data: researchGroups,
  });
});

export { listResearchGroups, };
