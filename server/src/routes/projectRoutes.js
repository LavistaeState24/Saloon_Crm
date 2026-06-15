import { Router } from "express";

import {
  createProjectHandler,
  dashboardSummaryHandler,
  deleteProjectHandler,
  getClientSafeProjectShareHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
} from "../controllers/projectController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateProjectInput } from "../validators/projectValidator.js";

const router = Router();

router.get("/", protect, authorize("projects", "view"), listProjectsHandler);
router.get("/dashboard-summary", protect, authorize("dashboard", "view"), dashboardSummaryHandler);
router.get("/:id/client-share", protect, authorize("projects", "view"), getClientSafeProjectShareHandler);
router.get("/:id", protect, authorize("projects", "view"), getProjectHandler);
router.post("/", protect, authorize("projects", "create"), validateBody(validateProjectInput), createProjectHandler);
router.put("/:id", protect, authorize("projects", "update"), validateBody(validateProjectInput), updateProjectHandler);
router.delete("/:id", protect, authorize("projects", "delete"), deleteProjectHandler);

export default router;
