import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";
import { getResolvedPermissionsForRole } from "./permissionService.js";

const sanitizeUser = async (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  lastSeenAt: user.lastSeenAt,
  permissions: await getResolvedPermissionsForRole(user.role),
});

export const registerUser = async (payload) => {
  const existingUser = await User.findOne({
    email: payload.email.toLowerCase(),
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    ...payload,
    role: "sales",
  });

  const token = signToken({ id: user._id, role: user.role });

  return {
    user: await sanitizeUser(user),
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  user.lastLoginAt = new Date();
  user.lastSeenAt = new Date();

  await user.save();

  const token = signToken({ id: user._id, role: user.role });

  return {
    user: await sanitizeUser(user),
    token,
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};

export const listUsers = async () =>
  User.find().select("-password").sort({ createdAt: -1 });