import express from "express";
import bcrypt from "bcryptjs";

import {
  TABLES,
  makeId,
  now,
  scanAll,
  getItem,
  putItem,
  updateItem,
  deleteItem,
} from "../config/db.js";

import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function removePassword(admin) {
  if (!admin) return admin;

  const { password, password_hash, ...safeAdmin } = admin;
  return safeAdmin;
}

function canSeeAdmin(currentAdmin, targetAdmin) {
  if (currentAdmin.role === "super_admin") return true;

  // Normal admin cannot see super admin data
  return targetAdmin.role !== "super_admin";
}

function canManageAdmin(currentAdmin, targetAdmin) {
  if (currentAdmin.role === "super_admin") return true;

  // Normal admin can manage only normal admin users
  return targetAdmin.role !== "super_admin";
}

/**
 * GET /api/admins
 * super_admin sees all
 * admin sees only admins, not super_admin
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const admins = await scanAll(TABLES.admins);

    const visibleAdmins = admins
      .filter((item) => canSeeAdmin(req.admin, item))
      .map(removePassword)
      .sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
      );

    return res.json(visibleAdmins);
  } catch (error) {
    console.error("Load admins error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin users.",
    });
  }
});

/**
 * POST /api/admins
 * super_admin can create admin/super_admin
 * admin can create only admin
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const admins = await scanAll(TABLES.admins);
    const existing = admins.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Admin email already exists.",
      });
    }

    let finalRole = role || "admin";

    // Normal admin cannot create super admin
    if (req.admin.role !== "super_admin") {
      finalRole = "admin";
    }

    if (!["admin", "super_admin"].includes(finalRole)) {
      finalRole = "admin";
    }

    const createdAt = now();

    const newAdmin = {
      id: makeId(),
      name,
      email: email.toLowerCase(),
      password_hash: await bcrypt.hash(password, 10),
      role: finalRole,
      created_at: createdAt,
      updated_at: createdAt,
    };

    await putItem(TABLES.admins, newAdmin);

    return res.status(201).json({
      success: true,
      message: "Admin user created.",
      admin: removePassword(newAdmin),
    });
  } catch (error) {
    console.error("Create admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create admin user.",
    });
  }
});

/**
 * PUT /api/admins/:id
 * super_admin can edit all
 * admin can edit only normal admins
 */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const targetAdmin = await getItem(TABLES.admins, req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found.",
      });
    }

    if (!canManageAdmin(req.admin, targetAdmin)) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage super admin users.",
      });
    }

    const updates = {
      updated_at: now(),
    };

    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email.toLowerCase();

    if (req.body.password) {
      updates.password_hash = await bcrypt.hash(req.body.password, 10);
    }

    if (req.body.role) {
      let finalRole = req.body.role;

      // Normal admin cannot promote anyone to super admin
      if (req.admin.role !== "super_admin" && finalRole === "super_admin") {
        return res.status(403).json({
          success: false,
          message: "Only super admin can assign super admin role.",
        });
      }

      if (!["admin", "super_admin"].includes(finalRole)) {
        finalRole = "admin";
      }

      updates.role = finalRole;
    }

    await updateItem(TABLES.admins, req.params.id, updates);

    return res.json({
      success: true,
      message: "Admin user updated.",
    });
  } catch (error) {
    console.error("Update admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update admin user.",
    });
  }
});

/**
 * DELETE /api/admins/:id
 * super_admin can delete all except self
 * admin can delete only normal admins except self
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const targetAdmin = await getItem(TABLES.admins, req.params.id);

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found.",
      });
    }

    if (!canManageAdmin(req.admin, targetAdmin)) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete super admin users.",
      });
    }

    await deleteItem(TABLES.admins, req.params.id);

    return res.json({
      success: true,
      message: "Admin user deleted.",
    });
  } catch (error) {
    console.error("Delete admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete admin user.",
    });
  }
});

export default router;
