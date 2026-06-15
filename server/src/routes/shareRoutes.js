import { Router } from "express";

import {
  createShareLinkHandler,
  getShareLinkPreviewHandler,
} from "../controllers/shareController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateShareLinkInput } from "../validators/shareValidator.js";

const router = Router();

router.post("/", protect, validateBody(validateShareLinkInput), createShareLinkHandler);
router.get("/public/:token", getShareLinkPreviewHandler);

export default router;
