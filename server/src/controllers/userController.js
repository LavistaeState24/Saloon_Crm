import { createManagedUser, listAssignableUsers, listManagedUsers } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsersHandler = asyncHandler(async (req, res) => {
  const users = await listManagedUsers(req.user);
  res.json({ success: true, data: users });
});

export const listAssignableUsersHandler = asyncHandler(async (req, res) => {
  const users = await listAssignableUsers(req.user);
  res.json({ success: true, data: users });
});

export const createUserHandler = asyncHandler(async (req, res) => {
  const user = await createManagedUser(req.body, req.user);
  res.status(201).json({ success: true, data: user });
});
