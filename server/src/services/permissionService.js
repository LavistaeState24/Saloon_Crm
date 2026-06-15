import { actionKeys, buildDefaultPermissions, buildRoleDefinition, moduleKeys } from "../constants/rbac.js";
import { Role } from "../models/Role.js";
import { ApiError } from "../utils/ApiError.js";

const clonePermissions = (permissions) => JSON.parse(JSON.stringify(permissions));

const normalizePermissionEntry = (entry = {}, fallback = {}) => ({
  view: Boolean(entry.view ?? fallback.view),
  create: Boolean(entry.create ?? fallback.create),
  update: Boolean(entry.update ?? fallback.update),
  delete: Boolean(entry.delete ?? fallback.delete),
  scope: entry.scope || fallback.scope || "none",
});

export const normalizePermissions = (permissions = {}, fallbackPermissions = {}) =>
  Object.fromEntries(
    moduleKeys.map((moduleKey) => [
      moduleKey,
      normalizePermissionEntry(permissions[moduleKey], fallbackPermissions[moduleKey]),
    ])
  );

export const sanitizePermissionsForResponse = (permissions = {}) =>
  Object.fromEntries(
    moduleKeys.map((moduleKey) => [
      moduleKey,
      {
        view: Boolean(permissions[moduleKey]?.view),
        create: Boolean(permissions[moduleKey]?.create),
        update: Boolean(permissions[moduleKey]?.update),
        delete: Boolean(permissions[moduleKey]?.delete),
        scope: permissions[moduleKey]?.scope || "none",
      },
    ])
  );

export const ensureSystemRoles = async () => {
  for (const roleKey of ["super-admin", "admin", "manager", "sales"]) {
    const existingRole = await Role.findOne({ key: roleKey });
    const definition = buildRoleDefinition(roleKey);

    if (!existingRole) {
      await Role.create(definition);
      continue;
    }

    existingRole.name = definition.name;
    existingRole.isSystem = true;
    existingRole.permissions = normalizePermissions(existingRole.permissions, definition.permissions);

    if (roleKey === "super-admin") {
      existingRole.permissions = definition.permissions;
    }

    await existingRole.save();
  }
};

export const getRoleByKey = async (roleKey) => {
  const role = await Role.findOne({ key: roleKey });

  if (!role) {
    throw new ApiError(403, "Role configuration not found");
  }

  return role;
};

export const listRolePermissions = async () => {
  const roles = await Role.find().sort({ createdAt: 1 }).lean();

  return roles.map((role) => ({
    key: role.key,
    name: role.name,
    isSystem: role.isSystem,
    permissions: sanitizePermissionsForResponse(role.permissions),
  }));
};

export const getRolePermissions = async (roleKey) => {
  const role = await getRoleByKey(roleKey);

  return {
    key: role.key,
    name: role.name,
    isSystem: role.isSystem,
    permissions: sanitizePermissionsForResponse(role.permissions),
  };
};

export const getResolvedPermissionsForRole = async (roleKey) => {
  const role = await getRoleByKey(roleKey);
  return sanitizePermissionsForResponse(role.permissions);
};

export const hasPermission = (permissions, moduleKey, actionKey) =>
  Boolean(permissions?.[moduleKey]?.[actionKey]);

export const getPermissionScope = (permissions, moduleKey) =>
  permissions?.[moduleKey]?.scope || "none";

export const validatePermissionPayloadShape = (payload = {}) => {
  for (const [moduleKey, moduleValue] of Object.entries(payload)) {
    if (!moduleKeys.includes(moduleKey)) {
      throw new ApiError(400, `Unknown module: ${moduleKey}`);
    }

    for (const [actionKey, actionValue] of Object.entries(moduleValue || {})) {
      if (!actionKeys.includes(actionKey) && actionKey !== "scope") {
        throw new ApiError(400, `Unknown action: ${actionKey}`);
      }

      if (actionKey !== "scope" && typeof actionValue !== "boolean") {
        throw new ApiError(400, `${moduleKey}.${actionKey} must be a boolean`);
      }
    }
  }
};

export const mergePermissions = (roleKey, currentPermissions, updates) => {
  const defaults = buildDefaultPermissions(roleKey);
  const nextPermissions = normalizePermissions(clonePermissions(currentPermissions), defaults);

  validatePermissionPayloadShape(updates);

  for (const moduleKey of moduleKeys) {
    if (!updates[moduleKey]) {
      continue;
    }

    nextPermissions[moduleKey] = {
      ...nextPermissions[moduleKey],
      ...updates[moduleKey],
      scope: nextPermissions[moduleKey].scope,
    };

    if (!nextPermissions[moduleKey].view) {
      nextPermissions[moduleKey].create = false;
      nextPermissions[moduleKey].update = false;
      nextPermissions[moduleKey].delete = false;
    }
  }

  if (roleKey === "super-admin") {
    return defaults;
  }

  return nextPermissions;
};

export const updateRolePermissions = async (roleKey, updates) => {
  const role = await getRoleByKey(roleKey);

  role.permissions = mergePermissions(role.key, role.permissions, updates);
  await role.save();

  return {
    key: role.key,
    name: role.name,
    isSystem: role.isSystem,
    permissions: sanitizePermissionsForResponse(role.permissions),
  };
};

