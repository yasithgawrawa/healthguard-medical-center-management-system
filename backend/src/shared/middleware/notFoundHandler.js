import { AppError } from "../utils/AppError.js";

// Forward unmatched request URLs as a 404 application error.
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};
