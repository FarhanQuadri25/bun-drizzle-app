import { Hono } from "hono";
import { db } from "./drizzle/db";
import { allotmentsTable, classesTable, sectionsTable, studentsTable, usersTable } from "./drizzle/db/schema";
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

// =====================
// GET ALL USERS
// =====================
app.get("/api/users", async (c) => {
  try {
    const users = await db.query.usersTable.findMany({
      orderBy: desc(usersTable.id),
    });
    return c.json({ success: true, data: users }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to fetch users" }, 500);
  }
});

// =====================
// GET ALL CLASSES
// =====================
app.get("/api/classes", async (c) => {
  try {
    const classes = await db.query.classesTable.findMany({
      orderBy: desc(classesTable.id),
    });
    return c.json({ success: true, data: classes }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to fetch classes" }, 500);
  }
});

// =====================
// GET ALL SECTIONS
// =====================
app.get("/api/sections", async (c) => {
  try {
    const sections = await db.query.sectionsTable.findMany({
      orderBy: desc(sectionsTable.id),
    });
    return c.json({ success: true, data: sections }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Failed to fetch sections" }, 500);
  }
});

// =====================
// GET ALL STUDENTS (with class and section info)
// =====================
app.get("/api/students", async (c) => {
  try {
    // Fetch all students, newest first by ID
    const students = await db.query.studentsTable.findMany({
      orderBy: desc(studentsTable.id),
    });

    return c.json({ success: true, data: students }, 200);
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: "Failed to fetch students" }, 500);
  }
});

app.post("/api/create-allotment", async (c) => {
  try {
    const { studentId, classId, sectionId } = await c.req.json();

    // Validation
    if (!studentId || !classId || !sectionId) {
      return c.json(
        {
          success: false,
          message: "studentId, classId, and sectionId are required",
        },
        400
      );
    }

    // Insert allotment
    await db.insert(allotmentsTable).values({
      studentId,
      classId,
      sectionId,
    });

    return c.json(
      {
        success: true,
        data: { studentId, classId, sectionId },
        message: "Allotment created successfully ✅",
      },
      201
    );
  } catch (err: any) {
    // Handle duplicate allotment (unique index violation)
    if (err?.message?.includes("duplicate key value")) {
      return c.json(
        {
          success: false,
          message:
            "This student is already allotted to the same class and section ❌",
        },
        409
      );
    }

    console.error("Error creating allotment:", err);
    return c.json(
      { success: false, message: "Internal server error" },
      500
    );
  }
});

app.get("/api/allotments", async (c) => {
  try {
    // Join allotments with students, classes, and sections
    const allotments = await db
      .select({
        id: allotmentsTable.id,
        createdAt: allotmentsTable.createdAt,

        studentId: studentsTable.id,
        studentName: studentsTable.name,
        studentAge: studentsTable.age,

        classId: classesTable.id,
        className: classesTable.name,

        sectionId: sectionsTable.id,
        sectionName: sectionsTable.name,
      })
      .from(allotmentsTable)
      .leftJoin(studentsTable, eq(allotmentsTable.studentId, studentsTable.id))
      .leftJoin(classesTable, eq(allotmentsTable.classId, classesTable.id))
      .leftJoin(sectionsTable, eq(allotmentsTable.sectionId, sectionsTable.id))
      .orderBy(allotmentsTable.id);

    return c.json({ success: true, data: allotments }, 200);
  } catch (err) {
    console.error("Error fetching allotments:", err);
    return c.json(
      { success: false, message: "Failed to fetch allotments" },
      500
    );
  }
});

// ✅ UPDATE ALLOTMENT (PUT)
app.put("/api/allotments/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { classId, sectionId } = await c.req.json();

    if (!classId || !sectionId) {
      return c.json(
        { success: false, message: "classId and sectionId are required" },
        400
      );
    }

    const updated = await db
      .update(allotmentsTable)
      .set({ classId, sectionId })
      .where(eq(allotmentsTable.id, id))
      .returning();

    if (updated.length === 0) {
      return c.json({ success: false, message: "Allotment not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Allotment updated successfully ✅",
      data: updated[0],
    });
  } catch (err) {
    console.error("Error updating allotment:", err);
    return c.json(
      { success: false, message: "Failed to update allotment" },
      500
    );
  }
});

// ✅ DELETE ALLOTMENT
app.delete("/api/allotments/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const deleted = await db
      .delete(allotmentsTable)
      .where(eq(allotmentsTable.id, id))
      .returning();

    if (deleted.length === 0) {
      return c.json({ success: false, message: "Allotment not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Allotment deleted successfully 🗑️",
      data: deleted[0],
    });
  } catch (err) {
    console.error("Error deleting allotment:", err);
    return c.json(
      { success: false, message: "Failed to delete allotment" },
      500
    );
  }
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
