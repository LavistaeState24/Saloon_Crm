import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import os from "os";
import path from "path";

export const MAX_UPLOAD_SIZE_BYTES = 1000 * 1024 * 1024;
export const UPLOAD_TMP_DIR = path.join(os.tmpdir(), "property-management-crm", "uploads");

export const allowedUploadMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/rtf",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

const normalizeUploadBaseName = (filename) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80) || "upload";

export const createUploadStorage = () =>
  multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdir(UPLOAD_TMP_DIR, { recursive: true }, (error) => {
        callback(error, UPLOAD_TMP_DIR);
      });
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = normalizeUploadBaseName(file.originalname);

      callback(null, `${Date.now()}-${baseName}-${crypto.randomUUID()}${ext}`);
    },
  });

export const createUploadMiddleware = ({ fileFilter } = {}) =>
  multer({
    storage: createUploadStorage(),
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES,
    },
    ...(fileFilter ? { fileFilter } : {}),
  });
