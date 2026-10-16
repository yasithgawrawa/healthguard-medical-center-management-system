// Provide shared auth behavior for the application.
import jwt from "jsonwebtoken";
import { User } from "../../components/epic1_user_staff/models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Verify the JWT, load the active user, and attach that user to the request.
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    // Extract the token from the Authorization header only when it uses the Bearer format.
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new AppError("Not authenticated", 401);
    }

    // Verify the token signature and expiry before trusting its subject.
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user || user.status !== "active") {
      throw new AppError("Account is inactive or unavailable", 401);
    }

    // Make the authenticated database user available to later role checks and controllers.
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token", 401));
    }
    next(error);
  }
};

// Allow the request only when the authenticated user has one of the permitted roles.
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Not authenticated", 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError("Not authorized for this action", 403));
  }

  next();
};
