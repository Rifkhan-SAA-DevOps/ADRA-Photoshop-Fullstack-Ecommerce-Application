import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { requireAdmin } from "../middleware/auth.js";
import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from "../config/s3.js";

const router = express.Router();

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WebP images are allowed."));
    }

    cb(null, true);
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
    const view = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    return Buffer.from(Uint8Array.from(view));
  }

  if (
    input instanceof ArrayBuffer ||
    Object.prototype.toString.call(input) === "[object SharedArrayBuffer]"
  ) {
    return Buffer.from(Uint8Array.from(new Uint8Array(input)));
  }

  throw new Error(`Unsupported image buffer type: ${Object.prototype.toString.call(input)}`);
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

router.post("/", requireAdmin, upload.any(), async (req, res, next) => {
  try {
    if (!S3_BUCKET) {
      return res.status(500).json({
        message: "AWS_S3_BUCKET is missing in .env.",
      });
    }

    const file = req.files?.[0];

    if (!file) {
      return res.status(400).json({
        message: "Image file is required.",
      });
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

    const url = `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    res.status(201).json({
      message: "Image uploaded successfully.",
      url,
      key,
    });
  } catch (error) {
    next(error);
  }
});

export default router;