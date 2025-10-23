import { Hono } from "hono";
import { db } from "./drizzle/db";
import { usersTable } from "./drizzle/db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

app.use(logger());

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// GET ALL USERS (newest first)
app.get("/api/users", async (c) => {
  const users = await db.query.usersTable.findMany({
    orderBy: desc(usersTable.id),
  });
  return c.json({ success: true, data: users }, 200);
});

// CREATE NEW USER
app.post("/api/create-user", async (c) => {
  try {
    const { name, age, email } = await c.req.json();
    if (!name || !age || !email)
      return c.json({ success: false, message: "Name, age, and email required" }, 400);

    await db.insert(usersTable).values({ name, age, email });

    return c.json({ success: true, data: { name, age, email }, message: "User created ✅" }, 201);
  } catch (err: any) {
    if (err?.message?.includes("duplicate key value"))
      return c.json({ success: false, message: "Email already exists" }, 409);

    console.error("Error:", err);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
});

// GET USER BY EMAIL
app.get("/api/user/:email", async (c) => {
  const email = c.req.param("email");
  const user = await db.query.usersTable.findMany({
    where: eq(usersTable.email, email),
  });
  return c.json({ success: true, data: user }, 200);
});

// UPDATE USER BY ID
app.put("/api/user/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { name, age, email } = await c.req.json();
    if (!name && !age && !email)
      return c.json({ success: false, message: "Provide at least one field to update" }, 400);

    const updateData: Partial<{ name: string; age: number; email: string }> = {};
    if (name) updateData.name = name;
    if (age) updateData.age = age;
    if (email) updateData.email = email;

    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id));

    if (result.rowCount === 0) return c.json({ success: false, message: "User not found" }, 404);

    return c.json({ success: true, data: updateData, message: "User updated ✅" }, 200);
  } catch (err: any) {
    if (err?.message?.includes("duplicate key value"))
      return c.json({ success: false, message: "Email already exists" }, 409);

    console.error("Error:", err);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
});

// DELETE USER BY ID
app.delete("/api/user/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const result = await db.delete(usersTable).where(eq(usersTable.id, id));

    if (result.rowCount === 0)
      return c.json({ success: false, message: "User not found" }, 404);

    return c.json({ success: true, message: "User deleted ✅" }, 200);
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
});

// START BUN SERVER
Bun.serve({
  port: 4000,
  fetch: app.fetch,
});

console.log("🔥 Server running on http://localhost:4000");
