import multer from "multer";
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
    fileSize: 2 * 1024 * 1024,
    files: 8,
  },
});

function makeSafeBuffer(input) {
  if (!input) {
    throw new Error("Image buffer is missing.");
  }

  if (Buffer.isBuffer(input)) {
    return Buffer.from(Uint8Array.from(input));
  }

  if (ArrayBuffer.isView(input)) {
    const view = new Uint8Array(
      input.buffer,
      input.byteOffset,
      input.byteLength,
    );

    return Buffer.from(Uint8Array.from(view));
  }

  if (
    input instanceof ArrayBuffer ||
    Object.prototype.toString.call(input) === "[object SharedArrayBuffer]"
  ) {
    return Buffer.from(Uint8Array.from(new Uint8Array(input)));
  }

  throw new Error(
    `Unsupported image buffer type: ${Object.prototype.toString.call(input)}`,
  );
}

function getExtensionAndContentType(file) {
  if (file.mimetype === "image/png") {
    return {
      extension: "png",
      contentType: "image/png",
    };
  }

  if (file.mimetype === "image/jpeg") {
    return {
      extension: "jpg",
      contentType: "image/jpeg",
    };
  }

  return {
    extension: "webp",
    contentType: "image/webp",
  };
}

export async function fileUrl(_req, file) {
  if (!S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is missing in .env.");
  }

  if (!file) {
    throw new Error("Image file is required.");
  }

  const { extension, contentType } = getExtensionAndContentType(file);
  const safeBody = makeSafeBuffer(file.buffer);

  const folder = new Date().toISOString().slice(0, 10);
  const key = `uploads/${folder}/${randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: safeBody,
      ContentType: contentType,
      ContentLength: safeBody.length,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}