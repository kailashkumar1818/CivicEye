import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { query } from '../db/pool.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }

  // Verify user in database
  const userResult = await query(
    `SELECT id, name, email, phone, avatar_url, city, role, department_id, email_notifications, is_active, created_at 
     FROM users 
     WHERE id = $1`,
    [decoded.id]
  );

  if (userResult.rows.length === 0) {
    throw ApiError.unauthorized('User associated with this token no longer exists', 'USER_NOT_FOUND');
  }

  const user = userResult.rows[0];
  if (!user.is_active) {
    throw ApiError.forbidden('This account has been deactivated', 'ACCOUNT_DEACTIVATED');
  }

  req.user = user;
  next();
});

export default authenticate;

