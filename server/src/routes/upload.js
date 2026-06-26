import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { requireAdmin } from "../middleware/auth.js";
import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from "../config/s3.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WebP images are allowed."));
    }

    cb(null, true);
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