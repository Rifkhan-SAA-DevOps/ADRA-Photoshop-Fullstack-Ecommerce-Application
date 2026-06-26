import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from "../config/s3.js";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (!allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WebP image files are allowed."));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

async function optimizeImage(file) {
  return sharp(file.buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 78,
      effort: 5,
    })
    .toBuffer();
}

export async function fileUrl(_req, file) {
  if (!S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is missing in .env.");
  }

  if (!file) {
    throw new Error("Image file is required.");
  }

  const optimizedBuffer = await optimizeImage(file);

  const folder = new Date().toISOString().slice(0, 10);
  const key = `uploads/${folder}/${randomUUID()}.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}