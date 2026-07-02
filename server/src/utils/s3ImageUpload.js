import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from "../config/s3.js";
import { deleteS3FileByUrl } from "./s3Files.js";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export const multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB per image after frontend compression
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WebP images are allowed."));
    }

    cb(null, true);
  },
});

function makeSafeNodeBuffer(input) {
  if (!input) {
    throw new Error("Image buffer is missing.");
  }

  // If it is already a Buffer, force a real copied Buffer.
  // This avoids SharedArrayBuffer-backed memory problems in Node 22/sharp/S3.
  if (Buffer.isBuffer(input)) {
    return Buffer.from(Uint8Array.from(input));
  }

  // If it is Uint8Array or another typed array, copy it safely.
  if (ArrayBuffer.isView(input)) {
    return Buffer.from(Uint8Array.from(input));
  }

  // If it is ArrayBuffer or SharedArrayBuffer, copy into a normal Buffer.
  if (
    input instanceof ArrayBuffer ||
    Object.prototype.toString.call(input) === "[object SharedArrayBuffer]"
  ) {
    return Buffer.from(Uint8Array.from(new Uint8Array(input)));
  }

  throw new Error(`Unsupported image buffer type: ${Object.prototype.toString.call(input)}`);
}

export function parseJsonField(value, fallbackValue) {
  try {
    if (value === undefined || value === null || value === "") {
      return fallbackValue;
    }

    if (typeof value !== "string") {
      return value;
    }

    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}

export function getFiles(req, fieldName = "new_images") {
  if (!req.files) return [];

  if (Array.isArray(req.files)) {
    return req.files.filter((file) => file.fieldname === fieldName);
  }

  return req.files[fieldName] || [];
}

async function optimizeImage(file) {
  if (!file?.buffer) {
    throw new Error("Image file buffer is missing.");
  }

  const safeInputBuffer = makeSafeNodeBuffer(file.buffer);

  const optimizedOutput = await sharp(safeInputBuffer, {
    failOn: "none",
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 1400,
      height: 1400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 70,
      effort: 5,
    })
    .toBuffer();

  return makeSafeNodeBuffer(optimizedOutput);
}

export async function uploadImageToS3(file, folderName = "general") {
  if (!S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is missing in .env.");
  }

  if (!file) {
    throw new Error("Image file is required.");
  }

  const optimizedBuffer = await optimizeImage(file);

  const dateFolder = new Date().toISOString().slice(0, 10);
  const key = `uploads/${folderName}/${dateFolder}/${randomUUID()}.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
      ContentLength: optimizedBuffer.length,
    }),
  );

  const imageUrl = `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

  return {
    image_url: imageUrl,
    key,
  };
}

export async function uploadNewImagesToS3(
  files = [],
  captions = [],
  folderName = "general",
) {
  const uploadedImages = [];

  for (let index = 0; index < files.length; index += 1) {
    const uploaded = await uploadImageToS3(files[index], folderName);

    uploadedImages.push({
      image_url: uploaded.image_url,
      caption: captions[index] || "",
      key: uploaded.key,
    });
  }

  return uploadedImages;
}

export async function cleanupUploadedImages(uploadedImages = []) {
  for (const image of uploadedImages) {
    try {
      await deleteS3FileByUrl(image.image_url);
    } catch (error) {
      console.error("Failed to cleanup uploaded S3 image:", error.message);
    }
  }
}