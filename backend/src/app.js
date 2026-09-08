import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./components/epic1_user_staff/routes/authRoutes.js";
import staffRoutes from "./components/epic1_user_staff/routes/staffRoutes.js";
import workforceRoutes from "./components/epic1_user_staff/routes/workforceRoutes.js";
import clinicalRoutes from "./components/epic2_clinical/routes/clinicalRoutes.js";
import inventoryRoutes from "./components/epic3_inventory/routes/inventoryRoutes.js";
import billingRoutes from "./components/epic4_billing/routes/billingRoutes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { notFoundHandler } from "./shared/middleware/notFoundHandler.js";
import { successResponse } from "./shared/utils/apiResponse.js";
import { env } from "./shared/config/env.js";

const app = express();
const allowedOrigins = new Set([env.CLIENT_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"]);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
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
app.use("/api/e1/staff", staffRoutes);
app.use("/api/e1/workforce", workforceRoutes);
app.use("/api/e2/clinical", clinicalRoutes);
app.use("/api/e3/inventory", inventoryRoutes);
app.use("/api/e4/billing", billingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
