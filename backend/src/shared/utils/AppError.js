// Shared Error Handling | Shared Logic | Provide shared app error behavior for the application.
export class AppError extends Error {
  // Shared Error Handling | Shared Logic | Create an operational error carrying an HTTP status and optional field errors.
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}
