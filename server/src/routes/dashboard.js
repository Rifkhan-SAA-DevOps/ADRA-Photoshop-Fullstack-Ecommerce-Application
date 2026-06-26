import express from "express";

import { TABLES, scanAll } from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function countNew(items = []) {
  return items.filter((item) => item.status === "new").length;
}

function countPendingReviews(items = []) {
  return items.filter((item) => {
    return item.is_approved === false || item.is_approved === 0;
  }).length;
}

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const [
      services,
      products,
      events,
      bookings,
      contacts,
      reviews,
      admins,
      customers,
    ] = await Promise.all([
      scanAll(TABLES.services),
      scanAll(TABLES.products),
      scanAll(TABLES.events),
      scanAll(TABLES.bookings),
      scanAll(TABLES.contacts),
      scanAll(TABLES.reviews),
      scanAll(TABLES.admins),
      scanAll(TABLES.customers),
    ]);

    res.json({
      services: services.length,
      products: products.length,
      events: events.length,

      customerRecords: customers.length,
      admins: admins.length,

      newBookings: countNew(bookings),
      newContacts: countNew(contacts),
      pendingReviews: countPendingReviews(reviews),
    });
  } catch (error) {
    next(error);
  }
});

export default router;