import { throwIfValidationFailed } from "./common.js";
import { actionKeys, moduleKeys, scopeKeys } from "../constants/rbac.js";

export const validatePermissionUpdateInput = (payload) => {
  const errors = {};
  const permissions = payload.permissions;

  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    errors.permissions = "Permissions payload is required";
    throwIfValidationFailed(errors);
  }

  for (const [moduleKey, moduleValue] of Object.entries(permissions)) {
    if (!moduleKeys.includes(moduleKey)) {
      errors[moduleKey] = "Module is invalid";
      continue;
    }

    if (!moduleValue || typeof moduleValue !== "object" || Array.isArray(moduleValue)) {
      errors[moduleKey] = "Module permissions must be an object";
      continue;
    }

    for (const [actionKey, actionValue] of Object.entries(moduleValue)) {
      if (actionKey === "scope") {
        if (!scopeKeys.includes(actionValue)) {
          errors[`${moduleKey}.scope`] = "Scope is invalid";
        }
        continue;
      }

      if (!actionKeys.includes(actionKey)) {
        errors[`${moduleKey}.${actionKey}`] = "Action is invalid";
        continue;
      }

      if (typeof actionValue !== "boolean") {
        errors[`${moduleKey}.${actionKey}`] = "Permission must be true or false";
      }
    }
  }

  throwIfValidationFailed(errors);
  return { permissions };
};