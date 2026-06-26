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
import { notifyAdmin } from "../utils/notify.js";
import {
  getResourceImages,
  normalizeImages,
  replaceResourceImages,
} from "../utils/resourceImages.js";
import { deleteS3FileByUrl } from "../utils/s3Files.js";
import {
  deleteUnusedS3Urls,
  syncResourceImages,
} from "../utils/resourceImageSync.js";
const router = express.Router();

import {
  cleanupUploadedImages,
  getFiles,
  multipartUpload,
  parseJsonField,
  uploadNewImagesToS3,
} from "../utils/s3ImageUpload.js";

function getDateTime(value) {
  if (!value) return 0;

  return new Date(String(value).replace(" ", "T")).getTime();
}

function sortEventsAsc(items = []) {
  return [...items].sort((a, b) => {
    return getDateTime(a.event_date) - getDateTime(b.event_date);
  });
}

async function findEventByIdOrSlug(idOrSlug) {
  const eventById = await getItem(TABLES.events, idOrSlug);

  if (eventById) return eventById;

  const events = await scanAll(TABLES.events);

  return (
    events.find((event) => event.slug === idOrSlug) ||
    events.find((event) => String(event.id) === String(idOrSlug)) ||
    null
  );
}

router.get("/", async (req, res, next) => {
  try {
    const adminView = req.query.admin === "true";

    let events = await scanAll(TABLES.events);

    if (!adminView) {
      events = events.filter((event) => event.status === "upcoming");
    }

    res.json(sortEventsAsc(events));
  } catch (error) {
    next(error);
  }
});

router.get("/:idOrSlug", async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;

    const event = await findEventByIdOrSlug(key);

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const images = await getResourceImages({
      table: TABLES.eventImages,
      foreignKey: "event_id",
      resourceId: event.id,
    });

    res.json({
      ...event,
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
        event_date,
        location,
        description,
        promotional_message,
        cover_image,
        cover_new_index,
        status,
      } = req.body;

      if (!title || !event_date) {
        return res
          .status(400)
          .json({ message: "Title and event date are required." });
      }

      const existingImages = parseJsonField(req.body.existing_images, []);
      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);
      const newImageFiles = getFiles(req, "new_images");

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "events",
      );

      const cleanImages = normalizeImages([...existingImages, ...uploadedImages]);

      const coverNewIndex = Number(cover_new_index);

      const finalCoverImage =
        Number.isInteger(coverNewIndex) && uploadedImages[coverNewIndex]
          ? uploadedImages[coverNewIndex].image_url
          : cover_image || cleanImages[0]?.image_url || "";

      const id = makeId("event");
      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`;
      const createdAt = now();
      const finalStatus = status || "upcoming";
      const finalCategory = category || "";

      const event = {
        id,
        title,
        slug,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        event_date,
        location: location || "",
        description: description || "",
        promotional_message: promotional_message || "",
        cover_image: finalCoverImage,
        status: finalStatus,
        created_at: createdAt,
        updated_at: createdAt,
      };

      await putItem(TABLES.events, event);

      if (cleanImages.length > 0) {
        await replaceResourceImages({
          table: TABLES.eventImages,
          foreignKey: "event_id",
          resourceId: id,
          images: cleanImages,
        });
      }

      res.status(201).json({
        id,
        slug,
        message: "Event created.",
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
      const existingEvent = await getItem(TABLES.events, req.params.id);

      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found." });
      }

      const {
        title,
        category,
        event_date,
        location,
        description,
        promotional_message,
        cover_image,
        cover_new_index,
        status,
      } = req.body;

      const oldEventImages = await getResourceImages({
        table: TABLES.eventImages,
        foreignKey: "event_id",
        resourceId: req.params.id,
      });

      const existingImages = parseJsonField(
        req.body.existing_images,
        oldEventImages,
      );

      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);
      const newImageFiles = getFiles(req, "new_images");

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "events",
      );

      const cleanImages = normalizeImages([...existingImages, ...uploadedImages]);

      const coverNewIndex = Number(cover_new_index);

      const finalCoverImage =
        Number.isInteger(coverNewIndex) && uploadedImages[coverNewIndex]
          ? uploadedImages[coverNewIndex].image_url
          : cover_image || cleanImages[0]?.image_url || "";

      const finalStatus = status ?? existingEvent.status ?? "upcoming";
      const finalCategory = category ?? existingEvent.category ?? "";

      const updatedEvent = await updateItem(TABLES.events, req.params.id, {
        title: title ?? existingEvent.title,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        event_date: event_date ?? existingEvent.event_date,
        location: location ?? existingEvent.location ?? "",
        description: description ?? existingEvent.description ?? "",
        promotional_message:
          promotional_message ?? existingEvent.promotional_message ?? "",
        cover_image: finalCoverImage,
        status: finalStatus,
        updated_at: now(),
      });

      await replaceResourceImages({
        table: TABLES.eventImages,
        foreignKey: "event_id",
        resourceId: req.params.id,
        images: cleanImages,
      });

      const oldUrls = [
        existingEvent.cover_image,
        ...oldEventImages.map((image) => image.image_url),
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
        message: "Event updated.",
        event: updatedEvent,
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);
      next(error);
    }
  },
);

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingEvent = await getItem(TABLES.events, req.params.id);

    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found." });
    }

    const eventImages = await getResourceImages({
      table: TABLES.eventImages,
      foreignKey: "event_id",
      resourceId: req.params.id,
    });

    const urlsToDelete = [
      existingEvent.cover_image,
      ...eventImages.map((image) => image.image_url),
    ].filter(Boolean);

    const uniqueUrlsToDelete = [...new Set(urlsToDelete)];

    for (const url of uniqueUrlsToDelete) {
      try {
        await deleteS3FileByUrl(url);
      } catch (error) {
        console.error("Failed to delete S3 event image:", url, error.message);
      }
    }

    for (const image of eventImages) {
      await deleteItem(TABLES.eventImages, image.id);
    }

    await deleteItem(TABLES.events, req.params.id);

    res.json({ message: "Event and related images deleted." });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/bookings", async (req, res, next) => {
  try {
    const { customer_name, email, phone, service_needed, message } = req.body;

    if (!customer_name || !phone) {
      return res
        .status(400)
        .json({ message: "Name and phone number are required." });
    }

    const event = await findEventByIdOrSlug(req.params.id);

    const id = makeId("booking");
    const createdAt = now();

    const booking = {
      id,
      event_id: event?.id || req.params.id,
      event_title: event?.title || "",
      customer_name,
      email: email || "",
      phone,
      service_needed: service_needed || "Event photography",
      message: message || "",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    };

    await putItem(TABLES.bookings, booking);

    const notification = await notifyAdmin("event booking", {
      customer_name,
      email,
      phone,
      service_needed,
      message,
      event_title: event?.title || "",
    });

    res.status(201).json({
      id,
      message: "Booking request sent successfully.",
      notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
