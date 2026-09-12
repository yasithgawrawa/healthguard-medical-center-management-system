import mongoose from "mongoose";
import { env } from "./env.js";

let cachedConnection = null;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    cachedConnection = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 25000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4 first to prevent IPv6 DNS stall on Windows
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};
