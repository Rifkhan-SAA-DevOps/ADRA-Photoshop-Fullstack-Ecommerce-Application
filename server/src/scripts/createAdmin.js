import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { TABLES, makeId, now, putItem, scanAll } from "../config/db.js";

dotenv.config();

async function main() {
  const name = process.env.ADMIN_NAME || "ADRA";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const role = process.env.ADMIN_ROLE || "super_admin";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
    process.exit(1);
  }

  const admins = await scanAll(TABLES.admins);

  const existingAdmin = admins.find(
    (admin) => admin.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existingAdmin) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = now();

  const admin = {
    id: makeId("admin"),
    name,
    email,
    password_hash: passwordHash,
    role,
    status: "active",
    created_at: createdAt,
    updated_at: createdAt,
  };

  await putItem(TABLES.admins, admin);

  console.log("Admin created successfully.");
  console.log({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
}

main().catch((error) => {
  console.error("Failed to create admin:");
  console.error(error);
  process.exit(1);
});