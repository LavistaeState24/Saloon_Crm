import { Router } from "express";

import {
  createSiteVisitHandler,
  getSiteVisitHandler,
  listSiteVisitsHandler,
  updateSiteVisitHandler,
} from "../controllers/siteVisitController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, authorize("siteVisits", "view"), listSiteVisitsHandler);
router.post("/", protect, authorize("siteVisits", "create"), createSiteVisitHandler);
router.get("/:id", protect, authorize("siteVisits", "view"), getSiteVisitHandler);
router.put("/:id", protect, authorize("siteVisits", "update"), updateSiteVisitHandler);

export default router;
