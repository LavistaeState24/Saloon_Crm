import { Router } from "express";

import {
  createUserHandler,
  listAssignableUsersHandler,
  listUsersHandler,
} from "../controllers/userController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateCreateUserInput } from "../validators/userValidator.js";

const router = Router();

router.get("/", protect, authorize("users", "view"), listUsersHandler);
router.get("/assignable", protect, authorize("users", "view"), listAssignableUsersHandler);
router.post("/", protect, authorize("users", "create"), validateBody(validateCreateUserInput), createUserHandler);

export default router;