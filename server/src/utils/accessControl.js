import { ApiError } from "./ApiError.js";

const toObjectIdString = (value) => String(value?._id || value || "");

export const getModuleScope = (user, moduleKey) => user?.permissions?.[moduleKey]?.scope || "none";

export const assertScopeAllowed = (scope) => {
  if (scope === "none") {
    throw new ApiError(403, "You do not have access to this resource");
  }
};

export const applyScopedFilter = (baseFilters, scope, user, fieldResolvers) => {
  if (scope === "all") {
    return baseFilters;
  }

  assertScopeAllowed(scope);

  if (scope === "assigned") {
    return {
      ...baseFilters,
      $or: fieldResolvers.assigned.map((field) => ({ [field]: user._id })),
    };
  }

  if (scope === "own") {
    return {
      ...baseFilters,
      $or: fieldResolvers.own.map((field) => ({ [field]: user._id })),
    };
  }

  throw new ApiError(403, "You do not have access to this resource");
};

export const assertDocumentScope = (document, scope, user, fieldResolvers) => {
  if (scope === "all") {
    return;
  }

  assertScopeAllowed(scope);

  const userId = toObjectIdString(user._id);
  const fields = scope === "assigned" ? fieldResolvers.assigned : fieldResolvers.own;
  const hasAccess = fields.some((field) => toObjectIdString(document[field]) === userId);

  if (!hasAccess) {
    throw new ApiError(403, "You do not have access to this resource");
  }
};
