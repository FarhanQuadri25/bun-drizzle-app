import { db } from "./db";
import { usersTable } from "./db/schema.ts";

async function seedUsers() {
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
}

// Run the seed script
seedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Error seeding users:", err);
        process.exit(1);
    });
