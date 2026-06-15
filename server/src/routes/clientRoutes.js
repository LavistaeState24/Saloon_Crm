import { Router } from "express";

import {
  createClientCallLogHandler,
  listClientCallLogsHandler,
} from "../controllers/callLogController.js";
import {
  createClientHandler,
  deleteClientHandler,
  getClientHandler,
  getClientActivityTimelineHandler,
  getClientImportHistoryHandler,
  getClientShareHistoryHandler,
  getMatchingProjectsForClientHandler,
  importClientsHandler,
  listClientsHandler,
  listPositiveClientsHandler,
  shareMatchingProjectsWithClientHandler,
  updateClientHandler,
} from "../controllers/clientController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import {
  validateClientInput,
  validateClientMatchingQuery,
  validateClientProjectShareInput,
  validateClientUpdateInput,
} from "../validators/clientValidator.js";

const router = Router();

router.get("/", protect, authorize("clients", "view"), listClientsHandler);
router.get("/positive", protect, authorize("clients", "view"), listPositiveClientsHandler);
router.post("/import", protect, authorize("clients", "create"), importClientsHandler);
router.get("/import-history", protect, authorize("clients", "create"), getClientImportHistoryHandler);
router.get(
  "/:id/matching-projects",
  protect,
  authorize("clients", "view"),
  (req, _res, next) => {
    try {
      req.query = validateClientMatchingQuery(req.query);
      next();
    } catch (error) {
      next(error);
    }
  },
  getMatchingProjectsForClientHandler
);
router.get("/:id/share-history", protect, authorize("clients", "view"), getClientShareHistoryHandler);
router.get("/:id/activity-timeline", protect, authorize("clients", "view"), getClientActivityTimelineHandler);
router.post(
  "/:id/share-projects",
  protect,
  authorize("shareRecords", "create"),
  validateBody(validateClientProjectShareInput),
  shareMatchingProjectsWithClientHandler
);
router.get("/:id/call-logs", protect, authorize("clients", "view"), listClientCallLogsHandler);
router.post("/:id/call-logs", protect, authorize("clients", "update"), createClientCallLogHandler);
router.get("/:id", protect, authorize("clients", "view"), getClientHandler);
router.post("/", protect, authorize("clients", "create"), validateBody(validateClientInput), createClientHandler);
router.put(
  "/:id",
  protect,
  authorize("clients", "update"),
  (req, _res, next) => {
    try {
      req.body = validateClientUpdateInput(req.body, req.user);
      next();
    } catch (error) {
      next(error);
    }
  },
  updateClientHandler
);
router.delete("/:id", protect, authorize("clients", "delete"), deleteClientHandler);

export default router;
