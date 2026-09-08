export const validateRequest = (schema) => (req, res, next) => {
  const parsed = schema.parse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (parsed.body) req.body = parsed.body;
  if (parsed.params) Object.assign(req.params, parsed.params);
  if (parsed.query) req.validatedQuery = parsed.query;
  next();
};
