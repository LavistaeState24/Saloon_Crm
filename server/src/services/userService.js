import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isActive: user.isActive,
  managerId: user.managerId?._id || user.managerId || null,
  managerName: user.managerId?.name || "",
  lastLoginAt: user.lastLoginAt || null,
  lastSeenAt: user.lastSeenAt || null,
  isOnline:
    user.lastSeenAt &&
    Date.now() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000,
});

export const listManagedUsers = async (currentUser) => {
  let filters = {};

  if (currentUser.role === "manager") {
    filters = {
      role: "sales",
      managerId: currentUser._id,
    };
  } else if (currentUser.role === "admin") {
    filters = {};
  } else if (currentUser.role === "super-admin") {
    filters = {};
  } else {
    filters = {
      _id: currentUser._id,
    };
  }

  const users = await User.find(filters)
    .select("-password")
    .populate("managerId", "name")
    .sort({ createdAt: -1 });

  return users.map(sanitizeUser);
};

export const listAssignableUsers = async (currentUser) => {
  if (currentUser.role === "super-admin" || currentUser.role === "admin") {
    const users = await User.find({ role: { $ne: "super-admin" }, isActive: true })
      .select("_id name role managerId")
      .sort({ name: 1 });

    return users.map((user) => ({
      id: user._id,
      name: user.name,
      role: user.role,
      managerId: user.managerId || null,
    }));
  }

  if (currentUser.role === "manager") {
    const users = await User.find({
      isActive: true,
      $or: [{ _id: currentUser._id }, { role: "sales", managerId: currentUser._id }],
    })
      .select("_id name role managerId")
      .sort({ role: 1, name: 1 });

    return users.map((user) => ({
      id: user._id,
      name: user.name,
      role: user.role,
      managerId: user.managerId || null,
    }));
  }

  return [
    {
      id: currentUser._id,
      name: currentUser.name,
      role: currentUser.role,
      managerId: currentUser.managerId || null,
    },
  ];
};

export const createManagedUser = async (payload, currentUser) => {
  if (currentUser.role !== "super-admin") {
    throw new ApiError(403, "Only Super Admin can create users");
  }

  if (payload.role === "super-admin") {
    throw new ApiError(403, "Public user creation cannot assign Super Admin");
  }

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  if (payload.managerId) {
    const manager = await User.findById(payload.managerId).select("_id role isActive");

    if (!manager || !manager.isActive) {
      throw new ApiError(400, "Selected manager was not found");
    }

    if (!["manager", "admin", "super-admin"].includes(manager.role)) {
      throw new ApiError(400, "Selected manager is invalid");
    }
  }

  if (payload.role !== "sales") {
    payload.managerId = null;
  }

  const user = await User.create(payload);
  const populatedUser = await User.findById(user._id).populate("managerId", "name");
  return sanitizeUser(populatedUser);
};
