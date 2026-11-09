import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../db/pool.js';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

const BCRYPT_ROUNDS = 12;

/**
 * Generate a SHA-256 hash of a token for secure database storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Parse an expiry string like '7d' or '15m' to a Date object
 */
function calculateExpiry(expiryString) {
  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}

/**
 * Generate an Access Token and a Refresh Token, saving the hashed refresh token to DB
 */
async function generateTokenPair(user) {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = calculateExpiry(env.JWT_REFRESH_EXPIRY);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  return {
    accessToken,
    refreshToken: rawRefreshToken,
  };
}

export const authService = {
  /**
   * Register a new citizen
   */
  async register({ name, email, password, phone }) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw ApiError.conflict('An account with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'citizen')
       RETURNING id, name, email, phone, avatar_url, city, role, department_id, email_notifications, is_active, created_at`,
      [name, email.toLowerCase(), passwordHash, phone || null]
    );

    const user = result.rows[0];
    const tokens = await generateTokenPair(user);

    logger.info({ userId: user.id }, 'Citizen registered successfully');

    return {
      user,
      ...tokens,
    };
  },

  /**
   * Authenticate user with email and password
   */
  async login({ email, password }) {
    const result = await query(
      `SELECT id, name, email, password_hash, phone, avatar_url, city, role, department_id, email_notifications, is_active, created_at
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw ApiError.forbidden('This account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Do not return password hash
    delete user.password_hash;

    const tokens = await generateTokenPair(user);

    logger.info({ userId: user.id, role: user.role }, 'User logged in successfully');

    return {
      user,
      ...tokens,
    };
  },

  /**
   * Rotate refresh token and issue new token pair
   */
  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(refreshToken);

    const tokenResult = await query(
      `SELECT id, user_id, expires_at, revoked_at
       FROM refresh_tokens 
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const storedToken = tokenResult.rows[0];

    // Token reuse detection: if a revoked token is used again, revoke all tokens for this user!
    if (storedToken.revoked_at !== null) {
      logger.warn({ userId: storedToken.user_id }, 'Revoked refresh token reuse detected! Revoking all sessions.');
      await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1', [storedToken.user_id]);
      throw ApiError.unauthorized('Invalid refresh token (reused)', 'TOKEN_REUSE_DETECTED');
    }

    // Check expiration
    if (new Date(storedToken.expires_at) < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired, please log in again', 'REFRESH_TOKEN_EXPIRED');
    }

    // Revoke old token as part of rotation
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [storedToken.id]);

    // Fetch user
    const userResult = await query(
      `SELECT id, name, email, phone, avatar_url, city, role, department_id, email_notifications, is_active, created_at 
       FROM users 
       WHERE id = $1`,
      [storedToken.user_id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw ApiError.unauthorized('User not found or inactive', 'USER_INACTIVE');
    }

    const user = userResult.rows[0];
    const tokens = await generateTokenPair(user);

    return {
      user,
      ...tokens,
    };
  },

  /**
   * Revoke refresh token on logout
   */
  async logout({ refreshToken, userId }) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [tokenHash]);
    } else if (userId) {
      await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1', [userId]);
    }

    return true;
  },
};

export default authService;

