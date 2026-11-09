import { z } from 'zod';

/**
 * Zod validation middleware generator
 * @param {z.ZodSchema} schema - Zod schema to validate req against (body, query, params)
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace with parsed/sanitized data
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (error) {
    next(error);
  }
};

export default validate;

