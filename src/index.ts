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
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.get("/api/users", async (c) => {
    const users = await db
        .select()
        .from(usersTable)
        .orderBy(desc(usersTable.id)); // newest first
    return c.json({ success: true, data: users }, 200);
});

app.post("/api/create-user", async (c) => {
    try {
        const { name, age, email } = await c.req.json();
        if (!name || !age || !email) {
            return c.json({ success: false, message: "Name, age, and email are required" }, 400);
        }

        await db.insert(usersTable).values({ name, age, email });

        return c.json(
            { success: true, data: { name, age, email }, message: "User created successfully ✅" },
            201
        );
    } catch (err: any) {
        if (err?.message?.includes("duplicate key value")) {
            return c.json({ success: false, message: "Email already exists" }, 409);
        }
        console.error("Error creating user:", err);
        return c.json({ success: false, message: "Internal server error" }, 500);
    }
});

app.get("/api/user/:email", async (c) => {
    const email = c.req.param("email");
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return c.json({ success: true, data: user }, 200);
});

Bun.serve({
    port: 4000,
    fetch: app.fetch,
});

console.log("🔥 Server running on http://localhost:4000");
