import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';

const STUDENT_EMAIL_DOMAIN = "student.telkomuniversity.ac.id";
const TELKOM_EMAIL_DOMAIN = "telkomuniversity.ac.id";

const getEmailDomain = (email) => email.toLowerCase().split("@")[1];

// Register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const emailDomain = getEmailDomain(email);
  const normalizedRole = typeof role === "string" ? role.trim() : role;

  if (
    emailDomain !== STUDENT_EMAIL_DOMAIN &&
    emailDomain !== TELKOM_EMAIL_DOMAIN
  ) {
    res.status(400);
    throw new Error(
      "Domain email harus student.telkomuniversity.ac.id atau telkomuniversity.ac.id",
    );
  }

  if (emailDomain === STUDENT_EMAIL_DOMAIN) {
    if (normalizedRole && normalizedRole !== "MAHASISWA") {
      res.status(400);
      throw new Error("Role harus MAHASISWA untuk domain email mahasiswa");
    }
  }

  if (emailDomain === TELKOM_EMAIL_DOMAIN) {
    if (!normalizedRole) {
      res.status(400);
      throw new Error(
        "Role wajib diisi untuk domain email telkomuniversity.ac.id",
      );
    }

    if (!["DOSEN", "ADMIN"].includes(normalizedRole)) {
      res.status(400);
      throw new Error(
        "Role harus DOSEN atau ADMIN untuk domain email telkomuniversity.ac.id",
      );
    }
  }

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
      phone,
      role: normalizedRole ?? "MAHASISWA",
    },
    omit: { password: true },
  });

  const token = jwt.sign(
    { id: data.id, email: data.email, role: data.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.status(201).json({
    message: "Registration successful",
    token,
    data,
  });
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    // omit: { password: true },
  });
  if (!user) {
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

  const { password: _, ...data } = user;

  res.json({
    message: "Login successful",
    token,
    data,
  });
});

// Get User Data
const user = asyncHandler(async (req, res) => {
  const data = await prisma.user.findUnique({
    where: { id: req.user.id },
    omit: { password: true },
  });

  if (!data) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }

  res.json({ data });
});

export { register, login, user };
