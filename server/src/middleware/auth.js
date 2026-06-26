import jwt from "jsonwebtoken";
import { getItem, TABLES } from "../config/db.js";

export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication token required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    if (!payload?.id) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    const admin = await getItem(TABLES.admins, payload.id);

    if (!admin) {
      return res.status(401).json({ message: "Admin account not found." });
    }

    if (admin.status && admin.status !== "active") {
      return res.status(403).json({ message: "Admin account is inactive." });
    }

    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}