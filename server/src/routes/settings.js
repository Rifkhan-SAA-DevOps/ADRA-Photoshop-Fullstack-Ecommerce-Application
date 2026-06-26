import express from "express";

import {
  TABLES,
  getItem,
  now,
  putItem,
  updateItem,
} from "../config/db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const SETTINGS_ID = "site";

const defaultSettings = {
  id: SETTINGS_ID,

  site_name: "ADRA",
  site_tagline: "Photography, Editing & Creative Services",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",

  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  youtube_url: "",

  hero_title: "Capture Your Best Moments",
  hero_subtitle:
    "Professional photography, photo framing, video editing, website creation, and digital services.",

  about_title: "About ADRA",
  about_description:
    "We provide creative photography, editing, framing, and digital solutions for customers.",

  updated_at: now(),
};

function cleanSettingsPayload(body = {}) {
  const allowedFields = [
    "site_name",
    "site_tagline",
    "email",
    "phone",
    "whatsapp",
    "address",

    "facebook_url",
    "instagram_url",
    "tiktok_url",
    "youtube_url",

    "hero_title",
    "hero_subtitle",

    "about_title",
    "about_description",
  ];

  const payload = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = String(body[field] || "").trim();
    }
  });

  return payload;
}

router.get("/", async (_req, res, next) => {
  try {
    const settings = await getItem(TABLES.settings, SETTINGS_ID);

    if (!settings) {
      await putItem(TABLES.settings, defaultSettings);
      return res.json(defaultSettings);
    }

    res.json({
      ...defaultSettings,
      ...settings,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/", requireAdmin, async (req, res, next) => {
  try {
    const existingSettings =
      (await getItem(TABLES.settings, SETTINGS_ID)) || defaultSettings;

    const payload = cleanSettingsPayload(req.body);

    const updatedSettings = {
      ...existingSettings,
      ...payload,
      id: SETTINGS_ID,
      updated_at: now(),
    };

    await putItem(TABLES.settings, updatedSettings);

    res.json({
      message: "Settings updated successfully.",
      settings: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/", requireAdmin, async (req, res, next) => {
  try {
    const payload = cleanSettingsPayload(req.body);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        message: "No valid settings fields provided.",
      });
    }

    const existingSettings =
      (await getItem(TABLES.settings, SETTINGS_ID)) || defaultSettings;

    const updatedSettings = {
      ...existingSettings,
      ...payload,
      id: SETTINGS_ID,
      updated_at: now(),
    };

    await putItem(TABLES.settings, updatedSettings);

    res.json({
      message: "Settings updated successfully.",
      settings: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;