// Parse request data with Zod and pass the validated values to the controller.
export const validateRequest = (schema) => (req, res, next) => {
  const parsed = schema.parse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Use Zod's parsed values so trimming and numeric or date coercion reach the controller.
  if (parsed.body) req.body = parsed.body;
  if (parsed.params) Object.assign(req.params, parsed.params);
  if (parsed.query) req.validatedQuery = parsed.query;
  next();
};
