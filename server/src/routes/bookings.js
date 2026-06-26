import express from "express";

import {
  TABLES,
  deleteItem,
  getItem,
  now,
  scanAll,
  updateItem,
} from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function sortNewestFirst(items = []) {
  return [...items].sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const bookings = await scanAll(TABLES.bookings);
    const events = await scanAll(TABLES.events);

    const rows = bookings.map((booking) => {
      const event = events.find(
        (eventItem) => String(eventItem.id) === String(booking.event_id),
      );

      return {
        ...booking,
        event_title: booking.event_title || event?.title || "",
      };
    });

    res.json(sortNewestFirst(rows));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingBooking = await getItem(TABLES.bookings, req.params.id);

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const updatedBooking = await updateItem(TABLES.bookings, req.params.id, {
      status: req.body.status || "new",
      updated_at: now(),
    });

    res.json({
      message: "Booking status updated.",
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existingBooking = await getItem(TABLES.bookings, req.params.id);

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    await deleteItem(TABLES.bookings, req.params.id);

    res.json({ message: "Booking deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;