export class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details = []) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = []) {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details = []) {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = []) {
    return new ApiError(404, message, code, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details = []) {
    return new ApiError(409, message, code, details);
  }

  static tooLarge(message = 'File too large', code = 'FILE_TOO_LARGE', details = []) {
    return new ApiError(413, message, code, details);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED', details = []) {
    return new ApiError(429, message, code, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details = []) {
    return new ApiError(500, message, code, details);
  }

  static badGateway(message = 'Bad gateway', code = 'BAD_GATEWAY', details = []) {
    return new ApiError(502, message, code, details);
  }
}

export default ApiError;

