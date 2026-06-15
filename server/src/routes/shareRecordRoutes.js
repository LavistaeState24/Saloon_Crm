import { Router } from "express";

import {
  createShareRecordHandler,
  deleteShareRecordHandler,
  getShareRecordsByClientPhoneHandler,
  getShareRecordsByProjectIdHandler,
  listShareRecordsHandler,
  updateShareRecordNotesHandler,
  updateShareRecordStatusHandler,
} from "../controllers/shareRecordController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import {
  validateShareRecordCreateInput,
  validateShareRecordNotesInput,
  validateShareRecordStatusInput,
} from "../validators/shareRecordValidator.js";

const router = Router();

router.get("/", protect, authorize("shareRecords", "view"), listShareRecordsHandler);
router.get("/client/:clientPhone", protect, authorize("shareRecords", "view"), getShareRecordsByClientPhoneHandler);
router.get("/project/:projectId", protect, authorize("shareRecords", "view"), getShareRecordsByProjectIdHandler);
router.post("/", protect, authorize("shareRecords", "create"), validateBody(validateShareRecordCreateInput), createShareRecordHandler);
router.patch("/:id/status", protect, authorize("shareRecords", "update"), validateBody(validateShareRecordStatusInput), updateShareRecordStatusHandler);
router.patch("/:id/notes", protect, authorize("shareRecords", "update"), validateBody(validateShareRecordNotesInput), updateShareRecordNotesHandler);
router.delete("/:id", protect, authorize("shareRecords", "delete"), deleteShareRecordHandler);

export default router;
