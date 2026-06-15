import path from "path";
import { promises as fsPromises } from "fs";
import fs from "fs";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env, getMissingAwsS3EnvVars, isAwsS3Configured } from "../config/env.js";
import { buildS3ObjectUrl, s3Client } from "../config/s3.js";
import { MAX_UPLOAD_SIZE_BYTES } from "../config/upload.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeUploadBaseName = (filename) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "") || "upload";

const createS3ObjectKey = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const baseName = normalizeUploadBaseName(filename);
  const datePrefix = new Date().toISOString().slice(0, 10);

  return `uploads/${datePrefix}/${Date.now()}-${baseName}-${crypto.randomUUID()}${ext}`;
};

const cleanupTempFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to remove temp upload file: ${filePath}`, error);
    }
  }
};

export const uploadFilesHandler = asyncHandler(async (req, res) => {
  if (!isAwsS3Configured()) {
    throw new ApiError(
      500,
      "AWS S3 is not configured correctly",
      null,
      {
        missingEnvVars: getMissingAwsS3EnvVars(),
      }
    );
  }

  if (!req.files || !req.files.length) {
    return res.status(400).json({
      success: false,
      message: "No files uploaded",
    });
  }

  try {
    const files = await Promise.all(
      req.files.map(async (file) => {
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          throw new ApiError(
            400,
            `File size too large. Got ${file.size}. Maximum is ${MAX_UPLOAD_SIZE_BYTES}.`
          );
        }

        const key = createS3ObjectKey(file.originalname);

        await s3Client.send(
          new PutObjectCommand({
            Bucket: env.awsS3Bucket,
            Key: key,
            Body: fs.createReadStream(file.path),
            ContentType: file.mimetype,
            ContentLength: file.size,
            Metadata: {
              originalname: file.originalname,
            },
          })
        );

        const url = buildS3ObjectUrl(env.awsS3Bucket, env.awsRegion, key);

        return {
          name: file.originalname,
          filename: path.basename(key),
          url,
          key,
          mimetype: file.mimetype,
          size: file.size,
        };
      })
    );

    res.status(201).json({
      success: true,
      data: files,
    });
  } finally {
    await Promise.all(req.files.map((file) => cleanupTempFile(file.path)));
  }
});
