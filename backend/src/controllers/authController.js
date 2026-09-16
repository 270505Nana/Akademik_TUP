import asyncHandler from "express-async-handler";
import * as authService from "../services/authService.js";
import { mapUser } from "../mappers/index.js";

// Register
export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({
    message: "Registration successful",
    token,
    data: mapUser(user),
  });
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  res.json({
    message: "Login successful",
    token,
    data: mapUser(user),
  });
});

// Get User Data
export const user = asyncHandler(async (req, res) => {
  const currentUser = await authService.getUserById(req.user.id);
  res.json({ data: mapUser(currentUser) });
});
