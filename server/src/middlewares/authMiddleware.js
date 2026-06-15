import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { getPermissionScope, getResolvedPermissionsForRole, hasPermission } from "../services/permissionService.js";
import { ApiError } from "../utils/ApiError.js";

export const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }

    user.permissions = await getResolvedPermissionsForRole(user.role);
    req.user = user;

    User.findByIdAndUpdate(user._id, {
      lastSeenAt: new Date(),
    }).catch(() => { });

    next();
  } catch (_error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};

export const authorize =
  (moduleKey, actionKey) =>
    (req, _res, next) => {
      if (!req.user) {
        return next(new ApiError(401, "Authentication required"));
      }

      const hasDirectPermission = hasPermission(req.user.permissions, moduleKey, actionKey);
      const isSalesAssignedClientUpdate =
        moduleKey === "clients" &&
        actionKey === "update" &&
        req.user.role === "sales" &&
        getPermissionScope(req.user.permissions, "clients") === "assigned";

      if (!hasDirectPermission && !isSalesAssignedClientUpdate) {
        return next(new ApiError(403, "You do not have access to this resource"));
      }

      next();
    };
