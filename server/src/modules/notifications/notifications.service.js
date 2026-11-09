import { pool } from '../../db/pool.js';
import logger from '../../utils/logger.js';

export const notificationsService = {
  /**
   * Create an in-app notification
   */
  async createNotification({ userId, reportId, title, message }) {
    if (!userId || !title || !message) return null;

    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, report_id, title, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, report_id, title, message, is_read, created_at`,
        [userId, reportId || null, title, message]
      );
      return result.rows[0];
    } catch (err) {
      logger.error({ err: err.message, userId }, 'Failed to create notification');
      return null;
    }
  },

  /**
   * Get notifications for a user
   */
  async getNotifications(userId, { unreadOnly = false } = {}) {
    let sql = `
      SELECT id, report_id, title, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];

    if (unreadOnly) {
      sql += ' AND is_read = false';
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const [listResult, countResult] = await Promise.all([
      pool.query(sql, params),
      pool.query(
        'SELECT COUNT(*)::int AS unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      ),
    ]);

    return {
      notifications: listResult.rows,
      unreadCount: countResult.rows[0]?.unread_count || 0,
    };
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING id, is_read`,
      [notificationId, userId]
    );
    return result.rows[0];
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return true;
  },
};

export default notificationsService;

