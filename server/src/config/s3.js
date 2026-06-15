import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const s3Client = new S3Client({
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
  },
});

export const buildS3ObjectUrl = (bucket, region, key) => {
  const encodedKey = String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://s3.${region}.amazonaws.com/${bucket}/${encodedKey}`;
};
