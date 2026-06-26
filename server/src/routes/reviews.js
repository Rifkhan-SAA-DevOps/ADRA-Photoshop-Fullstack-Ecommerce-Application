import express from "express";

import {
  TABLES,
  deleteItem,
  getItem,
  makeId,
  now,
  putItem,
  scanAll,
} from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  cleanupUploadedImages,
  getFiles,
  multipartUpload,
  uploadNewImagesToS3,
} from "../utils/s3ImageUpload.js";
import { deleteS3FileByUrl } from "../utils/s3Files.js";

const router = express.Router();

const REVIEW_CATEGORIES = ["product", "service", "event", "other"];

function normalizeCategory(value = "") {
  const category = String(value || "").toLowerCase().trim();

  if (category === "products") return "product";
  if (category === "services") return "service";
  if (category === "events") return "event";

  if (REVIEW_CATEGORIES.includes(category)) return category;

  return "other";
}

function getResourceTable(category) {
  if (category === "product") return TABLES.products;
  if (category === "service") return TABLES.services;
  if (category === "event") return TABLES.events;
  return null;
}

function getResourceTitle(category, item) {
  if (!item) return "";

  if (category === "product") return item.name || "";
  if (category === "service") return item.title || "";
  if (category === "event") return item.title || "";

  return "";
}

function getResourcePath(category, item) {
  if (!item?.slug) return "";

  if (category === "product") return `/products/${item.slug}`;
  if (category === "service") return `/services/${item.slug}`;
  if (category === "event") return `/events/${item.slug}`;

  return "";
}

async function findResource(category, idOrSlug) {
  const table = getResourceTable(category);

  if (!table || !idOrSlug) return null;

  const byId = await getItem(table, idOrSlug);

  if (byId) return byId;

  const rows = await scanAll(table);

  return (
    rows.find((item) => String(item.slug) === String(idOrSlug)) ||
    rows.find((item) => String(item.id) === String(idOrSlug)) ||
    null
  );
}

function validateCustomerReview(body = {}) {
  const errors = {};

  const cleanName = String(body.customer_name || "").trim();
  const cleanPhone = String(body.phone || "").trim();
  const category = normalizeCategory(body.category);
  const rating = Number(body.rating || 5);
  const comment = String(body.comment || "").trim();

  if (!cleanName) {
    errors.customer_name = "Please enter your name.";
  }

  if (!cleanPhone) {
    errors.phone = "Please enter your phone number.";
  } else if (!/^[0-9+]{9,15}$/.test(cleanPhone.replace(/\s+/g, ""))) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!REVIEW_CATEGORIES.includes(category)) {
    errors.category = "Please select product, service, event, or other.";
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.rating = "Please select a rating between 1 and 5.";
  }

  if (!comment) {
    errors.comment = "Please write your review.";
  }

  return errors;
}

function validateAdminReview(body = {}) {
  const errors = {};

  const cleanName = String(body.customer_name || "").trim();
  const cleanPhone = String(body.phone || "").trim();
  const category = normalizeCategory(body.category);
  const rating = Number(body.rating || 5);
  const comment = String(body.comment || "").trim();
  const status = body.status === "approved" ? "approved" : "pending";

  if (!cleanName) {
    errors.customer_name = "Customer name is required.";
  }

  if (!cleanPhone) {
    errors.phone = "Phone number is required.";
  }

  if (!REVIEW_CATEGORIES.includes(category)) {
    errors.category = "Please select a valid category.";
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.rating = "Rating must be between 1 and 5.";
  }

  if (!comment) {
    errors.comment = "Review is required.";
  }

  if (
    status === "approved" &&
    ["product", "service", "event"].includes(category) &&
    !body.resource_id
  ) {
    errors.resource_id = "Please select the related item before approving.";
  }

  return errors;
}

function sortNewestFirst(items = []) {
  return [...items].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );
}

async function getReviewImages(reviewId) {
  if (!TABLES.reviewImages) return [];

  try {
    const images = await scanAll(TABLES.reviewImages);

    return images
      .filter((image) => String(image.review_id) === String(reviewId))
      .sort(
        (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
      );
  } catch (error) {
    console.error("Failed to load review images:", error.message);
    return [];
  }
}
async function createReviewImageRows(reviewId, uploadedImages = []) {
  if (!uploadedImages.length) return;

  if (!TABLES.reviewImages) {
    throw new Error(
      "TABLES.reviewImages is missing. Add reviewImages to TABLES in db.js.",
    );
  }

  const createdAt = now();

  for (const image of uploadedImages) {
    await putItem(TABLES.reviewImages, {
      id: makeId("img"),
      review_id: reviewId,
      image_url: image.image_url,
      caption: image.caption || "Review image",
      created_at: createdAt,
      updated_at: createdAt,
    });
  }
}

function normalizeImageInput(images = []) {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => ({
      id: String(image.id || "").trim(),
      review_id: String(image.review_id || "").trim(),
      image_url: String(image.image_url || "").trim(),
      caption: String(image.caption || "").trim(),
      created_at: image.created_at || now(),
      updated_at: now(),
    }))
    .filter((image) => image.image_url);
}

async function syncReviewImages(reviewId, nextImages = []) {
  const existingImages = await getReviewImages(reviewId);
  const cleanNextImages = normalizeImageInput(nextImages);

  const keepIds = new Set(cleanNextImages.map((image) => image.id).filter(Boolean));
  const keepUrls = new Set(
    cleanNextImages.map((image) => image.image_url).filter(Boolean),
  );

  for (const oldImage of existingImages) {
    const shouldKeep =
      keepIds.has(oldImage.id) || keepUrls.has(oldImage.image_url);

    if (!shouldKeep) {
      if (oldImage.image_url) {
        await deleteS3FileByUrl(oldImage.image_url);
      }

      await deleteItem(TABLES.reviewImages, oldImage.id);
    }
  }

  for (const image of cleanNextImages) {
    const existing =
      existingImages.find((item) => item.id === image.id) ||
      existingImages.find((item) => item.image_url === image.image_url);

    if (existing) {
      await putItem(TABLES.reviewImages, {
        ...existing,
        caption: image.caption || "",
        updated_at: now(),
      });
    }
  }
}

