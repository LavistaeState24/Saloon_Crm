import { Router } from "express";

import { uploadFilesHandler } from "../controllers/uploadController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.post("/", protect, upload.array("files", 12), uploadFilesHandler);

export default router;

