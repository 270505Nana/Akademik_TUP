const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

const STUDENT_EMAIL_DOMAIN = "student.telkomuniversity.ac.id";
const TELKOM_EMAIL_DOMAIN = "telkomuniversity.ac.id";

const getEmailDomain = (email) => email.toLowerCase().split("@")[1];

// Register
const register = asyncHandler(async (req, res) => {
  const { username, email, password, phone, role } = req.body;
  const emailDomain = getEmailDomain(email);
  const normalizedRole = typeof role === "string" ? role.trim() : role;

  if (
    emailDomain !== STUDENT_EMAIL_DOMAIN &&
    emailDomain !== TELKOM_EMAIL_DOMAIN
  ) {
    res.status(400);
    throw new Error(
      "Email domain must be student.telkomuniversity.ac.id or telkomuniversity.ac.id",
    );
  }

  if (emailDomain === STUDENT_EMAIL_DOMAIN) {
    if (normalizedRole && normalizedRole !== "STUDENT") {
      res.status(400);
      throw new Error("Role must be STUDENT for student email domain");
    }
  }

  if (emailDomain === TELKOM_EMAIL_DOMAIN) {
    if (!normalizedRole) {
      res.status(400);
      throw new Error(
        "Role is required for telkomuniversity.ac.id email domain",
      );
    }

    if (!["LECTURER", "ACADEMIC_STAFF"].includes(normalizedRole)) {
      res.status(400);
      throw new Error(
        "Role must be LECTURER or ACADEMIC_STAFF for telkomuniversity.ac.id email domain",
      );
    }
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    res.status(400);
    throw new Error("Email already used");
  }

  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      res.status(400);
      throw new Error("Phone already used");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const data = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      phone,
      role: normalizedRole ?? "STUDENT",
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
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
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
    throw new Error("User not found");
  }

  res.json({ data });
});

module.exports = { register, login, user };
