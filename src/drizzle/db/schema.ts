import { integer, pgTable, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// ================================
// USERS TABLE
// ================================
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

// ================================
// CLASSES TABLE
// ================================
export const classesTable = pgTable("classes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
});

// ================================
// SECTIONS TABLE
// ================================
export const sectionsTable = pgTable("sections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull(),
});

// ================================
// STUDENTS TABLE
// ================================
export const studentsTable = pgTable("students", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
});

// ================================
// ALLOTMENTS TABLE
// ================================
export const allotmentsTable = pgTable(
  "allotments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // Foreign keys
    studentId: integer()
      .references(() => studentsTable.id, { onDelete: "cascade" })
      .notNull(),

    classId: integer()
      .references(() => classesTable.id, { onDelete: "cascade" })
      .notNull(),

    sectionId: integer()
      .references(() => sectionsTable.id, { onDelete: "cascade" })
      .notNull(),

    // Timestamp
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Prevent duplicate allotments for same student-class-section
    uniqueStudentAllotment: uniqueIndex("unique_student_allotment").on(
      table.studentId,
      table.classId,
      table.sectionId
    ),
  })
);
