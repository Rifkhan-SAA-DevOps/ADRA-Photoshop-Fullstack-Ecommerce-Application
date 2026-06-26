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
const router = express.Router();

import {
  cleanupUploadedImages,
  getFiles,
  multipartUpload,
  parseJsonField,
  uploadNewImagesToS3,
} from "../utils/s3ImageUpload.js";
import { deleteUnusedS3Urls } from "../utils/resourceImageSync.js";
function sortNewestFirst(items = []) {
  return [...items].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

async function findProductByIdOrSlug(idOrSlug) {
  const productById = await getItem(TABLES.products, idOrSlug);

  if (productById) return productById;

  const products = await scanAll(TABLES.products);

  return (
    products.find((product) => product.slug === idOrSlug) ||
    products.find((product) => String(product.id) === String(idOrSlug)) ||
    null
  );
}

router.get("/", async (req, res, next) => {
  try {
    const adminView = req.query.admin === "true";

    let products = await scanAll(TABLES.products);

    if (!adminView) {
      products = products.filter((product) => product.status === "active");
    }

    res.json(sortNewestFirst(products));
  } catch (error) {
    next(error);
  }
});

router.get("/:idOrSlug", async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;

    const product = await findProductByIdOrSlug(key);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const images = await getResourceImages({
      table: TABLES.productImages,
      foreignKey: "product_id",
      resourceId: product.id,
    });

    const allReviews = await scanAll(TABLES.reviews);

    const reviews = allReviews
      .filter((review) => {
        return (
          String(review.product_id) === String(product.id) &&
          review.is_approved === true
        );
      })
      .sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );

    res.json({
      ...product,
      images,
      reviews,
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
        name,
        category,
        description,
        price,
        cover_image,
        cover_new_index,
        status,
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Product name is required." });
      }

      const existingImages = parseJsonField(req.body.existing_images, []);
      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);
      const newImageFiles = getFiles(req, "new_images");

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "products",
      );

      const cleanImages = [...existingImages, ...uploadedImages];

      const coverNewIndex = Number(cover_new_index);
      const finalCoverImage =
        Number.isInteger(coverNewIndex) && uploadedImages[coverNewIndex]
          ? uploadedImages[coverNewIndex].image_url
          : cover_image || cleanImages[0]?.image_url || "";

      const id = makeId("product");
      const baseSlug = slugify(name);
      const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`;
      const createdAt = now();
      const finalStatus = status || "active";
      const finalCategory = category || "";

      const product = {
        id,
        name,
        slug,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        description: description || "",
        price: Number(price || 0),
        cover_image: finalCoverImage,
        status: finalStatus,
        created_at: createdAt,
        updated_at: createdAt,
      };

      await putItem(TABLES.products, product);

      if (cleanImages.length > 0) {
        await replaceResourceImages({
          table: TABLES.productImages,
          foreignKey: "product_id",
          resourceId: id,
          images: cleanImages,
        });
      }

      res.status(201).json({
        id,
        slug,
        message: "Product created.",
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
      const existingProduct = await getItem(TABLES.products, req.params.id);

      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found." });
      }

      const {
        name,
        category,
        description,
        price,
        cover_image,
        cover_new_index,
        status,
      } = req.body;

      const oldProductImages = await getResourceImages({
        table: TABLES.productImages,
        foreignKey: "product_id",
        resourceId: req.params.id,
      });

      const existingImages = parseJsonField(
        req.body.existing_images,
        oldProductImages,
      );

      const newImageCaptions = parseJsonField(req.body.new_image_captions, []);

      const newImageFiles = getFiles(req, "new_images");

      uploadedImages = await uploadNewImagesToS3(
        newImageFiles,
        newImageCaptions,
        "products",
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

      const finalStatus = status ?? existingProduct.status ?? "active";
      const finalCategory = category ?? existingProduct.category ?? "";

      const updatedProduct = await updateItem(TABLES.products, req.params.id, {
        name: name ?? existingProduct.name,
        category: finalCategory,
        category_status: `${finalCategory || "General"}#${finalStatus}`,
        description: description ?? existingProduct.description ?? "",
        price: Number(price ?? existingProduct.price ?? 0),
        cover_image: finalCoverImage,
        status: finalStatus,
        updated_at: now(),
      });

      await replaceResourceImages({
        table: TABLES.productImages,
        foreignKey: "product_id",
        resourceId: req.params.id,
        images: cleanImages,
      });

      const oldUrls = [
        existingProduct.cover_image,
        ...oldProductImages.map((image) => image.image_url),
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
        message: "Product updated.",
        product: updatedProduct,
      });
    } catch (error) {
      await cleanupUploadedImages(uploadedImages);
      next(error);
    }
  },
);

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingProduct = await getItem(TABLES.products, req.params.id);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    const productImages = await getResourceImages({
      table: TABLES.productImages,
      foreignKey: "product_id",
      resourceId: req.params.id,
    });

    const urlsToDelete = [
      existingProduct.cover_image,
      ...productImages.map((image) => image.image_url),
    ].filter(Boolean);

    const uniqueUrlsToDelete = [...new Set(urlsToDelete)];

    for (const url of uniqueUrlsToDelete) {
      try {
        await deleteS3FileByUrl(url);
      } catch (error) {
        console.error("Failed to delete S3 product image:", url, error.message);
      }
    }

    for (const image of productImages) {
      await deleteItem(TABLES.productImages, image.id);
    }

    await deleteItem(TABLES.products, req.params.id);

    res.json({ message: "Product and related images deleted." });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/order", async (req, res, next) => {
  try {
    const { customer_name, phone, email, count, address, message } = req.body;

    const cleanName = String(customer_name || "").trim();
    const cleanPhone = String(phone || "").replace(/\s+/g, "");
    const cleanEmail = String(email || "").trim();
    const cleanAddress = String(address || "").trim();
    const cleanMessage = String(message || "").trim();
    const productCount = Number(count || 1);

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

    if (!Number.isFinite(productCount) || productCount < 1) {
      errors.count = "Please enter a valid quantity.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const product = await findProductByIdOrSlug(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
        errors: {
          product: "This product is no longer available.",
        },
      });
    }

    const createdAt = now();
    const id = makeId("booking");
    const unitPrice = Number(product.price || 0);
    const totalAmount = unitPrice * productCount;

    const booking = {
      id,
      type: "product_order",

      product_id: product.id,
      product_title: product.name,
      product_slug: product.slug,
      product_price: unitPrice,
      count: productCount,
      total_amount: totalAmount,

      customer_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      message: cleanMessage,

      service_needed: `Product order: ${product.name}`,

      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    };

    await putItem(TABLES.bookings, booking);

    const notification = await notifyAdmin("product order", {
      customer_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      product_title: product.name,
      count: productCount,
      total_amount: totalAmount,
      address: cleanAddress,
      message: cleanMessage,
    });

    res.status(201).json({
      id,
      message:
        "Your order request has been sent to the admin successfully. We will contact you soon.",
      notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
