import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import asyncHandler from 'express-async-handler';

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
export const getUserById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    res.status(404);
    throw new Error(`User not found with ID ${id}`);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create new user
// @route   POST /api/users
// @access  Public
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password');
  }

  // Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user,
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
export const updateUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email, password } = req.body;

  if (isNaN(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    res.status(404);
    throw new Error(`User not found with ID ${id}`);
  }

  // Build update object
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  
  if (email !== undefined && email !== existingUser.email) {
    // Check if new email is taken
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    });
    if (emailTaken) {
      res.status(400);
      throw new Error('Email is already in use');
    }
    updateData.email = email;
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
export const deleteUser = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    res.status(404);
    throw new Error(`User not found with ID ${id}`);
  }

  await prisma.user.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
