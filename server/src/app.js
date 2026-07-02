import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import serviceRoutes from "./routes/services.js";
import productRoutes from "./routes/products.js";
import reviewRoutes from "./routes/reviews.js";
import eventRoutes from "./routes/events.js";
import bookingRoutes from "./routes/bookings.js";
import contactRoutes from "./routes/contact.js";
import uploadRoutes from "./routes/upload.js";
import dashboardRoutes from "./routes/dashboard.js";
import settingsRoutes from "./routes/settings.js";
import adminRoutes from "./routes/adminRoutes.js";
import heroImageGridRoutes from "./routes/heroImageGrid.js";

dotenv.config();

const app = express();

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://adra.rifkhan.xyz",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_WWW,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

if (!isLambda) {
  app.use("/uploads", express.static(path.resolve("uploads")));
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Photography Shop API is running.",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "ADRA backend is running.",
    environment: process.env.NODE_ENV || "development",
    lambda: isLambda,
  });
});

app.get("/api/debug-version", (_req, res) => {
  res.json({
    success: true,
    version: "adra-backend-esm-fixed-v1",
    time: new Date().toISOString(),
    lambda: isLambda,
    env: {
      AWS_REGION: process.env.AWS_REGION || null,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ? "set" : "missing",
      DYNAMODB_TABLE_PREFIX: process.env.DYNAMODB_TABLE_PREFIX || null,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/hero-image-grid", heroImageGridRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
  console.error("BACKEND ERROR:", {
    path: req.originalUrl,
    method: req.method,
    name: err.name,
    code: err.code,
    message: err.message,
    stack: err.stack,
  });

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Image is too large. Please upload compressed images below 2 MB.",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({
      success: false,
      message: "Too many images. Please upload maximum 8 images at once.",
    });
  }

  if (err.message?.includes("Only JPG")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    path: req.originalUrl,
    method: req.method,
    name: err.name,
    code: err.code,
    message: err.message || "Server error.",
  });
});

export default app;