import mongoose from "mongoose";

import { moduleKeys, scopeKeys } from "../constants/rbac.js";

const permissionSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    scope: { type: String, enum: scopeKeys, default: "none" },
  },
  { _id: false }
);

const permissionsShape = Object.fromEntries(
  moduleKeys.map((moduleKey) => [moduleKey, { type: permissionSchema, default: () => ({}) }])
);

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    isSystem: { type: Boolean, default: false },
    permissions: {
      type: new mongoose.Schema(permissionsShape, { _id: false }),
      required: true,
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);
