import { db } from "./db";
import { usersTable, classesTable, sectionsTable, studentsTable } from "./db/schema.ts";

async function seedDatabase() {
  // ======================
  // DELETE ALL TABLES FIRST
  // ======================
  await db.delete(studentsTable).execute();
  await db.delete(usersTable).execute();
  await db.delete(classesTable).execute();
  await db.delete(sectionsTable).execute();
  console.log("🗑️  All tables cleared!");

  // ======================
  // 1️⃣ Seed Users
  // ======================
  const users = [
    { name: "Alice Johnson", age: 25, email: "alice@example.com" },
    { name: "Bob Smith", age: 30, email: "bob@example.com" },
    { name: "Charlie Brown", age: 22, email: "charlie@example.com" },
    { name: "David Lee", age: 28, email: "david@example.com" },
    { name: "Eva Green", age: 35, email: "eva@example.com" },
    { name: "Frank White", age: 40, email: "frank@example.com" },
    { name: "Grace Kim", age: 27, email: "grace@example.com" },
    { name: "Henry Adams", age: 32, email: "henry@example.com" },
    { name: "Isla Moore", age: 29, email: "isla@example.com" },
    { name: "Jack Wilson", age: 24, email: "jack@example.com" },
    { name: "Karen Taylor", age: 31, email: "karen@example.com" },
    { name: "Liam Scott", age: 26, email: "liam@example.com" },
    { name: "Mia Davis", age: 33, email: "mia@example.com" },
    { name: "Noah Clark", age: 23, email: "noah@example.com" },
    { name: "Olivia Lewis", age: 34, email: "olivia@example.com" },
  ];
  await db.insert(usersTable).values(users);
  console.log("✅ 15 dummy users inserted!");

  // ======================
  // 2️⃣ Seed Classes (Nursery → 12th)
  // ======================
  const classes = [
    { name: "Nursery" },
    { name: "LKG" },
    { name: "UKG" },
    { name: "1st Grade" },
    { name: "2nd Grade" },
    { name: "3rd Grade" },
    { name: "4th Grade" },
    { name: "5th Grade" },
    { name: "6th Grade" },
    { name: "7th Grade" },
    { name: "8th Grade" },
    { name: "9th Grade" },
    { name: "10th Grade" },
    { name: "11th Grade" },
    { name: "12th Grade" },
  ];
  await db.insert(classesTable).values(classes);
  console.log("✅ Classes inserted!");

  // ======================
  // 3️⃣ Seed Sections
  // ======================
  const sections = [
    { name: "A" },
    { name: "B" },
    { name: "C" },
  ];
  await db.insert(sectionsTable).values(sections);
  console.log("✅ Sections inserted!");

  // ======================
  // 4️⃣ Fetch inserted class and section IDs
  // ======================
  const insertedClasses = await db.select().from(classesTable);
  const insertedSections = await db.select().from(sectionsTable);

  const getRandomClassId = () =>
    insertedClasses[Math.floor(Math.random() * insertedClasses.length)]!.id;
  const getRandomSectionId = () =>
    insertedSections[Math.floor(Math.random() * insertedSections.length)]!.id;

  // ======================
  // 5️⃣ Seed Students
  // ======================
  const students = [
    { name: "Syed Qader", age: 17, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Farhan Quadri", age: 16, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Rehan Quadri", age: 18, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Ayan Khan", age: 17, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Sara Ahmed", age: 16, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Ali Shaikh", age: 17, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Zoya Patel", age: 18, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Hassan Raza", age: 17, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Fatima Noor", age: 16, classId: getRandomClassId(), sectionId: getRandomSectionId() },
    { name: "Aisha Khan", age: 18, classId: getRandomClassId(), sectionId: getRandomSectionId() },
  ];
  await db.insert(studentsTable).values(students);
  console.log("✅ Students inserted!");
}

// Run the seed script
seedDatabase()
  .then(() => {
    console.log("🌱 Database seeded successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  });
