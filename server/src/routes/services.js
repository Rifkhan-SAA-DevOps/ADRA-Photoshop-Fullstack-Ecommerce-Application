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
import { slugify } from "../utils/slugify.js";
import {
  getResourceImages,
  normalizeImages,
  replaceResourceImages,
} from "../utils/resourceImages.js";
import { deleteS3FileByUrl } from "../utils/s3Files.js";
const router = express.Router();
import {
  cleanupUploadedImages,
  getFiles,
  multipartUpload,
  parseJsonField,
  uploadNewImagesToS3,
} from "../utils/s3ImageUpload.js";



import { deleteUnusedS3Urls } from "../utils/resourceImageSync.js";


function sortServices(items = []) {
  return [...items].sort((a, b) => {
    const featuredA = a.is_featured ? 1 : 0;
    const featuredB = b.is_featured ? 1 : 0;

    if (featuredB !== featuredA) {
      return featuredB - featuredA;
    }

    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

async function findServiceByIdOrSlug(idOrSlug) {
  const serviceById = await getItem(TABLES.services, idOrSlug);

  if (serviceById) return serviceById;

  const services = await scanAll(TABLES.services);

  return (
    services.find((service) => service.slug === idOrSlug) ||
    services.find((service) => String(service.id) === String(idOrSlug)) ||
    null
  );
}

router.get("/", async (req, res, next) => {
  try {
    const adminView = req.query.admin === "true";

    let services = await scanAll(TABLES.services);

    if (!adminView) {
      services = services.filter((service) => service.status === "active");
    }

    res.json(sortServices(services));
  } catch (error) {
    next(error);
  }
});

router.get("/:idOrSlug", async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;

    const service = await findServiceByIdOrSlug(key);

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const images = await getResourceImages({
      table: TABLES.serviceImages,
      foreignKey: "service_id",
      resourceId: service.id,
    });

    res.json({
      ...service,
      images,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireAdmin,
  multipartUpload.any(),
  async (req, res, next) => {
    let uploadedImages = [];

    try {
      const {
        title,
        category,
        short_description,
        description,
        price_from,
        cover_image,
        cover_new_index,
        is_featured,
        status,
      } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Service title is required." });
      }

      const existingImages = parseJsonField(req.body.existing_images, []);
      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);
      const newImageFiles = getFiles(req, "new_images");

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "services",
      );

      const cleanImages = normalizeImages([
        ...existingImages,
        ...uploadedImages,
      ]);

      const coverNewIndex = Number(cover_new_index);

      const finalCoverImage =
        Number.isInteger(coverNewIndex) && uploadedImages[coverNewIndex]
          ? uploadedImages[coverNewIndex].image_url
          : cover_image || cleanImages[0]?.image_url || "";

      const id = makeId("service");
      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`;
      const createdAt = now();
      const finalStatus = status || "active";
      const finalCategory = category || "";

      const service = {
        id,
        title,
        slug,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        short_description: short_description || "",
        description: description || "",
        price_from: Number(price_from || 0),
        cover_image: finalCoverImage,
        is_featured:
          is_featured === true ||
          is_featured === "true" ||
          is_featured === "1",
        status: finalStatus,
        created_at: createdAt,
        updated_at: createdAt,
      };

      await putItem(TABLES.services, service);

      if (cleanImages.length > 0) {
        await replaceResourceImages({
          table: TABLES.serviceImages,
          foreignKey: "service_id",
          resourceId: id,
          images: cleanImages,
        });
      }

      res.status(201).json({
        id,
        slug,
        message: "Service created.",
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);
      next(error);
    }
  },
);

router.put(
  "/:id",
  requireAdmin,
  multipartUpload.any(),
  async (req, res, next) => {
    let uploadedImages = [];

    try {
      const existingService = await getItem(TABLES.services, req.params.id);

      if (!existingService) {
        return res.status(404).json({ message: "Service not found." });
      }

      const {
        title,
        category,
        short_description,
        description,
        price_from,
        cover_image,
        cover_new_index,
        is_featured,
        status,
      } = req.body;

      const oldServiceImages = await getResourceImages({
        table: TABLES.serviceImages,
        foreignKey: "service_id",
        resourceId: req.params.id,
      });

      const existingImages = parseJsonField(
        req.body.existing_images,
        oldServiceImages,
      );

      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);
      const newImageFiles = getFiles(req, "new_images");

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "services",
      );

      const cleanImages = normalizeImages([
        ...existingImages,
        ...uploadedImages,
      ]);

      const coverNewIndex = Number(cover_new_index);

      const finalCoverImage =
        Number.isInteger(coverNewIndex) && uploadedImages[coverNewIndex]
          ? uploadedImages[coverNewIndex].image_url
          : cover_image || cleanImages[0]?.image_url || "";

      const finalStatus = status ?? existingService.status ?? "active";
      const finalCategory = category ?? existingService.category ?? "";

      const updatedService = await updateItem(TABLES.services, req.params.id, {
        title: title ?? existingService.title,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        short_description:
          short_description ?? existingService.short_description ?? "",
        description: description ?? existingService.description ?? "",
        price_from: Number(price_from ?? existingService.price_from ?? 0),
        cover_image: finalCoverImage,
        is_featured:
          is_featured === true ||
          is_featured === "true" ||
          is_featured === "1",
        status: finalStatus,
        updated_at: now(),
      });

      await replaceResourceImages({
        table: TABLES.serviceImages,
        foreignKey: "service_id",
        resourceId: req.params.id,
        images: cleanImages,
      });

      const oldUrls = [
        existingService.cover_image,
        ...oldServiceImages.map((image) => image.image_url),
      ].filter(Boolean);

      const newUrls = [
        finalCoverImage,
        ...cleanImages.map((image) => image.image_url),
      ].filter(Boolean);

      await deleteUnusedS3Urls({
        oldUrls,
        newUrls,
      });

      res.json({
        message: "Service updated.",
        service: updatedService,
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);
      next(error);
    }
  },
);

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingService = await getItem(TABLES.services, req.params.id);

    if (!existingService) {
      return res.status(404).json({ message: "Service not found." });
    }

    const serviceImages = await getResourceImages({
      table: TABLES.serviceImages,
      foreignKey: "service_id",
      resourceId: req.params.id,
    });

    const urlsToDelete = [
      existingService.cover_image,
      ...serviceImages.map((image) => image.image_url),
    ].filter(Boolean);

    const uniqueUrlsToDelete = [...new Set(urlsToDelete)];

    for (const url of uniqueUrlsToDelete) {
      try {
        await deleteS3FileByUrl(url);
      } catch (error) {
        console.error("Failed to delete S3 service image:", url, error.message);
      }
    }

    for (const image of serviceImages) {
      await deleteItem(TABLES.serviceImages, image.id);
    }

    await deleteItem(TABLES.services, req.params.id);

    res.json({ message: "Service and related images deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
