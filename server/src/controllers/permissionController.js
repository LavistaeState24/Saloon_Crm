import {
  getRolePermissions,
  listRolePermissions,
  updateRolePermissions,
} from "../services/permissionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listPermissionsHandler = asyncHandler(async (_req, res) => {
  const roles = await listRolePermissions();
  res.json({ success: true, data: roles });
});

export const getPermissionsByRoleHandler = asyncHandler(async (req, res) => {
  const role = await getRolePermissions(req.params.role);
  res.json({ success: true, data: role });
});

export const updatePermissionsByRoleHandler = asyncHandler(async (req, res) => {
  const role = await updateRolePermissions(req.params.role, req.body.permissions);
  res.json({ success: true, data: role, message: "Role permissions updated successfully" });
});
