import { Router } from "express";

import {
  createDealHandler,
  getDealHandler,
  getRevenueSummaryHandler,
  getStaffClosingReportsHandler,
  listBookingDealsHandler,
  listClosedDealsHandler,
  listDealsHandler,
  listNegotiationDealsHandler,
  updateDealHandler,
} from "../controllers/dealController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, authorize("deals", "view"), listDealsHandler);
router.get("/negotiation", protect, authorize("deals", "view"), listNegotiationDealsHandler);
router.get("/bookings", protect, authorize("deals", "view"), listBookingDealsHandler);
router.get("/closed", protect, authorize("deals", "view"), listClosedDealsHandler);
router.get("/summary", protect, authorize("dealReports", "view"), getRevenueSummaryHandler);
router.get("/staff-reports", protect, authorize("dealReports", "view"), getStaffClosingReportsHandler);
router.post("/", protect, authorize("deals", "create"), createDealHandler);
router.get("/:id", protect, authorize("deals", "view"), getDealHandler);
router.put("/:id", protect, authorize("deals", "update"), updateDealHandler);

export default router;
