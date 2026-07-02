import express from "express";
import { notifyAdmin } from "../utils/notify.js";
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
import {
  cleanupUploadedImages,
  getFiles,
  multipartUpload,
  parseJsonField,
  uploadNewImagesToS3,
} from "../utils/s3ImageUpload.js";
import { deleteUnusedS3Urls } from "../utils/resourceImageSync.js";

const router = express.Router();

function getEventTime(eventOrDate) {
  const dateValue =
    typeof eventOrDate === "string" ? eventOrDate : eventOrDate?.event_date;

  if (!dateValue) return 0;

  const time = new Date(String(dateValue).replace(" ", "T")).getTime();

  return Number.isFinite(time) ? time : 0;
}

function sortEvents(items = []) {
  return [...items].sort((a, b) => {
    const aTime = getEventTime(a);
    const bTime = getEventTime(b);

    if (aTime && bTime) return aTime - bTime;
    if (aTime) return -1;
    if (bTime) return 1;

    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

function normalizeEventDate(value) {
  if (!value) return "";
  return String(value).replace("T", " ");
}

function normalizeStatus(status) {
  const cleanStatus = String(status || "").trim().toLowerCase();

  if (["upcoming", "completed", "cancelled"].includes(cleanStatus)) {
    return cleanStatus;
  }

  return "upcoming";
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

async function attachImagesToEvents(events = []) {
  if (!events.length) return [];

  return Promise.all(
    events.map(async (event) => {
      const images = await getResourceImages({
        table: TABLES.eventImages,
        foreignKey: "event_id",
        resourceId: event.id,
      });

      return {
        ...event,
        images: normalizeImages(images),
      };
    }),
  );
}

router.get("/", async (req, res, next) => {
  try {
    const adminView = req.query.admin === "true";

    let events = await scanAll(TABLES.events);

    if (!adminView) {
      events = events.filter((event) => event.status !== "cancelled");
    }

    const eventsWithImages = await attachImagesToEvents(events);
  
    res.json(sortEvents(eventsWithImages));
  } catch (error) {
    next(error);
  }
});

router.get("/:idOrSlug", async (req, res, next) => {

  
  try {
    const event = await findEventByIdOrSlug(req.params.idOrSlug);

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
        promotional_message,
        description,
        cover_image,
        cover_new_index,
        status,
      } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Event title is required." });
      }

      if (!event_date) {
        return res.status(400).json({ message: "Event date is required." });
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
      const finalStatus = normalizeStatus(status);
      const finalCategory = category || "";

      const event = {
        id,
        title,
        slug,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        event_date: normalizeEventDate(event_date),
        location: location || "",
        promotional_message: promotional_message || "",
        description: description || "",
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
        promotional_message,
        description,
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

      const cleanImages = normalizeImages([
        ...existingImages,
        ...uploadedImages,
      ]);

      const coverNewIndex = Number(cover_new_index);
      const finalCoverImage =
        Number.isInteger(coverNewIndex) && uploadedImages[coverNewIndex]
          ? uploadedImages[coverNewIndex].image_url
          : cover_image || cleanImages[0]?.image_url || "";

      const finalStatus =
        status !== undefined
          ? normalizeStatus(status)
          : existingEvent.status || "upcoming";

      const finalCategory = category ?? existingEvent.category ?? "";

      const updatedEvent = await updateItem(TABLES.events, req.params.id, {
        title: title ?? existingEvent.title,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        event_date:
          event_date !== undefined
            ? normalizeEventDate(event_date)
            : existingEvent.event_date,
        location: location ?? existingEvent.location ?? "",
        promotional_message:
          promotional_message ?? existingEvent.promotional_message ?? "",
        description: description ?? existingEvent.description ?? "",
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
    const { customer_name, phone, email, service_needed, message } = req.body;

    const cleanName = String(customer_name || "").trim();
    const cleanPhone = String(phone || "").replace(/\s+/g, "");
    const cleanEmail = String(email || "").trim();
    const cleanServiceNeeded = String(service_needed || "").trim();
    const cleanMessage = String(message || "").trim();

    const errors = {};

    if (!cleanName) {
      errors.customer_name = "Please enter your name.";
    }

    if (!cleanPhone) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^[0-9+]{9,15}$/.test(cleanPhone)) {
      errors.phone = "Please enter a valid phone number.";
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!cleanServiceNeeded) {
      errors.service_needed = "Please enter the service you need.";
    }

    const event = await findEventByIdOrSlug(req.params.id);

    if (!event) {
      errors.event = "This event is no longer available.";
    }

    if (event) {
      const eventTime = getEventTime(event);

      if (!eventTime || eventTime <= Date.now()) {
        errors.event = "Booking is closed because this event date has already passed.";
      }

      if (event.status === "cancelled") {
        errors.event = "Booking is closed because this event is cancelled.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const createdAt = now();
    const id = makeId("booking");

    const booking = {
      id,
      type: "event_booking",

      event_id: event.id,
      event_title: event.title,
      event_slug: event.slug,
      event_date: event.event_date,
      event_location: event.location || "",

      customer_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      service_needed: cleanServiceNeeded,
      message: cleanMessage,

      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    };

    await putItem(TABLES.bookings, booking);

    const notification = await notifyAdmin("event booking", {
      customer_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      event_title: event.title,
      event_date: event.event_date,
      event_location: event.location || "",
      service_needed: cleanServiceNeeded,
      message: cleanMessage,
    });

    res.status(201).json({
      id,
      message:
        "Your event booking request has been sent to the admin successfully. We will contact you soon.",
      notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
