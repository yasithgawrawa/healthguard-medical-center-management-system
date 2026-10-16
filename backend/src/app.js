// API Setup | Shared Logic | Configure Express middleware, API route prefixes, health checks, and centralized error handling.
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./components/epic1_user_staff/routes/authRoutes.js";
import staffRoutes from "./components/epic1_user_staff/routes/staffRoutes.js";
import workforceRoutes from "./components/epic1_user_staff/routes/workforceRoutes.js";
import patientNoticeRoutes from "./components/epic2_clinical/routes/patientNoticeRoutes.js";
import clinicalRoutes from "./components/epic2_clinical/routes/clinicalRoutes.js";
import inventoryRoutes from "./components/epic3_inventory/routes/inventoryRoutes.js";
import billingRoutes from "./components/epic4_billing/routes/billingRoutes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { notFoundHandler } from "./shared/middleware/notFoundHandler.js";
import { successResponse } from "./shared/utils/apiResponse.js";
import { env } from "./shared/config/env.js";

let announcementRoutesPromise;

// API Setup | Shared Logic | Load and cache the announcement router on its first request.
const loadAnnouncementRoutes = async (req, res, next) => {
  try {
    announcementRoutesPromise ||= import("./components/epic1_user_staff/routes/announcementRoutes.js")
      .then((module) => module.default);
    const announcementRoutes = await announcementRoutesPromise;
    return announcementRoutes(req, res, next);
  } catch (error) {
    return next(error);
  }
};

const app = express();
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const allowedOrigins = new Set([
  env.CLIENT_ORIGIN,
  vercelOrigin,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean));

// API Setup | Shared Logic | Accept HTTPS origins whose hostname ends with .vercel.app.
const isAllowedVercelPreview = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

// API Setup | Shared Logic | Accept local HTTP development origins on ports from 5100 to 5199.
const isAllowedLocalDevelopment = (origin) => {
  try {
    const { hostname, port, protocol } = new URL(origin);
    return (hostname === "localhost" || hostname === "127.0.0.1") &&
      protocol === "http:" &&
      /^51[0-9]{2}$/.test(port);
  } catch {
    return false;
  }
};

app.use(helmet());
app.use(cors({
  // API Setup | Shared Logic | Allow configured frontend origins and supported preview or development origins through CORS.
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin) || isAllowedVercelPreview(origin) || isAllowedLocalDevelopment(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  return successResponse(res, "Health Guard API is healthy", {
    service: "healthguard-backend"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/e1/announcements", loadAnnouncementRoutes);
app.use("/api/e1/staff", staffRoutes);
app.use("/api/e1/workforce", workforceRoutes);
app.use("/api/e2/clinical", clinicalRoutes);
app.use("/api/e2/patient-notices", patientNoticeRoutes);
app.use("/api/e3/inventory", inventoryRoutes);
app.use("/api/e4/billing", billingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
