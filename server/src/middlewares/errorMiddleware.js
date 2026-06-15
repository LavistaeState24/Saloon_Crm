import { MAX_UPLOAD_SIZE_BYTES } from "../config/upload.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    const maxUploadSizeMb = Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024));

    return res.status(400).json({
      success: false,
      message: `File size too large. Maximum allowed is ${maxUploadSizeMb}MB`,
      errors: {
        file: `Uploaded file exceeds the ${maxUploadSizeMb}MB limit`,
      },
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Too many files uploaded or unexpected file field",
      errors: {
        file: error.message,
      },
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  if (error.message?.startsWith("Invalid file type.")) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: {
        file: error.message,
      },
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  if (error.name === "S3ServiceException" || error.$metadata?.httpStatusCode) {
    return res.status(error.$metadata?.httpStatusCode || 502).json({
      success: false,
      message: error.message || "File upload failed",
      errors: error.errors || null,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  if (error.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, value]) => [field, value.message])
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";

    return res.status(409).json({
      success: false,
      message: "Validation failed",
      errors: {
        [field]: `${field} already exists`,
      },
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};
