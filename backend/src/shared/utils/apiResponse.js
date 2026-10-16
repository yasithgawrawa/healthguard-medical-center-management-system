// Shared API Responses | Shared Logic | Provide shared api response behavior for the application.
// Shared API Responses | Shared Logic | Send the shared success envelope with a message, payload, and HTTP status.
export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Shared API Responses | Shared Logic | Send the shared error envelope with optional field-level error details.
export const errorResponse = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
};
