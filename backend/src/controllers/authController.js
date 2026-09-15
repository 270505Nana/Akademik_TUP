import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { ROLES } from "../constants/index.js";
import { mapUser } from "../mappers/index.js";

// Register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existingEmail = await prisma.user.findUnique({ where: { email } });

  if (existingEmail) {
    res.status(400);
    throw new Error("Email sudah digunakan");
  }

  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      res.status(400);
      throw new Error("Nomor telepon sudah digunakan");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const data = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: role || ROLES.MAHASISWA,
    },
  });

  const token = jwt.sign(
    { id: data.id, email: data.email, role: data.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.status(201).json({
    message: "Registration successful",
    token,
    data: mapUser(data),
  });
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    omit: { password: false, deletedAt: false },
  });

  if (!user || user.deletedAt) {
    res.status(401);
    throw new Error("Email atau kata sandi salah");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Email atau kata sandi salah");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.json({
    message: "Login successful",
    token,
    data: mapUser(user),
  });
});

// Get User Data
const user = asyncHandler(async (req, res) => {
  const data = await prisma.user.findUnique({
    where: { id: req.user.id },
    omit: { password: true, deletedAt: false },
  });

  if (!data || data.deletedAt) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }

  res.json({ data: mapUser(data) });
});

export { register, login, user };
