import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import productRoutes from './routes/products.js';
import reviewRoutes from './routes/reviews.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import contactRoutes from './routes/contact.js';
import uploadRoutes from './routes/upload.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/adminRoutes.js';
import heroImageGridRoutes from "./routes/heroImageGrid";
dotenv.config();

const app = express();

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
 
  process.env.FRONTEND_URL_WWW,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ''));

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, curl, Lambda health checks, and same-origin requests
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Local uploads folder only for local development.
// In Lambda, use S3 uploads instead because Lambda file storage is not permanent.
if (!isLambda) {
  app.use('/uploads', express.static(path.resolve('uploads')));
}

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Photography Shop API is running.',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ADRA backend is running.',
    environment: process.env.NODE_ENV || 'development',
    lambda: isLambda,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admins', adminRoutes);
app.use("/api/hero-image-grid", heroImageGridRoutes);


app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "Image is too large. Please upload compressed images below 2 MB.",
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({
      message: "Too many images. Please upload maximum 8 images at once.",
    });
  }

  if (err.message?.includes("Only JPG")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || "Server error.",
  });
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error('Server error:', error);

  const status = error.status || 500;

  res.status(status).json({
    success: false,
    message: error.message || 'Server error.',
    ...(process.env.NODE_ENV !== 'production' && {
      stack: error.stack,
    }),
  });
});

export default app;