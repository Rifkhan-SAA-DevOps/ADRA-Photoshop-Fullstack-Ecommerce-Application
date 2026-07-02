import express from "express";
import {
  TABLES,
  deleteItem,
  getItem,
  makeId,
  now,
  putItem,
  scanAll,
  updateItem,
} from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  cleanupUploadedImages,
  getFiles,
  multipartUpload,
  parseJsonField,
  uploadNewImagesToS3,
} from "../utils/s3ImageUpload.js";
import { deleteS3FileByUrl } from "../utils/s3Files.js";

const router = express.Router();

function sortByOrder(items = []) {
  return [...items].sort((a, b) => {
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });
}

function normalizeStatus(status) {
  return status === "inactive" ? "inactive" : "active";
}

// PUBLIC: Home page hero image grid
router.get("/", async (req, res, next) => {
  try {
    const images = await scanAll(TABLES.heroImageGrid);

    const activeImages = images.filter((image) => {
      return image.status === "active";
    });

    res.json(sortByOrder(activeImages));
  } catch (error) {
    next(error);
  }
});

// ADMIN: Get all hero grid images
router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const images = await scanAll(TABLES.heroImageGrid);

    res.json(sortByOrder(images));
  } catch (error) {
    next(error);
  }
});

// ADMIN: Upload one or many hero grid images
router.post(
  "/",
  requireAdmin,
  multipartUpload.any(),
  async (req, res, next) => {
    let uploadedImages = [];

    try {
      const newImageFiles = getFiles(req, "new_images");

      if (!newImageFiles.length) {
        return res.status(400).json({
          message: "Please upload at least one hero grid image.",
        });
      }

      const existingImages = await scanAll(TABLES.heroImageGrid);
      const nextSortOrder = existingImages.length + 1;

      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "hero-image-grid",
      );

      const createdAt = now();

      const createdItems = await Promise.all(
        uploadedImages.map(async (image, index) => {
          const id = makeId("hero");

          const item = {
            id,
            image_url: image.image_url,
            alt:
              image.caption ||
              req.body.alt ||
              `ADRA hero image ${nextSortOrder + index}`,
            sort_order: Number(req.body.sort_order || nextSortOrder + index),
            status: normalizeStatus(req.body.status),
            created_at: createdAt,
            updated_at: createdAt,
          };

          await putItem(TABLES.heroImageGrid, item);

          return item;
        }),
      );

      res.status(201).json({
        message: "Hero image grid image uploaded.",
        images: createdItems,
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);
      next(error);
    }
  },
);

// ADMIN: Update image details or replace image
router.put(
  "/:id",
  requireAdmin,
  multipartUpload.any(),
  async (req, res, next) => {
    let uploadedImages = [];

    try {
      const existingImage = await getItem(TABLES.heroImageGrid, req.params.id);

      if (!existingImage) {
        return res.status(404).json({
          message: "Hero image not found.",
        });
      }

      const newImageFiles = getFiles(req, "new_images");

      let finalImageUrl = existingImage.image_url;

      if (newImageFiles.length > 0) {
        uploadedImages = await uploadNewImagesToS3(
          [newImageFiles[0]],
          [req.body.alt || existingImage.alt || ""],
          "hero-image-grid",
        );

        finalImageUrl = uploadedImages[0]?.image_url || existingImage.image_url;
      }

      const updatedImage = await updateItem(TABLES.heroImageGrid, req.params.id, {
        image_url: finalImageUrl,
        alt: req.body.alt ?? existingImage.alt ?? "",
        sort_order:
          req.body.sort_order !== undefined
            ? Number(req.body.sort_order)
            : Number(existingImage.sort_order || 0),
        status:
          req.body.status !== undefined
            ? normalizeStatus(req.body.status)
            : existingImage.status || "active",
        updated_at: now(),
      });

      if (
        newImageFiles.length > 0 &&
        existingImage.image_url &&
        existingImage.image_url !== finalImageUrl
      ) {
        try {
          await deleteS3FileByUrl(existingImage.image_url);
        } catch (error) {
          console.error(
            "Failed to delete old hero grid image:",
            existingImage.image_url,
            error.message,
          );
        }
      }

      res.json({
        message: "Hero image updated.",
        image: updatedImage,
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);
      next(error);
    }
  },
);

// ADMIN: Delete hero grid image
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingImage = await getItem(TABLES.heroImageGrid, req.params.id);

    if (!existingImage) {
      return res.status(404).json({
        message: "Hero image not found.",
      });
    }

    if (existingImage.image_url) {
      try {
        await deleteS3FileByUrl(existingImage.image_url);
      } catch (error) {
        console.error(
          "Failed to delete S3 hero grid image:",
          existingImage.image_url,
          error.message,
        );
      }
    }

    await deleteItem(TABLES.heroImageGrid, req.params.id);

    res.json({
      message: "Hero image deleted.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;