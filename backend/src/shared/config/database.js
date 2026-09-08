import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error.message);
    process.exit(1);
  }
};
