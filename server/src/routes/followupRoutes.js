import { Router } from "express";

import {
  cancelFollowupHandler,
  completeFollowupHandler,
  createFollowupHandler,
  getFollowupCountsHandler,
  listFollowupsHandler,
  updateFollowupHandler,
  getPendingWorkSummary,
} from "../controllers/followupController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, authorize("followups", "view"), listFollowupsHandler);
router.get("/counts", protect, authorize("followups", "view"), getFollowupCountsHandler);
router.post("/", protect, authorize("followups", "create"), createFollowupHandler);
router.put("/:id", protect, authorize("followups", "update"), updateFollowupHandler);
router.patch("/:id/complete", protect, authorize("followups", "update"), completeFollowupHandler);
router.patch("/:id/cancel", protect, authorize("followups", "update"), cancelFollowupHandler);
router.delete("/:id", protect, authorize("followups", "delete"), cancelFollowupHandler);
router.get(
  "/pending-work/summary",
  protect,
  authorize("followups", "view"),
  getPendingWorkSummary
);

export default router;
