import multer from "multer";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from "../config/s3.js";
import { deleteS3FileByUrl } from "./s3Files.js";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export const multipartUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB per image
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
    return Buffer.from(input);
  }

  if (ArrayBuffer.isView(input)) {
    return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }

  return Buffer.from(input);
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

export async function uploadImageToS3(file, folderName = "general") {
  if (!S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET is missing in .env.");
  }

  if (!file) {
    throw new Error("Image file is required.");
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }

  const safeBuffer = makeSafeBuffer(file.buffer);
  const { extension, contentType } = getExtensionAndContentType(file);

  const dateFolder = new Date().toISOString().slice(0, 10);
  const key = `uploads/${folderName}/${dateFolder}/${randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: safeBuffer,
      ContentType: contentType,
      ContentLength: safeBuffer.length,
      CacheControl: "public, max-age=31536000, immutable",
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