async function enrichReview(review) {
  const category = normalizeCategory(review.category || review.resource_type);
  const images = await getReviewImages(review.id);

  let enrichedReview = {
    ...review,
    category,
    images,
  };

  if (review.resource_id && ["product", "service", "event"].includes(category)) {
    const resource = await findResource(category, review.resource_id);

    if (resource) {
      enrichedReview = {
        ...enrichedReview,
        resource_title:
          review.resource_title || getResourceTitle(category, resource),
        resource_slug: resource.slug || review.resource_slug || "",
        resource_cover_image:
          review.resource_cover_image || resource.cover_image || "",
        resource_path: getResourcePath(category, resource),
      };
    }
  }

  return enrichedReview;
}

router.get("/public", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 20);

    const categoryFilter = String(req.query.category || "")
      .toLowerCase()
      .trim();

    let reviews = await scanAll(TABLES.reviews);

    reviews = reviews.filter(
      (review) => review.status === "approved" || review.is_approved === true,
    );

    if (REVIEW_CATEGORIES.includes(categoryFilter)) {
      reviews = reviews.filter(
        (review) => normalizeCategory(review.category) === categoryFilter,
      );
    }

    const enriched = await Promise.all(
      sortNewestFirst(reviews).slice(0, limit).map(enrichReview),
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

router.get("/admin", requireAdmin, async (_req, res, next) => {
  try {
    const reviews = await scanAll(TABLES.reviews);

    const enriched = await Promise.all(
      sortNewestFirst(reviews).map(enrichReview),
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

router.post("/", multipartUpload.any(), async (req, res, next) => {
  let uploadedImages = [];
  let reviewId = "";

  try {
    const errors = validateCustomerReview(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const files = getFiles(req, "review_images");
    uploadedImages = await uploadNewImagesToS3(files, [], "reviews");

    const createdAt = now();
    reviewId = makeId("review");

    const review = {
      id: reviewId,
      customer_name: String(req.body.customer_name || "").trim(),
      phone: String(req.body.phone || "").trim(),
      category: normalizeCategory(req.body.category),
      rating: Number(req.body.rating || 5),
      comment: String(req.body.comment || "").trim(),

      status: "pending",
      is_approved: false,

      created_at: createdAt,
      updated_at: createdAt,
    };

    await putItem(TABLES.reviews, review);
    await createReviewImageRows(reviewId, uploadedImages);

    res.status(201).json({
      id: reviewId,
      message:
        "Thank you! Your review has been sent to admin and will appear after approval.",
    });
  } catch (error) {
    await cleanupUploadedImages(uploadedImages);

    if (reviewId) {
      try {
        await deleteItem(TABLES.reviews, reviewId);
      } catch {}
    }

    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingReview = await getItem(TABLES.reviews, req.params.id);

    if (!existingReview) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    const errors = validateAdminReview(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const category = normalizeCategory(req.body.category);
    const status = req.body.status === "approved" ? "approved" : "pending";

    let resource = null;

    if (["product", "service", "event"].includes(category) && req.body.resource_id) {
      resource = await findResource(category, req.body.resource_id);

      if (!resource) {
        return res.status(404).json({
          message: "Selected related item was not found.",
          errors: {
            resource_id: "Selected related item was not found.",
          },
        });
      }
    }

    if (Array.isArray(req.body.images)) {
      await syncReviewImages(req.params.id, req.body.images);
    }

    const updatedReview = {
      ...existingReview,
      customer_name: String(req.body.customer_name || "").trim(),
      phone: String(req.body.phone || "").trim(),
      category,
      rating: Number(req.body.rating || 5),
      comment: String(req.body.comment || "").trim(),
      status,
      is_approved: status === "approved",
      updated_at: now(),
    };

    delete updatedReview.resource_type;
    delete updatedReview.resource_id;
    delete updatedReview.resource_title;
    delete updatedReview.resource_slug;
    delete updatedReview.resource_cover_image;
    delete updatedReview.product_id;
    delete updatedReview.service_id;
    delete updatedReview.event_id;
    delete updatedReview.images;

    if (resource) {
      updatedReview.resource_type = category;
      updatedReview.resource_id = resource.id;
      updatedReview.resource_title = getResourceTitle(category, resource);
      updatedReview.resource_slug = resource.slug || "";
      updatedReview.resource_cover_image = resource.cover_image || "";

      if (category === "product") updatedReview.product_id = resource.id;
      if (category === "service") updatedReview.service_id = resource.id;
      if (category === "event") updatedReview.event_id = resource.id;
    }

    if (status === "approved") {
      updatedReview.approved_at = now();
    } else {
      delete updatedReview.approved_at;
    }

    await putItem(TABLES.reviews, updatedReview);

    const enriched = await enrichReview(updatedReview);

    res.json({
      message:
        status === "approved"
          ? "Review approved successfully."
          : "Review updated successfully.",
      review: enriched,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingReview = await getItem(TABLES.reviews, req.params.id);

    if (!existingReview) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    const images = await getReviewImages(req.params.id);

    for (const image of images) {
      if (image.image_url) {
        await deleteS3FileByUrl(image.image_url);
      }

      await deleteItem(TABLES.reviewImages, image.id);
    }

    await deleteItem(TABLES.reviews, req.params.id);

    res.json({
      message: "Review deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;