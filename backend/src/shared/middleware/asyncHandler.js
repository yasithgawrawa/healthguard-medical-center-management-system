// Forward rejected asynchronous route handlers to the shared error middleware.
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
