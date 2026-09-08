import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/healthguard",
  JWT_SECRET: process.env.JWT_SECRET || "development_only_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};

if (env.NODE_ENV === "production" && env.JWT_SECRET === "development_only_change_me") {
  throw new Error("JWT_SECRET must be configured in production.");
}
