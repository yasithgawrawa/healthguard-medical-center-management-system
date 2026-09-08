import { ZodError } from "zod";
import { errorResponse } from "../utils/apiResponse.js";

const formatZodErrors = (error) =>
  error.errors.reduce((acc, issue) => {
    const key = issue.path.join(".") || "request";
    acc[key] = issue.message;
    return acc;
  }, {});

export const errorHandler = (error, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  if (error instanceof ZodError) {
    return errorResponse(res, "Validation failed", 400, formatZodErrors(error));
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).reduce((acc, item) => {
      acc[item.path] = item.message;
      return acc;
    }, {});
    return errorResponse(res, "Validation failed", 400, errors);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "record";
    return errorResponse(res, "Duplicate value found", 409, {
      [field]: `${field} already exists`
    });
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Unexpected server error" : error.message;
  return errorResponse(res, message, statusCode, error.errors);
};
