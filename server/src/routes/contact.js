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
import { notifyAdmin } from "../utils/notify.js";

const router = express.Router();

function sortNewestFirst(items = []) {
  return [...items].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, service_type, message } = req.body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({ message: "Name and phone number are required." });
    }

    const id = makeId("contact");
    const createdAt = now();

    const contactRequest = {
      id,
      name,
      email: email || "",
      phone,
      service_type: service_type || "",
      message: message || "",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    };

    await putItem(TABLES.contacts, contactRequest);

    const notification = await notifyAdmin("contact/service", {
      name,
      email,
      phone,
      service_type,
      message,
    });

    res.status(201).json({
      id,
      message: "Request sent successfully.",
      notification,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const rows = await scanAll(TABLES.contacts);

    res.json(sortNewestFirst(rows));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingRequest = await getItem(TABLES.contacts, req.params.id);

    if (!existingRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    const updatedRequest = await updateItem(TABLES.contacts, req.params.id, {
      status: req.body.status || "new",
      updated_at: now(),
    });

    res.json({
      message: "Request status updated.",
      request: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingRequest = await getItem(TABLES.contacts, req.params.id);

    if (!existingRequest) {
      return res.status(404).json({ message: "Request not found." });
    }

    await deleteItem(TABLES.contacts, req.params.id);

    res.json({ message: "Request deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;