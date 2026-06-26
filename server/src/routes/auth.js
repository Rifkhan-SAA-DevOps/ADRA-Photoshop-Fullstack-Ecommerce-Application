import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/auth.js";
import { TABLES, getItem, putItem, scanAll, now, updateItem, } from "../config/db.js";
import nodemailer from 'nodemailer';
import crypto from "crypto";
import { randomBytes, createHash } from "node:crypto";
const router = express.Router();

async function findAdminByEmail(email) {
  const admins = await scanAll(TABLES.admins);

  return (
    admins.find(
      (admin) => admin.email?.toLowerCase() === email.toLowerCase(),
    ) || null
  );
}

function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendResetEmail(to, resetUrl) {
  const hasSmtp =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtp) {
    console.log("======================================");
    console.log("PASSWORD RESET LINK:");
    console.log(resetUrl);
    console.log("======================================");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "ADRA Admin Password Reset",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111">
        <h2>ADRA Admin Password Reset</h2>
        <p>You requested to update your admin password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#ec4899;color:white;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
            Update Password
          </a>
        </p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const admin = await findAdminByEmail(email);

    if (!admin) {
      return res.status(401).json({ message: "Invalid login details." });
    }

    if (admin.status && admin.status !== "active") {
      return res.status(403).json({ message: "Admin account is inactive." });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid login details." });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

router.put("/profile", requireAdmin, async (req, res, next) => {
  try {
    const adminId = req.admin?.id || req.user?.id || req.auth?.id;

    if (!adminId) {
      return res.status(401).json({
        message: "Unauthorized. Please login again.",
      });
    }

    const admin = await getItem(TABLES.admins, adminId);

    if (!admin) {
      return res.status(404).json({
        message: "Admin account not found.",
      });
    }

    const { name, email, current_password, new_password } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const currentPassword = String(current_password || "");
    const newPassword = String(new_password || "");

    const errors = {};

    if (!cleanName) {
      errors.name = "Admin name is required.";
    }

    if (!cleanEmail) {
      errors.email = "Admin email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (newPassword && !currentPassword) {
      errors.current_password =
        "Current password is required when changing password.";
    }

    if (currentPassword && !newPassword) {
      errors.new_password = "Please enter a new password.";
    }

    if (newPassword && newPassword.length < 8) {
      errors.new_password = "New password must be at least 8 characters.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const admins = await scanAll(TABLES.admins);

    const emailAlreadyUsed = admins.some(
      (item) =>
        item.id !== admin.id &&
        String(item.email || "").toLowerCase() === cleanEmail,
    );

    if (emailAlreadyUsed) {
      return res.status(400).json({
        message: "This email address is already used by another admin.",
        errors: {
          email: "This email address is already used by another admin.",
        },
      });
    }

    const updatedAdmin = {
      ...admin,
      name: cleanName,
      email: cleanEmail,
      updated_at: now(),
    };

    if (newPassword) {
      const passwordHash = admin.password_hash || admin.password;

      const isCurrentPasswordCorrect = await bcrypt.compare(
        currentPassword,
        passwordHash,
      );

      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          message: "Current password is incorrect.",
          errors: {
            current_password: "Current password is incorrect.",
          },
        });
      }

      updatedAdmin.password_hash = await bcrypt.hash(newPassword, 10);

      delete updatedAdmin.password;
    }

    await putItem(TABLES.admins, updatedAdmin);

    const safeAdmin = {
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      created_at: updatedAdmin.created_at,
      updated_at: updatedAdmin.updated_at,
    };

    res.json({
      message: "Profile updated successfully.",
      admin: safeAdmin,
    });
  } catch (error) {
    next(error);
  }
});


/**
 * POST /api/auth/forgot-password
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const admins = await scanAll(TABLES.admins);
    const admin = admins.find(
      (item) => item.email?.toLowerCase() === email
    );

    if (!admin) {
      return res.json({
        success: true,
        message: "If this email exists, a password reset link has been sent.",
      });
    }

   const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await updateItem(TABLES.admins, admin.id, {
      reset_token_hash: tokenHash,
      reset_token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const resetUrl = `${frontendUrl}/admin/update-password?token=${token}`;

    try {
      await sendResetEmail(admin.email, resetUrl);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      console.log("======================================");
      console.log("EMAIL FAILED, USE THIS RESET LINK:");
      console.log(resetUrl);
      console.log("======================================");
    }

    return res.json({
      success: true,
      message: "If this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request.",
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const tokenHash = hashResetToken(token);

    const admins = await scanAll(TABLES.admins);
    const admin = admins.find(
      (item) => item.reset_token_hash === tokenHash
    );

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link.',
      });
    }

    const expiresAt = new Date(admin.reset_token_expires_at).getTime();

    if (!expiresAt || expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await updateItem(TABLES.admins, admin.id, {
      password_hash: passwordHash,
      reset_token_hash: null,
      reset_token_expires_at: null,
      updated_at: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Password updated successfully. You can now login.',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update password.',
    });
  }
});


export default router;