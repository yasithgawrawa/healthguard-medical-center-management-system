import jwt from "jsonwebtoken";
import { User } from "../../components/epic1_user_staff/models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new AppError("Not authenticated", 401);
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user || user.status !== "active") {
      throw new AppError("Account is inactive or unavailable", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token", 401));
    }
    next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not authenticated", 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError("Not authorized for this action", 403));
  }

  next();
};
