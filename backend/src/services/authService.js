import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ROLES, EMAIL_DOMAINS } from "../constants/index.js";

export const registerUser = async ({ name, email, password, phone }) => {
  // Cek duplikasi email
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const error = new Error("Email sudah digunakan");
    error.statusCode = 400;
    throw error;
  }

  // Cek duplikasi phone (jika diisi)
  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      const error = new Error("Nomor telepon sudah digunakan");
      error.statusCode = 400;
      throw error;
    }
  }

  // Hash password & simpan
  const hashedPassword = await bcrypt.hash(password, 10);
  const domain = email.toLowerCase().split("@")[1];

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: domain === EMAIL_DOMAINS.TELKOM ? ROLES.DOSEN : ROLES.MAHASISWA,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    omit: { password: false, deletedAt: false },
  });

  if (!user || user.deletedAt) {
    const error = new Error("Email atau kata sandi salah");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Email atau kata sandi salah");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return { user, token };
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true, deletedAt: false },
  });
  if (!user || user.deletedAt) {
    const error = new Error("Pengguna tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }
  return user;
};
