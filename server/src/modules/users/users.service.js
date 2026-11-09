import bcrypt from 'bcrypt';
import { query } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

const BCRYPT_ROUNDS = 12;

export const usersService = {
  /**
   * Get user profile along with complaint stats
   */
  async getProfileWithStats(userId) {
    const userResult = await query(
      `SELECT id, name, email, phone, avatar_url, city, role, department_id, email_notifications, is_active, created_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const user = userResult.rows[0];

    // Compute user report counts
    const statsResult = await query(
      `SELECT 
         COUNT(*)::int AS total_reports,
         COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'rejected'))::int AS open_reports,
         COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_reports
       FROM reports 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0] || {
      total_reports: 0,
      open_reports: 0,
      resolved_reports: 0,
    };

    return {
      ...user,
      stats: {
        totalReports: stats.total_reports,
        openReports: stats.open_reports,
        resolvedReports: stats.resolved_reports,
      },
    };
  },

  /**
   * Update profile fields (name, phone, city, notification preferences)
   */
  async updateProfile(userId, { name, phone, city, email_notifications }) {
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(phone);
    }
    if (city !== undefined) {
      updates.push(`city = $${idx++}`);
      values.push(city);
    }
    if (email_notifications !== undefined) {
      updates.push(`email_notifications = $${idx++}`);
      values.push(email_notifications);
    }

    if (updates.length === 0) {
      return this.getProfileWithStats(userId);
    }

    values.push(userId);
    const sql = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${idx}
      RETURNING id, name, email, phone, avatar_url, city, role, department_id, email_notifications, is_active, created_at
    `;

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      throw ApiError.notFound('User not found');
    }

    logger.info({ userId }, 'User updated profile');
    return result.rows[0];
  },

  /**
   * Change user password
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw ApiError.notFound('User not found');
    }

    const { password_hash } = userResult.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, password_hash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    // Revoke all refresh tokens to terminate old sessions
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1', [userId]);

    logger.info({ userId }, 'User password changed successfully');
    return true;
  },

  /**
   * Update avatar URL
   */
  async updateAvatar(userId, avatarUrl) {
    const result = await query(
      `UPDATE users 
       SET avatar_url = $1 
       WHERE id = $2 
       RETURNING id, name, email, avatar_url`,
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('User not found');
    }

    return result.rows[0];
  },
};

export default usersService;

