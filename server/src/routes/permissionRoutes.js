import { Router } from "express";

import {
  getPermissionsByRoleHandler,
  listPermissionsHandler,
  updatePermissionsByRoleHandler,
} from "../controllers/permissionController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validatePermissionUpdateInput } from "../validators/permissionValidator.js";

const router = Router();

router.get("/", protect, authorize("settings", "view"), listPermissionsHandler);
router.get("/:role", protect, authorize("settings", "view"), getPermissionsByRoleHandler);
router.put("/:role", protect, authorize("settings", "update"), validateBody(validatePermissionUpdateInput), updatePermissionsByRoleHandler);

export default router;
