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
    const orderDiff = Number(a.sort_order || 0) - Number(b.sort_order || 0);

    if (orderDiff !== 0) return orderDiff;

    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
}

function normalizeStatus(status) {
  return status === "inactive" ? "inactive" : "active";
}

function normalizeHeroImage(item = {}) {
  return {
    ...item,
    alt: item.alt || "ADRA photography hero image",
    sort_order: Number(item.sort_order || 0),
    status: normalizeStatus(item.status),
  };
}

// PUBLIC: Home page reads only active hero image grid images
router.get("/", async (_req, res, next) => {
  try {
    const images = await scanAll(TABLES.heroImageGrid);

    const activeImages = images
      .map(normalizeHeroImage)
      .filter((image) => image.status === "active" && image.image_url);

    res.json(sortByOrder(activeImages));
  } catch (error) {
    next(error);
  }
});

// ADMIN: Read all hero image grid images
router.get("/admin", requireAdmin, async (_req, res, next) => {
  try {
    const images = await scanAll(TABLES.heroImageGrid);
    res.json(sortByOrder(images.map(normalizeHeroImage)));
  } catch (error) {
    next(error);
  }
});

// ADMIN: Upload one or many hero image grid images
router.post(
  "/",
  requireAdmin,
  multipartUpload.any(),
  async (req, res, next) => {
    let uploadedImages = [];
    const createdIds = [];

    try {
      const newImageFiles = getFiles(req, "new_images");

      if (!newImageFiles.length) {
        return res.status(400).json({
          message: "Please upload at least one hero image.",
        });
      }

      const existingImages = await scanAll(TABLES.heroImageGrid);
      const baseSortOrder = Number(req.body.sort_order || existingImages.length + 1);
      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "hero-image-grid",
      );

      const createdAt = now();
      const status = normalizeStatus(req.body.status);

      const createdImages = [];

      for (const [index, uploadedImage] of uploadedImages.entries()) {
        const id = makeId("hero");
        createdIds.push(id);

        const item = {
          id,
          image_url: uploadedImage.image_url,
          alt:
            uploadedImage.caption ||
            newImageCaptions[index] ||
            `ADRA hero image ${baseSortOrder + index}`,
          sort_order: baseSortOrder + index,
          status,
          created_at: createdAt,
          updated_at: createdAt,
        };

        await putItem(TABLES.heroImageGrid, item);
        createdImages.push(item);
      }

      res.status(201).json({
        message: "Hero image grid images uploaded.",
        images: createdImages,
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);

      for (const id of createdIds) {
        try {
          await deleteItem(TABLES.heroImageGrid, id);
        } catch (deleteError) {
          console.error("Failed to rollback hero image DB item:", deleteError.message);
        }
      }

      next(error);
    }
  },
);

// ADMIN: Update image details and optionally replace image
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
      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);

      let finalImageUrl = existingImage.image_url;

      if (newImageFiles.length > 0) {
        uploadedImages = await uploadNewImagesToS3(
          [newImageFiles[0]],
          newImageCaptions,
          "hero-image-grid",
        );

        finalImageUrl = uploadedImages[0]?.image_url || existingImage.image_url;
      }

      const updatedImage = await updateItem(TABLES.heroImageGrid, req.params.id, {
        image_url: finalImageUrl,
        alt: req.body.alt ?? existingImage.alt ?? "ADRA photography hero image",
        sort_order:
          req.body.sort_order !== undefined
            ? Number(req.body.sort_order)
            : Number(existingImage.sort_order || 0),
        status:
          req.body.status !== undefined
            ? normalizeStatus(req.body.status)
            : normalizeStatus(existingImage.status),
        updated_at: now(),
      });

      if (
        newImageFiles.length > 0 &&
        existingImage.image_url &&
        existingImage.image_url !== finalImageUrl
      ) {
        try {
          await deleteS3FileByUrl(existingImage.image_url);
        } catch (deleteError) {
          console.error(
            "Failed to delete old hero image:",
            existingImage.image_url,
            deleteError.message,
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

// ADMIN: Delete hero image grid image
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
      } catch (deleteError) {
        console.error(
          "Failed to delete S3 hero image:",
          existingImage.image_url,
          deleteError.message,
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
