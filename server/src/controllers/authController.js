import { getCurrentUser, listUsers, loginUser, registerUser } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body);
  res.status(201).json({ success: true, data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  res.json({ success: true, data });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user._id);
  res.json({ success: true, data: user });
});

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await listUsers();
  res.json({ success: true, data: users });
});

