import ApiError from '../utils/ApiError.js';

/**
 * Middleware to restrict access based on user role
 * @param  {...string} allowedRoles - E.g. 'admin', 'officer', 'citizen'
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(
        `Forbidden: Role '${req.user.role}' does not have permission to access this resource`
      )
    );
  }

  next();
};

export default requireRole;

