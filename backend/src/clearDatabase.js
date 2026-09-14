import mongoose from "mongoose";
import { connectDatabase } from "./shared/config/database.js";

console.log("Connecting to MongoDB...");
await connectDatabase();
console.log(`Connected to database: ${mongoose.connection.name}`);

const db = mongoose.connection.db;
const collections = await db.listCollections().toArray();

console.log(`\nFound ${collections.length} collections. Dropping all documents...\n`);

for (const col of collections) {
  const result = await db.collection(col.name).deleteMany({});
  console.log(`  ✓ ${col.name}: ${result.deletedCount} documents deleted`);
}

console.log("\n✅ All collections cleared successfully.");
await mongoose.connection.close();
process.exit(0);
