import { allowedUploadMimeTypes, createUploadMiddleware } from "../config/upload.js";

export const upload = createUploadMiddleware({
  fileFilter: (_req, file, callback) => {
    if (!allowedUploadMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Invalid file type. Only PDFs, images, videos, and common office documents are allowed."
        ),
        false
      );
    }

    callback(null, true);
  },
});
