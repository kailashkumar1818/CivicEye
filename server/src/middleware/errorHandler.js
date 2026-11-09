import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // If response already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details,
      },
    });
  }

  // Handle syntax/JSON parse errors from body-parser
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload',
        details: [],
      },
    });
  }

  // Log unexpected errors
  logger.error(
    {
      err: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error'
  );

  const statusCode = err.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details: env.NODE_ENV === 'development' && err.stack ? [err.stack] : [],
    },
  });
}

export default errorHandler;

